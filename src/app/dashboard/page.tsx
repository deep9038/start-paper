'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { User, FileText, Heart, Download, Settings, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const dashboardLinks = [
    {
      title: 'My Downloads',
      description: 'View and download your purchased papers',
      icon: Download,
      href: '/dashboard/downloads',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Wishlist',
      description: 'Papers saved for later',
      icon: Heart,
      href: '/dashboard/wishlist',
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'Profile Settings',
      description: 'Update your account information',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'bg-gray-100 text-gray-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user?.name}!</p>
      </div>

      {/* User Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{session.user?.name}</h2>
            <p className="text-blue-100">{session.user?.email}</p>
            <span className="inline-block mt-2 bg-white/20 px-3 py-1 rounded-full text-sm">
              {session.user?.role === 'admin' ? 'Administrator' : 'Student'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Papers Purchased</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Total Downloads</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Wishlist Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {dashboardLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-blue-100 transition-all group"
          >
            <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center mb-4`}>
              <link.icon className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition">
              {link.title}
            </h4>
            <p className="text-sm text-gray-500 mb-3">{link.description}</p>
            <span className="text-blue-600 text-sm font-medium flex items-center">
              View
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>

      {/* Admin Link */}
      {session.user?.role === 'admin' && (
        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition font-medium"
          >
            Go to Admin Panel
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      )}
    </div>
  );
}
