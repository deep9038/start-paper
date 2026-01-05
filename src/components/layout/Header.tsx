'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X, User, LogOut, FileText, Heart, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Star Paper</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/papers" className="text-gray-600 hover:text-blue-600 transition">
              Browse Papers
            </Link>
            <Link href="/categories/university" className="text-gray-600 hover:text-blue-600 transition">
              University
            </Link>
            <Link href="/categories/board" className="text-gray-600 hover:text-blue-600 transition">
              Board Exams
            </Link>
            <Link href="/categories/competitive" className="text-gray-600 hover:text-blue-600 transition">
              Competitive
            </Link>
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium">{session.user?.name}</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/downloads"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      My Downloads
                    </Link>
                    <Link
                      href="/dashboard/wishlist"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                    </Link>
                    {session.user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={() => signOut()}
                      className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-3">
              <Link href="/papers" className="text-gray-600 hover:text-blue-600 py-2">
                Browse Papers
              </Link>
              <Link href="/categories/university" className="text-gray-600 hover:text-blue-600 py-2">
                University
              </Link>
              <Link href="/categories/board" className="text-gray-600 hover:text-blue-600 py-2">
                Board Exams
              </Link>
              <Link href="/categories/competitive" className="text-gray-600 hover:text-blue-600 py-2">
                Competitive
              </Link>
              <hr className="my-2" />
              {session ? (
                <>
                  <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 py-2">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-left text-red-600 py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 py-2">
                    Login
                  </Link>
                  <Link href="/auth/register" className="text-blue-600 font-medium py-2">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
