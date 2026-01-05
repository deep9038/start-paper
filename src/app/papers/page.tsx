'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import PaperCard from '@/components/ui/PaperCard';
import SearchBar from '@/components/ui/SearchBar';
import FilterSidebar, { FilterState } from '@/components/ui/FilterSidebar';

interface Paper {
  _id: string;
  title: string;
  subject: string;
  examName: string;
  year: number;
  price: number;
  category: 'university' | 'board' | 'competitive';
  ratings: { average: number };
  downloads: number;
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function PapersPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory ? [initialCategory] : [],
    subject: [],
    year: [],
    priceRange: { min: 0, max: 500 },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const fetchPapers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('sort', sort);

      if (initialSearch) params.set('search', initialSearch);
      if (filters.category.length > 0) params.set('category', filters.category[0]);
      if (filters.subject.length > 0) params.set('subject', filters.subject[0]);
      if (filters.year.length > 0) params.set('year', filters.year[0]);
      if (filters.priceRange.min > 0) params.set('minPrice', filters.priceRange.min.toString());
      if (filters.priceRange.max < 500) params.set('maxPrice', filters.priceRange.max.toString());

      const response = await fetch(`/api/papers?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setPapers(data.papers);
        setPagination({
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, filters, pagination.page, initialSearch]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Question Papers</h1>
        <p className="text-gray-600">
          Find previous year question papers with handwritten solutions for all exams
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar placeholder="Search by title, subject, or exam name..." />
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilter(true)}
          className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar onFilterChange={handleFilterChange} />
        </div>

        {/* Mobile Filter Overlay */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)} />
            <div className="absolute right-0 top-0 h-full w-80 bg-white p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <button onClick={() => setShowMobileFilter(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <FilterSidebar onFilterChange={handleFilterChange} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort & Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {pagination.total} papers found
            </p>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-gray-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Papers Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 h-72 animate-pulse">
                  <div className="h-40 bg-gray-100 rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : papers.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => (
                <PaperCard
                  key={paper._id}
                  id={paper._id}
                  title={paper.title}
                  subject={paper.subject}
                  examName={paper.examName}
                  year={paper.year}
                  price={paper.price}
                  category={paper.category}
                  rating={paper.ratings.average}
                  downloads={paper.downloads}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Filter className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No papers found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
