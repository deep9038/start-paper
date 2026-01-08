/**
 * File Validation Utilities
 * Provides client and server-side validation for PDF file uploads
 */

// PDF file signature (magic number): %PDF
const PDF_SIGNATURE = Buffer.from([0x25, 0x50, 0x44, 0x46]);

// Maximum file size: 50MB
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800');

// Allowed MIME types
export const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || 'application/pdf').split(',');

/**
 * Client-side: Validate PDF MIME type
 * @param file - File object from input
 * @returns boolean indicating if file is a valid PDF
 */
export function validatePDFMimeType(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Client-side: Validate file size
 * @param file - File object from input
 * @param maxSize - Maximum allowed size in bytes
 * @returns boolean indicating if file size is within limits
 */
export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize && file.size > 0;
}

/**
 * Server-side: Validate PDF signature (magic number)
 * Checks if the first 4 bytes of the file match the PDF signature
 * @param buffer - File buffer
 * @returns boolean indicating if buffer is a valid PDF
 */
export function validatePDFSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }

  const fileSignature = buffer.slice(0, 4);
  return fileSignature.equals(PDF_SIGNATURE);
}

/**
 * Sanitize filename to prevent security issues
 * Removes special characters and limits length
 * @param filename - Original filename
 * @returns Sanitized filename with timestamp and random ID
 */
export function sanitizeFilename(filename: string): string {
  // Extract extension
  const extension = filename.split('.').pop()?.toLowerCase() || 'pdf';

  // Remove extension from filename
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.')) || filename;

  // Sanitize: keep only alphanumeric, dash, and underscore
  const sanitized = nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .slice(0, 50); // Limit length

  // Add timestamp and random ID for uniqueness
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);

  return `${timestamp}-${randomId}-${sanitized}.${extension}`;
}

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Validate file extension
 * @param filename - Filename to validate
 * @param allowedExtensions - Array of allowed extensions (default: ['pdf'])
 * @returns boolean indicating if extension is allowed
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[] = ['pdf']
): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
}

/**
 * Comprehensive file validation (client-side)
 * @param file - File object to validate
 * @returns object with validation result and error message if any
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file extension
  if (!validateFileExtension(file.name)) {
    return { valid: false, error: 'Invalid file extension. Only PDF files are allowed.' };
  }

  // Check MIME type
  if (!validatePDFMimeType(file)) {
    return { valid: false, error: 'Invalid file type. Only PDF files are allowed.' };
  }

  // Check file size
  if (!validateFileSize(file)) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive buffer validation (server-side)
 * @param buffer - File buffer to validate
 * @param filename - Original filename
 * @returns object with validation result and error message if any
 */
export function validateBuffer(
  buffer: Buffer,
  filename: string
): { valid: boolean; error?: string } {
  // Check buffer exists
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty file buffer' };
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  // Check PDF signature
  if (!validatePDFSignature(buffer)) {
    return { valid: false, error: 'Invalid PDF file. File signature does not match.' };
  }

  // Check filename extension
  if (!validateFileExtension(filename)) {
    return { valid: false, error: 'Invalid file extension' };
  }

  return { valid: true };
}
