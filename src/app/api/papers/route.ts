import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Paper from '@/models/Paper';

// GET - Fetch papers with filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const subject = searchParams.get('subject');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';

    // Build query
    const query: Record<string, unknown> = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (year) {
      query.year = parseInt(year);
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, number>).$gte = parseInt(minPrice);
      if (maxPrice) (query.price as Record<string, number>).$lte = parseInt(maxPrice);
    }

    // Build sort
    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'price-low':
        sortQuery = { price: 1 };
        break;
      case 'price-high':
        sortQuery = { price: -1 };
        break;
      case 'popular':
        sortQuery = { downloads: -1 };
        break;
      case 'rating':
        sortQuery = { 'ratings.average': -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [papers, total] = await Promise.all([
      Paper.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .select('-fileUrl')
        .lean(),
      Paper.countDocuments(query),
    ]);

    return NextResponse.json({
      papers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}

// POST - Create new paper (Admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    const paper = await Paper.create(body);

    return NextResponse.json(
      { message: 'Paper created successfully', paper },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating paper:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create paper' },
      { status: 500 }
    );
  }
}
