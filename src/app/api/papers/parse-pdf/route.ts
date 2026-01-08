import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { parsePDFQuestions, cleanQuestions, extractTotalMarks } from '@/lib/pdfParser';
import { validateBuffer } from '@/lib/fileValidation';

/**
 * POST /api/papers/parse-pdf
 * Parse PDF file and extract question structure
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate PDF
    const validation = validateBuffer(buffer, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Parse PDF to extract questions
    const parseResult = await parsePDFQuestions(buffer);

    // Clean and validate detected questions
    const cleanedQuestions = cleanQuestions(parseResult.questions);

    // Extract total marks if available
    const totalMarks = extractTotalMarks(parseResult.text);

    // Return parsed data
    return NextResponse.json(
      {
        message: 'PDF parsed successfully',
        totalQuestions: cleanedQuestions.length,
        questions: cleanedQuestions,
        totalPages: parseResult.totalPages,
        totalMarks,
        // Include raw text for debugging (optional, can be removed in production)
        rawText: process.env.NODE_ENV === 'development' ? parseResult.text.substring(0, 500) : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to parse PDF. Please check if the file is valid and try again.',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
