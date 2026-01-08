/**
 * PDF Parser Utilities
 * Extract question structure from PDF files using OCR and pattern matching
 */

import PDFParser from 'pdf-parse';

/**
 * Detected question interface
 */
export interface DetectedQuestion {
  questionNumber: string;
  questionText?: string;
  marks?: number;
  pageNumber: number;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Parse result interface
 */
export interface ParseResult {
  totalQuestions: number;
  questions: DetectedQuestion[];
  totalPages: number;
  text: string; // Full extracted text for reference
}

/**
 * Question pattern matchers
 * Ordered by specificity (most specific first)
 */
const QUESTION_PATTERNS = [
  // Pattern: 1(a), 2(b), 3(c), etc. with optional period
  {
    regex: /^\s*(\d+)\s*\(([a-z])\)\.?\s+/gim,
    format: (num: string, sub: string) => `${num}(${sub})`,
    confidence: 'high' as const,
  },
  // Pattern: 1., 2., 3., etc.
  {
    regex: /^\s*(\d+)\.\s+/gm,
    format: (num: string) => `${num}`,
    confidence: 'high' as const,
  },
  // Pattern: Question 1, Question 2, etc.
  {
    regex: /^Question\s+(\d+)\.?\s+/gim,
    format: (num: string) => `Question ${num}`,
    confidence: 'high' as const,
  },
  // Pattern: Q1, Q2, Q3, etc.
  {
    regex: /^Q\.?\s*(\d+)\.?\s+/gim,
    format: (num: string) => `Q${num}`,
    confidence: 'medium' as const,
  },
  // Pattern: (a), (b), (c) (sub-questions without main number)
  {
    regex: /^\s*\(([a-z])\)\.?\s+/gim,
    format: (sub: string) => `(${sub})`,
    confidence: 'medium' as const,
  },
];

/**
 * Marks pattern matcher
 * Patterns: "5 marks", "(5)", "[5]", "5 Marks", "Marks: 5"
 */
const MARKS_PATTERNS = [
  /(\d+)\s*marks?/i,
  /\((\d+)\s*marks?\)/i,
  /\[(\d+)\s*marks?\]/i,
  /marks?\s*:?\s*(\d+)/i,
  /\((\d+)\)/,
  /\[(\d+)\]/,
];

/**
 * Parse PDF buffer and extract question structure
 * @param buffer - PDF file buffer
 * @returns Promise with parse result containing detected questions
 */
export async function parsePDFQuestions(buffer: Buffer): Promise<ParseResult> {
  try {
    // Extract text from PDF
    const data = await PDFParser(buffer);
    const text = data.text;
    const totalPages = data.numpages;

    // Split text into lines for analysis
    const lines = text.split('\n');

    // Detect questions
    const questions = detectQuestions(lines);

    return {
      totalQuestions: questions.length,
      questions,
      totalPages,
      text,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Detect questions from PDF text lines
 * @param lines - Array of text lines from PDF
 * @returns Array of detected questions
 */
function detectQuestions(lines: string[]): DetectedQuestion[] {
  const questions: DetectedQuestion[] = new Map<string, DetectedQuestion>();
  let currentPage = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Detect page breaks (heuristic: look for page numbers or "P. T. O.")
    if (isPageBreak(line)) {
      currentPage++;
      continue;
    }

    // Try to match question patterns
    for (const pattern of QUESTION_PATTERNS) {
      const match = line.match(pattern.regex);

      if (match) {
        const questionNumber = pattern.format(...match.slice(1));

        // Extract question text (rest of the line after question number)
        const questionText = line.replace(pattern.regex, '').trim();

        // Try to extract marks from this line or next few lines
        const marks = extractMarks(lines.slice(i, i + 3));

        // Create or update question
        if (!questions.has(questionNumber)) {
          questions.set(questionNumber, {
            questionNumber,
            questionText: questionText || undefined,
            marks,
            pageNumber: currentPage,
            confidence: pattern.confidence,
          });
        }

        break; // Stop after first match
      }
    }
  }

  // Convert Map to array and sort by question number
  return Array.from(questions.values()).sort((a, b) => {
    return compareQuestionNumbers(a.questionNumber, b.questionNumber);
  });
}

/**
 * Extract marks from text lines
 * @param lines - Array of text lines to search
 * @returns Marks value or undefined
 */
function extractMarks(lines: string[]): number | undefined {
  const text = lines.join(' ');

  for (const pattern of MARKS_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const marks = parseInt(match[1]);
      if (!isNaN(marks) && marks > 0 && marks <= 100) {
        return marks;
      }
    }
  }

  return undefined;
}

/**
 * Check if a line indicates a page break
 * @param line - Text line to check
 * @returns boolean indicating if this is likely a page break
 */
function isPageBreak(line: string): boolean {
  const pageBreakIndicators = [
    /P\.?\s*T\.?\s*O\.?/i, // "P. T. O." (Please Turn Over)
    /Page\s+\d+/i, // "Page 1", "Page 2", etc.
    /^\s*\d+\s*$/, // Just a page number
    /\[\s*\d+\s*\]/, // [1], [2], etc.
  ];

  return pageBreakIndicators.some((pattern) => pattern.test(line));
}

/**
 * Compare question numbers for sorting
 * Handles formats like "1", "1(a)", "Q1", "Question 1", etc.
 * @param a - First question number
 * @param b - Second question number
 * @returns Comparison result (-1, 0, 1)
 */
function compareQuestionNumbers(a: string, b: string): number {
  // Extract numeric part
  const numA = parseInt(a.match(/\d+/)?.[0] || '0');
  const numB = parseInt(b.match(/\d+/)?.[0] || '0');

  // If main numbers are different, sort by main number
  if (numA !== numB) {
    return numA - numB;
  }

  // If main numbers are same, check for sub-questions (a, b, c)
  const subA = a.match(/\(([a-z])\)/)?.[1];
  const subB = b.match(/\(([a-z])\)/)?.[1];

  if (subA && subB) {
    return subA.localeCompare(subB);
  } else if (subA) {
    return 1; // a comes after main question
  } else if (subB) {
    return -1;
  }

  return 0;
}

/**
 * Validate and clean detected questions
 * Removes duplicates and filters out false positives
 * @param questions - Array of detected questions
 * @returns Cleaned array of questions
 */
export function cleanQuestions(questions: DetectedQuestion[]): DetectedQuestion[] {
  // Remove duplicates based on question number
  const unique = new Map<string, DetectedQuestion>();

  questions.forEach((q) => {
    if (!unique.has(q.questionNumber)) {
      unique.set(q.questionNumber, q);
    }
  });

  // Filter out potential false positives
  const cleaned = Array.from(unique.values()).filter((q) => {
    // Question text should have some minimum length (if present)
    if (q.questionText && q.questionText.length < 3) {
      return false;
    }

    // Question number should be reasonable (1-100)
    const num = parseInt(q.questionNumber.match(/\d+/)?.[0] || '0');
    if (num < 1 || num > 100) {
      return false;
    }

    return true;
  });

  return cleaned;
}

/**
 * Extract total marks from PDF (usually mentioned at the beginning)
 * @param text - Full PDF text
 * @returns Total marks or undefined
 */
export function extractTotalMarks(text: string): number | undefined {
  const patterns = [
    /Maximum\s+Marks?\s*:?\s*(\d+)/i,
    /Total\s+Marks?\s*:?\s*(\d+)/i,
    /Marks?\s*:?\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const marks = parseInt(match[1]);
      if (!isNaN(marks) && marks >= 10 && marks <= 500) {
        return marks;
      }
    }
  }

  return undefined;
}

/**
 * Extract time duration from PDF
 * @param text - Full PDF text
 * @returns Time in minutes or undefined
 */
export function extractTimeDuration(text: string): number | undefined {
  const patterns = [
    /Time\s*:?\s*(\d+)\s*Hours?/i,
    /Duration\s*:?\s*(\d+)\s*Hours?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const hours = parseInt(match[1]);
      if (!isNaN(hours) && hours >= 1 && hours <= 8) {
        return hours * 60; // Convert to minutes
      }
    }
  }

  return undefined;
}
