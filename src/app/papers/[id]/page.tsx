'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  FileText,
  Star,
  Download,
  Heart,
  IndianRupee,
  Calendar,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  ShoppingCart,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Paper {
  _id: string;
  title: string;
  description: string;
  subject: string;
  examName: string;
  year: number;
  price: number;
  category: 'university' | 'board' | 'competitive';
  ratings: { average: number; count: number };
  downloads: number;
  tags: string[];
  previewUrl?: string;
}

export default function PaperDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const response = await fetch(`/api/papers/${params.id}`);
        const data = await response.json();

        if (response.ok) {
          setPaper(data.paper);
        } else {
          toast.error('Paper not found');
          router.push('/papers');
        }
      } catch {
        toast.error('Failed to load paper');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPaper();
    }
  }, [params.id, router]);

  const handlePurchase = async () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/papers/${params.id}`);
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: params.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Initialize Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: 'Star Paper',
          description: paper?.title,
          order_id: data.orderId,
          handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyResponse.ok) {
              toast.success('Payment successful! You can now download the paper.');
              router.push('/dashboard/downloads');
            } else {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            email: session.user?.email,
            name: session.user?.name,
          },
          theme: {
            color: '#2563eb',
          },
        };

        const razorpay = new (window as unknown as { Razorpay: new (options: object) => { open: () => void } }).Razorpay(options);
        razorpay.open();
      } else {
        toast.error(data.error || 'Failed to create order');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleWishlist = () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/papers/${params.id}`);
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const categoryColors = {
    university: 'bg-purple-100 text-purple-700',
    board: 'bg-green-100 text-green-700',
    competitive: 'bg-orange-100 text-orange-700',
  };

  const categoryLabels = {
    university: 'University Exam',
    board: 'Board Exam',
    competitive: 'Competitive Exam',
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-64 bg-gray-200 rounded-xl mb-6" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!paper) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/papers"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Papers
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl h-80 flex items-center justify-center mb-6">
            <div className="text-center">
              <FileText className="h-24 w-24 text-blue-300 mx-auto mb-4" />
              <p className="text-gray-500">Paper Preview</p>
            </div>
          </div>

          {/* Title & Meta */}
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${categoryColors[paper.category]}`}>
              {categoryLabels[paper.category]}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{paper.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                {paper.subject}
              </div>
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                {paper.examName}
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {paper.year}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-600 leading-relaxed">{paper.description}</p>
          </div>

          {/* What's Included */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Included</h2>
            <ul className="space-y-3">
              {[
                'Complete question paper PDF',
                'Detailed handwritten solutions',
                'Step-by-step explanations',
                'Important tips and shortcuts',
              ].map((item) => (
                <li key={item} className="flex items-center text-gray-600">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          {paper.tags && paper.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {paper.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Purchase Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            {/* Price */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-3xl font-bold text-gray-900">
                <IndianRupee className="h-7 w-7" />
                {paper.price}
              </div>
              <button
                onClick={handleWishlist}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <Heart
                  className={`h-6 w-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                />
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                {paper.ratings.average.toFixed(1)} ({paper.ratings.count} reviews)
              </div>
              <div className="flex items-center">
                <Download className="h-5 w-5 mr-1" />
                {paper.downloads} downloads
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold flex items-center justify-center mb-4 disabled:opacity-50"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Buy Now
                </>
              )}
            </button>

            {/* Info */}
            <div className="text-sm text-gray-500 space-y-2">
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Instant download after payment
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Secure payment via Razorpay
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Download up to 5 times
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
