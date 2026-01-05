import Link from 'next/link';
import { FileText, GraduationCap, Award, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';
import PaperCard from '@/components/ui/PaperCard';

// Sample featured papers (will be replaced with database data)
const featuredPapers = [
  {
    id: '1',
    title: 'JEE Main 2024 - Mathematics with Solutions',
    subject: 'Mathematics',
    examName: 'JEE Main',
    year: 2024,
    price: 49,
    category: 'competitive' as const,
    rating: 4.8,
    downloads: 1250,
  },
  {
    id: '2',
    title: 'CBSE Class 12 Physics - Board Exam 2024',
    subject: 'Physics',
    examName: 'CBSE Board',
    year: 2024,
    price: 39,
    category: 'board' as const,
    rating: 4.6,
    downloads: 890,
  },
  {
    id: '3',
    title: 'NEET 2024 Biology - Complete Solutions',
    subject: 'Biology',
    examName: 'NEET',
    year: 2024,
    price: 59,
    category: 'competitive' as const,
    rating: 4.9,
    downloads: 2100,
  },
  {
    id: '4',
    title: 'Delhi University B.Com - Accounting',
    subject: 'Accounting',
    examName: 'Delhi University',
    year: 2023,
    price: 29,
    category: 'university' as const,
    rating: 4.5,
    downloads: 456,
  },
];

const categories = [
  {
    name: 'University Exams',
    icon: GraduationCap,
    description: 'Previous year papers from top universities',
    href: '/categories/university',
    color: 'bg-purple-100 text-purple-600',
    count: '500+',
  },
  {
    name: 'Board Exams',
    icon: BookOpen,
    description: 'CBSE, ICSE, State Board papers',
    href: '/categories/board',
    color: 'bg-green-100 text-green-600',
    count: '300+',
  },
  {
    name: 'Competitive Exams',
    icon: Award,
    description: 'JEE, NEET, UPSC, and more',
    href: '/categories/competitive',
    color: 'bg-orange-100 text-orange-600',
    count: '400+',
  },
];

const features = [
  'Handwritten solutions by toppers',
  'Step-by-step explanations',
  'Updated for latest syllabus',
  'Instant PDF download',
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Previous Year Question Papers with{' '}
              <span className="text-yellow-300">Handwritten Solutions</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Get access to thousands of previous year question papers with detailed handwritten
              solutions. Ace your exams with Star Paper!
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar
                placeholder="Search for papers by subject, exam, or topic..."
                className="shadow-lg"
              />
            </div>

            {/* Features */}
            <div className="flex flex-wrap justify-center gap-4">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find question papers organized by exam type. We cover university exams, board exams,
              and all major competitive examinations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-100 transition-all duration-200"
              >
                <div className={`w-14 h-14 ${category.color} rounded-xl flex items-center justify-center mb-4`}>
                  <category.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {category.name}
                </h3>
                <p className="text-gray-500 mb-3">{category.description}</p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>{category.count} Papers</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Papers Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Papers</h2>
              <p className="text-gray-600">Most popular papers this week</p>
            </div>
            <Link
              href="/papers"
              className="hidden md:flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View all papers
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPapers.map((paper) => (
              <PaperCard key={paper.id} {...paper} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link
              href="/papers"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              View all papers
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1200+</div>
              <div className="text-blue-100">Question Papers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Happy Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-blue-100">Subjects Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="h-16 w-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Ace Your Exams?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Join thousands of students who are using Star Paper to prepare for their exams.
            Get instant access to previous year papers with handwritten solutions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
            >
              Get Started Free
            </Link>
            <Link
              href="/papers"
              className="w-full sm:w-auto border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition font-semibold"
            >
              Browse Papers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
