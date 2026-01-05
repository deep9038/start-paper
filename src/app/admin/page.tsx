'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  IndianRupee,
  TrendingUp,
  Upload,
  Settings,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

interface Stats {
  totalPapers: number;
  totalUsers: number;
  totalRevenue: number;
  totalDownloads: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalPapers: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalDownloads: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    // Fetch admin stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  const statCards = [
    {
      title: 'Total Papers',
      value: stats.totalPapers,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Total Downloads',
      value: stats.totalDownloads,
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const adminLinks = [
    {
      title: 'Upload New Paper',
      description: 'Add a new question paper to the platform',
      icon: Upload,
      href: '/admin/upload',
      color: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    {
      title: 'Manage Papers',
      description: 'View, edit, or delete existing papers',
      icon: FileText,
      href: '/admin/papers',
      color: 'bg-white text-gray-900 border border-gray-200 hover:border-blue-200',
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'bg-white text-gray-900 border border-gray-200 hover:border-blue-200',
    },
    {
      title: 'Analytics',
      description: 'View detailed sales and traffic analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-white text-gray-900 border border-gray-200 hover:border-blue-200',
    },
    {
      title: 'Settings',
      description: 'Configure platform settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-white text-gray-900 border border-gray-200 hover:border-blue-200',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your Star Paper platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className={`rounded-xl p-6 transition-all group ${link.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <link.icon className="h-6 w-6" />
              <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold mb-1">{link.title}</h3>
            <p className="text-sm opacity-80">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
