'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadPaperPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'university',
    examName: '',
    subject: '',
    year: new Date().getFullYear(),
    price: 0,
    fileUrl: '',
    previewUrl: '',
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    router.push('/');
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
          year: parseInt(formData.year.toString()),
          price: parseFloat(formData.price.toString()),
          uploadedBy: session.user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Paper uploaded successfully!');
        router.push('/admin');
      } else {
        toast.error(data.error || 'Failed to upload paper');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/admin"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload New Paper</h1>
        <p className="text-gray-600">Add a new question paper to the platform</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Paper Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="e.g., JEE Main 2024 - Mathematics with Solutions"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
              placeholder="Describe what's included in this paper..."
            />
          </div>

          {/* Category & Exam Name */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                <option value="university">University Exam</option>
                <option value="board">Board Exam</option>
                <option value="competitive">Competitive Exam</option>
              </select>
            </div>
            <div>
              <label htmlFor="examName" className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name *
              </label>
              <input
                type="text"
                id="examName"
                name="examName"
                value={formData.examName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                placeholder="e.g., JEE Main, CBSE Board, Delhi University"
              />
            </div>
          </div>

          {/* Subject & Year */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                placeholder="e.g., Mathematics, Physics, Chemistry"
              />
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min={1990}
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min={0}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="e.g., 49"
            />
          </div>

          {/* File URL */}
          <div>
            <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-2">
              PDF File URL *
            </label>
            <input
              type="url"
              id="fileUrl"
              name="fileUrl"
              value={formData.fileUrl}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="https://example.com/paper.pdf"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload your PDF to a cloud storage and paste the URL here
            </p>
          </div>

          {/* Preview URL */}
          <div>
            <label htmlFor="previewUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Preview Image URL (optional)
            </label>
            <input
              type="url"
              id="previewUrl"
              name="previewUrl"
              value={formData.previewUrl}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="https://example.com/preview.jpg"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="e.g., calculus, algebra, trigonometry"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Paper
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
