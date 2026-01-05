'use client';

import Link from 'next/link';
import { FileText, Star, Download, Heart, IndianRupee } from 'lucide-react';
import { useState } from 'react';

interface PaperCardProps {
  id: string;
  title: string;
  subject: string;
  examName: string;
  year: number;
  price: number;
  category: 'university' | 'board' | 'competitive';
  rating: number;
  downloads: number;
  isWishlisted?: boolean;
  onWishlistToggle?: (id: string) => void;
}

export default function PaperCard({
  id,
  title,
  subject,
  examName,
  year,
  price,
  category,
  rating,
  downloads,
  isWishlisted = false,
  onWishlistToggle,
}: PaperCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const categoryColors = {
    university: 'bg-purple-100 text-purple-700',
    board: 'bg-green-100 text-green-700',
    competitive: 'bg-orange-100 text-orange-700',
  };

  const categoryLabels = {
    university: 'University',
    board: 'Board Exam',
    competitive: 'Competitive',
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted(!wishlisted);
    onWishlistToggle?.(id);
  };

  return (
    <Link href={`/papers/${id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all duration-200 overflow-hidden group">
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <FileText className="h-16 w-16 text-blue-300" />

          {/* Category Badge */}
          <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category]}`}>
            {categoryLabels[category]}
          </span>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition"
          >
            <Heart
              className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition">
            {title}
          </h3>

          {/* Subject & Year */}
          <p className="text-sm text-gray-500 mb-2">
            {subject} • {year}
          </p>

          {/* Exam Name */}
          <p className="text-xs text-gray-400 mb-3">{examName}</p>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              {/* Rating */}
              <div className="flex items-center text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1 text-gray-600">{rating.toFixed(1)}</span>
              </div>

              {/* Downloads */}
              <div className="flex items-center text-gray-400">
                <Download className="h-4 w-4" />
                <span className="ml-1">{downloads}</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center font-semibold text-blue-600">
              <IndianRupee className="h-4 w-4" />
              <span>{price}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
