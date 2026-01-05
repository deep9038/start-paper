import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Paper from '@/models/Paper';
import mongoose from 'mongoose';

// GET - Fetch single paper by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid paper ID' },
        { status: 400 }
      );
    }

    const paper = await Paper.findById(id).select('-fileUrl').lean();

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ paper });
  } catch (error) {
    console.error('Error fetching paper:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper' },
      { status: 500 }
    );
  }
}

// PUT - Update paper (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid paper ID' },
        { status: 400 }
      );
    }

    const paper = await Paper.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Paper updated successfully',
      paper,
    });
  } catch (error: unknown) {
    console.error('Error updating paper:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update paper' },
      { status: 500 }
    );
  }
}

// DELETE - Delete paper (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid paper ID' },
        { status: 400 }
      );
    }

    const paper = await Paper.findByIdAndDelete(id);

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Paper deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting paper:', error);
    return NextResponse.json(
      { error: 'Failed to delete paper' },
      { status: 500 }
    );
  }
}
