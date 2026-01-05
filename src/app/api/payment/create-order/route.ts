import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import Paper from '@/models/Paper';
import Transaction from '@/models/Transaction';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please login to make a purchase' },
        { status: 401 }
      );
    }

    const { paperId } = await request.json();

    if (!paperId) {
      return NextResponse.json(
        { error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get paper details
    const paper = await Paper.findById(paperId);

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check if already purchased
    const existingTransaction = await Transaction.findOne({
      userId: session.user.id,
      paperId: paperId,
      status: 'completed',
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'You have already purchased this paper' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const amount = paper.price * 100; // Convert to paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `paper_${paperId}_${Date.now()}`,
      notes: {
        paperId: paperId,
        userId: session.user.id,
      },
    });

    // Create pending transaction
    await Transaction.create({
      userId: session.user.id,
      paperId: paperId,
      amount: paper.price,
      razorpayOrderId: order.id,
      status: 'pending',
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
