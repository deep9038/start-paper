'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  category: string[];
  subject: string[];
  year: string[];
  priceRange: { min: number; max: number };
}

const categories = [
  { value: 'university', label: 'University Exams' },
  { value: 'board', label: 'Board Exams' },
  { value: 'competitive', label: 'Competitive Exams' },
];

const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Computer Science',
  'Economics',
  'History',
  'Geography',
  'Political Science',
];

const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018'];

export default function FilterSidebar({ onFilterChange, className = '' }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    subject: [],
    year: [],
    priceRange: { min: 0, max: 500 },
  });

  const [expanded, setExpanded] = useState({
    category: true,
    subject: true,
    year: false,
    price: false,
  });

  const handleCheckboxChange = (type: 'category' | 'subject' | 'year', value: string) => {
    const newFilters = { ...filters };
    const index = newFilters[type].indexOf(value);

    if (index > -1) {
      newFilters[type] = newFilters[type].filter((item) => item !== value);
    } else {
      newFilters[type] = [...newFilters[type], value];
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newFilters = {
      ...filters,
      priceRange: { ...filters.priceRange, [type]: value },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      category: [],
      subject: [],
      year: [],
      priceRange: { min: 0, max: 500 },
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters =
    filters.category.length > 0 ||
    filters.subject.length > 0 ||
    filters.year.length > 0 ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 500;

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <button
          onClick={() => setExpanded({ ...expanded, category: !expanded.category })}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
        >
          Category
          {expanded.category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expanded.category && (
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat.value} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.category.includes(cat.value)}
                  onChange={() => handleCheckboxChange('category', cat.value)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{cat.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Subject Filter */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <button
          onClick={() => setExpanded({ ...expanded, subject: !expanded.subject })}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
        >
          Subject
          {expanded.subject ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expanded.subject && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {subjects.map((subject) => (
              <label key={subject} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.subject.includes(subject)}
                  onChange={() => handleCheckboxChange('subject', subject)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{subject}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Year Filter */}
      <div className="border-b border-gray-100 pb-4 mb-4">
        <button
          onClick={() => setExpanded({ ...expanded, year: !expanded.year })}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
        >
          Year
          {expanded.year ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expanded.year && (
          <div className="space-y-2">
            {years.map((year) => (
              <label key={year} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.year.includes(year)}
                  onChange={() => handleCheckboxChange('year', year)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{year}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div>
        <button
          onClick={() => setExpanded({ ...expanded, price: !expanded.price })}
          className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
        >
          Price Range
          {expanded.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {expanded.price && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handlePriceChange('min', parseInt(e.target.value) || 0)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handlePriceChange('max', parseInt(e.target.value) || 500)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
