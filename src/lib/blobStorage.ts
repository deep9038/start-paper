/**
 * File Storage Wrapper
 * Supports Vercel Blob Storage in production and local file storage in development
 */

import { put, del, list } from '@vercel/blob';
import { sanitizeFilename } from './fileValidation';
import fs from 'fs/promises';
import path from 'path';

// Check if we should use local storage (development without Vercel Blob)
const USE_LOCAL_STORAGE = !process.env.BLOB_READ_WRITE_TOKEN || process.env.USE_LOCAL_STORAGE === 'true';
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Upload result interface
 */
export interface UploadResult {
  url: string;
  size: number;
  filename: string;
}

/**
 * Ensure local upload directory exists
 */
async function ensureLocalDir(folder: string): Promise<string> {
  const dir = path.join(LOCAL_UPLOAD_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Upload a PDF file to storage (Vercel Blob or local)
 * @param file - File buffer to upload
 * @param originalFilename - Original filename from user
 * @param folder - Optional folder path (e.g., 'papers', 'solutions')
 * @returns Promise with upload result containing URL and metadata
 */
export async function uploadPaperPDF(
  file: Buffer,
  originalFilename: string,
  folder: string = 'papers'
): Promise<UploadResult> {
  // Sanitize and generate unique filename
  const sanitized = sanitizeFilename(originalFilename);

  if (USE_LOCAL_STORAGE) {
    // Local file storage for development
    try {
      const dir = await ensureLocalDir(folder);
      const filepath = path.join(dir, sanitized);
      await fs.writeFile(filepath, file);

      // Return URL that can be served from public folder
      const url = `/uploads/${folder}/${sanitized}`;

      console.log(`[Local Storage] File saved: ${filepath}`);

      return {
        url,
        size: file.length,
        filename: sanitized,
      };
    } catch (error) {
      console.error('Error saving file locally:', error);
      throw new Error('Failed to save file locally');
    }
  }

  // Vercel Blob storage for production
  try {
    const filepath = folder ? `${folder}/${sanitized}` : sanitized;

    const blob = await put(filepath, file, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      size: file.length,
      filename: sanitized,
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Upload a solution PDF file
 * @param file - File buffer to upload
 * @param originalFilename - Original filename
 * @returns Promise with upload result
 */
export async function uploadSolutionPDF(
  file: Buffer,
  originalFilename: string
): Promise<UploadResult> {
  return uploadPaperPDF(file, originalFilename, 'solutions');
}

/**
 * Upload an answer image (for handwritten solutions)
 * @param file - Image buffer to upload
 * @param originalFilename - Original filename
 * @param paperId - Associated paper ID
 * @param questionNumber - Question number this image belongs to
 * @returns Promise with upload result
 */
export async function uploadAnswerImage(
  file: Buffer,
  originalFilename: string,
  paperId: string,
  questionNumber: string
): Promise<UploadResult> {
  const sanitized = sanitizeFilename(originalFilename);
  const folder = `answers/${paperId}`;
  const filename = `${questionNumber}-${sanitized}`;

  if (USE_LOCAL_STORAGE) {
    try {
      const dir = await ensureLocalDir(folder);
      const filepath = path.join(dir, filename);
      await fs.writeFile(filepath, file);

      const url = `/uploads/${folder}/${filename}`;

      return {
        url,
        size: file.length,
        filename,
      };
    } catch (error) {
      console.error('Error saving answer image locally:', error);
      throw new Error('Failed to save answer image locally');
    }
  }

  try {
    const filepath = `${folder}/${filename}`;
    const contentType = getImageContentType(originalFilename);

    const blob = await put(filepath, file, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      size: file.length,
      filename,
    };
  } catch (error) {
    console.error('Error uploading answer image:', error);
    throw new Error('Failed to upload answer image');
  }
}

/**
 * Delete a file from storage
 * @param fileUrl - URL of the file to delete
 * @returns Promise<void>
 */
export async function deletePaperPDF(fileUrl: string): Promise<void> {
  if (USE_LOCAL_STORAGE || fileUrl.startsWith('/uploads/')) {
    // Local file deletion
    try {
      const filepath = path.join(process.cwd(), 'public', fileUrl);
      await fs.unlink(filepath);
      console.log(`[Local Storage] File deleted: ${filepath}`);
    } catch (error) {
      console.error('Error deleting local file:', error);
      // Don't throw - file might already be deleted
    }
    return;
  }

  try {
    await del(fileUrl);
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    throw new Error('Failed to delete file from storage');
  }
}

/**
 * List all files in a specific folder
 * @param prefix - Folder prefix (e.g., 'papers/', 'solutions/')
 * @param limit - Maximum number of files to return
 * @returns Promise with list of blob URLs
 */
export async function listFiles(prefix: string, limit: number = 100): Promise<string[]> {
  if (USE_LOCAL_STORAGE) {
    try {
      const dir = path.join(LOCAL_UPLOAD_DIR, prefix);
      const files = await fs.readdir(dir);
      return files.slice(0, limit).map((file) => `/uploads/${prefix}${file}`);
    } catch (error) {
      // Directory might not exist
      return [];
    }
  }

  try {
    const { blobs } = await list({
      prefix,
      limit,
    });

    return blobs.map((blob) => blob.url);
  } catch (error) {
    console.error('Error listing files from Vercel Blob:', error);
    throw new Error('Failed to list files from storage');
  }
}

/**
 * Get image content type from filename extension
 * @param filename - Filename with extension
 * @returns MIME type string
 */
function getImageContentType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Check if a URL is from Vercel Blob Storage
 * @param url - URL to check
 * @returns boolean indicating if URL is from Vercel Blob
 */
export function isVercelBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com') || url.includes('public.blob.vercel-storage.com');
}

/**
 * Check if a URL is a local upload
 * @param url - URL to check
 * @returns boolean indicating if URL is from local storage
 */
export function isLocalUrl(url: string): boolean {
  return url.startsWith('/uploads/');
}

/**
 * Extract filename from URL
 * @param url - Vercel Blob URL or local URL
 * @returns Extracted filename or null
 */
export function extractFilenameFromUrl(url: string): string | null {
  try {
    if (url.startsWith('/')) {
      // Local URL
      const parts = url.split('/');
      return parts[parts.length - 1] || null;
    }
    // Remote URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

/**
 * Get storage mode info (for debugging)
 */
export function getStorageInfo(): { mode: 'local' | 'vercel-blob'; directory?: string } {
  if (USE_LOCAL_STORAGE) {
    return { mode: 'local', directory: LOCAL_UPLOAD_DIR };
  }
  return { mode: 'vercel-blob' };
}
