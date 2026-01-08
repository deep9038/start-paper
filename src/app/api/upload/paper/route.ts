import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { validateBuffer } from '@/lib/fileValidation';
import { uploadPaperPDF, uploadSolutionPDF } from '@/lib/blobStorage';

/**
 * POST /api/upload/paper
 * Upload PDF files (question papers or solution papers)
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
    const type = (formData.get('type') as string) || 'question'; // 'question' or 'solution'

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Server-side validation
    const validation = validateBuffer(buffer, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload to Vercel Blob based on type
    let uploadResult;
    if (type === 'solution') {
      uploadResult = await uploadSolutionPDF(buffer, file.name);
    } else {
      uploadResult = await uploadPaperPDF(buffer, file.name);
    }

    // Return upload result
    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        originalFilename: file.name,
        uploadedFilename: uploadResult.filename,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}
