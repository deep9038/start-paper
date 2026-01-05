import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Paper from '@/models/Paper';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Fetch statistics in parallel
    const [totalPapers, totalUsers, completedTransactions, totalDownloadsData] = await Promise.all([
      Paper.countDocuments({ isActive: true }),
      User.countDocuments(),
      Transaction.find({ status: 'completed' }),
      Paper.aggregate([
        { $group: { _id: null, total: { $sum: '$downloads' } } }
      ])
    ]);

    // Calculate total revenue
    const totalRevenue = completedTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    // Get total downloads
    const totalDownloads = totalDownloadsData.length > 0 ? totalDownloadsData[0].total : 0;

    return NextResponse.json({
      totalPapers,
      totalUsers,
      totalRevenue,
      totalDownloads,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
