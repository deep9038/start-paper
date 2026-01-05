'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, FileText, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface PurchasedPaper {
  _id: string;
  title: string;
  subject: string;
  examName: string;
  year: number;
  category: string;
  purchasedAt: string;
  downloadsRemaining: number;
}

export default function DownloadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [papers, setPapers] = useState<PurchasedPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard/downloads');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPurchasedPapers = async () => {
      try {
        const response = await fetch('/api/user/downloads');
        const data = await response.json();

        if (response.ok) {
          setPapers(data.papers || []);
        }
      } catch (error) {
        console.error('Error fetching downloads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchPurchasedPapers();
    }
  }, [session]);

  const handleDownload = async (paperId: string) => {
    try {
      const response = await fetch(`/api/user/downloads/${paperId}`);
      const data = await response.json();

      if (response.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        toast.success('Download started!');
        // Refresh to update download count
        const updatedPapers = papers.map((p) =>
          p._id === paperId ? { ...p, downloadsRemaining: p.downloadsRemaining - 1 } : p
        );
        setPapers(updatedPapers);
      } else {
        toast.error(data.error || 'Download failed');
      }
    } catch {
      toast.error('Failed to download');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Downloads</h1>
        <p className="text-gray-600">Access your purchased question papers</p>
      </div>

      {/* Papers List */}
      {papers.length > 0 ? (
        <div className="space-y-4">
          {papers.map((paper) => (
            <div
              key={paper._id}
              className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{paper.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {paper.subject} • {paper.examName} • {paper.year}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Purchased {new Date(paper.purchasedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Download className="h-3 w-3 mr-1" />
                        {paper.downloadsRemaining} downloads remaining
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/papers/${paper._id}`}
                    className="flex items-center px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </Link>
                  <button
                    onClick={() => handleDownload(paper._id)}
                    disabled={paper.downloadsRemaining <= 0}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Download className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No downloads yet</h3>
          <p className="text-gray-500 mb-6">
            Purchase question papers to see them here
          </p>
          <Link
            href="/papers"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-medium"
          >
            Browse Papers
          </Link>
        </div>
      )}
    </div>
  );
}
