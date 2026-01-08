'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Plus,
  Trash2,
  DollarSign,
  BookOpen,
  ClipboardList,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { validateFile, formatFileSize } from '@/lib/fileValidation';

// Types
interface DetectedQuestion {
  questionNumber: string;
  questionText?: string;
  marks?: number;
  pageNumber?: number;
  answer?: string;
}

interface FormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  category: 'university' | 'board' | 'competitive';
  examName: string;
  subject: string;
  year: number;
  tags: string;
  paperType: 'questions-only' | 'with-solutions';

  // Step 2: Question File
  fileUrl: string;
  fileSize: number;
  originalFilename: string;

  // Step 3: Pricing
  questionsOnlyPrice: number;
  withSolutionsPrice: number;

  // Step 4: Solutions
  solutionType: 'pdf' | 'manual' | 'skip';
  solutionFileUrl: string;
  solutionFileSize: number;

  // Questions
  questions: DetectedQuestion[];
  totalQuestions: number;
}

// Step configuration
const STEPS = [
  { id: 1, name: 'Basic Info', icon: FileText },
  { id: 2, name: 'Question Paper', icon: Upload },
  { id: 3, name: 'Pricing', icon: DollarSign },
  { id: 4, name: 'Solutions', icon: BookOpen },
  { id: 5, name: 'Review', icon: Eye },
];

export default function UploadPaperPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'university',
    examName: '',
    subject: '',
    year: new Date().getFullYear(),
    tags: '',
    paperType: 'questions-only',
    fileUrl: '',
    fileSize: 0,
    originalFilename: '',
    questionsOnlyPrice: 0,
    withSolutionsPrice: 0,
    solutionType: 'skip',
    solutionFileUrl: '',
    solutionFileSize: 0,
    questions: [],
    totalQuestions: 0,
  });

  // File upload states
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // Auth check
  if (!session || session.user?.role !== 'admin') {
    router.push('/');
    return null;
  }

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file selection for question paper
  const handleQuestionFileSelect = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setQuestionFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload file
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'question');

      const uploadRes = await fetch('/api/upload/paper', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();
      setUploadProgress(50);

      // Parse PDF for questions
      setIsParsing(true);
      const parseFormData = new FormData();
      parseFormData.append('file', file);

      const parseRes = await fetch('/api/papers/parse-pdf', {
        method: 'POST',
        body: parseFormData,
      });

      if (!parseRes.ok) {
        console.warn('PDF parsing failed, continuing without question detection');
      }

      const parseData = parseRes.ok ? await parseRes.json() : { questions: [], totalQuestions: 0 };
      setUploadProgress(100);

      // Update form data
      setFormData((prev) => ({
        ...prev,
        fileUrl: uploadData.fileUrl,
        fileSize: uploadData.fileSize,
        originalFilename: uploadData.originalFilename,
        questions: parseData.questions || [],
        totalQuestions: parseData.totalQuestions || 0,
      }));

      toast.success('Question paper uploaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
      setQuestionFile(null);
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  // Handle solution file upload
  const handleSolutionFileSelect = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setSolutionFile(file);
    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'solution');

      const uploadRes = await fetch('/api/upload/paper', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadData = await uploadRes.json();

      setFormData((prev) => ({
        ...prev,
        solutionFileUrl: uploadData.fileUrl,
        solutionFileSize: uploadData.fileSize,
        solutionType: 'pdf',
      }));

      toast.success('Solution file uploaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload solution');
      setSolutionFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'question' | 'solution') => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (type === 'question') {
        handleQuestionFileSelect(files[0]);
      } else {
        handleSolutionFileSelect(files[0]);
      }
    }
  };

  // Add/Edit question manually
  const handleAddQuestion = () => {
    const newQuestion: DetectedQuestion = {
      questionNumber: `Q${formData.questions.length + 1}`,
      questionText: '',
      marks: undefined,
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      totalQuestions: prev.questions.length + 1,
    }));
  };

  const handleUpdateQuestion = (index: number, field: keyof DetectedQuestion, value: string | number) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
      totalQuestions: prev.questions.length - 1,
    }));
  };

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.title.trim() !== '' &&
          formData.description.trim() !== '' &&
          formData.examName.trim() !== '' &&
          formData.subject.trim() !== ''
        );
      case 2:
        return formData.fileUrl !== '';
      case 3:
        return formData.questionsOnlyPrice >= 0;
      case 4:
        return true; // Solutions are optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canGoNext()) {
      // Skip Step 4 if paper type is questions-only
      if (currentStep === 3 && formData.paperType === 'questions-only') {
        setCurrentStep(5);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      // Skip Step 4 when going back if paper type is questions-only
      if (currentStep === 5 && formData.paperType === 'questions-only') {
        setCurrentStep(3);
      } else {
        setCurrentStep((prev) => prev - 1);
      }
    }
  };

  // Final submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        examName: formData.examName,
        subject: formData.subject,
        year: formData.year,
        tags: tagsArray,
        paperType: formData.paperType,
        fileUrl: formData.fileUrl,
        fileSize: formData.fileSize,
        originalFilename: formData.originalFilename,
        questionsOnlyPrice: formData.questionsOnlyPrice,
        withSolutionsPrice: formData.withSolutionsPrice,
        price: formData.paperType === 'with-solutions' ? formData.withSolutionsPrice : formData.questionsOnlyPrice,
        hasSolutions: formData.paperType === 'with-solutions' && formData.solutionType !== 'skip',
        solutionType: formData.solutionType !== 'skip' ? formData.solutionType : undefined,
        solutionFileUrl: formData.solutionFileUrl || undefined,
        solutionFileSize: formData.solutionFileSize || undefined,
        questions: formData.questions,
        totalQuestions: formData.questions.length,
        uploadedBy: session.user.id,
      };

      const response = await fetch('/api/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Paper published successfully!');
        router.push('/admin');
      } else {
        toast.error(data.error || 'Failed to publish paper');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic Information</h2>
        <p className="text-gray-500 text-sm">Enter the paper details and select the paper type</p>
      </div>

      {/* Paper Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Paper Type *</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, paperType: 'questions-only' }))}
            className={`p-4 rounded-xl border-2 text-left transition ${
              formData.paperType === 'questions-only'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ClipboardList className={`h-6 w-6 mb-2 ${formData.paperType === 'questions-only' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="font-medium text-gray-900">Questions Only</div>
            <div className="text-sm text-gray-500">Upload question paper without solutions</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, paperType: 'with-solutions' }))}
            className={`p-4 rounded-xl border-2 text-left transition ${
              formData.paperType === 'with-solutions'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <BookOpen className={`h-6 w-6 mb-2 ${formData.paperType === 'with-solutions' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="font-medium text-gray-900">With Solutions</div>
            <div className="text-sm text-gray-500">Include answers and solutions</div>
          </button>
        </div>
      </div>

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
          placeholder="e.g., BCS-012 Basic Mathematics December 2023"
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
          rows={3}
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
            Exam/University Name *
          </label>
          <input
            type="text"
            id="examName"
            name="examName"
            value={formData.examName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            placeholder="e.g., IGNOU, Delhi University, JEE Main"
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
            placeholder="e.g., Mathematics, Physics, Computer Science"
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
          placeholder="e.g., calculus, algebra, BCA, term-end"
        />
      </div>
    </div>
  );

  // Step 2: Question Paper Upload
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Upload Question Paper</h2>
        <p className="text-gray-500 text-sm">Upload the PDF file and review detected questions</p>
      </div>

      {/* File Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'question')}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : questionFile
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {isUploading || isParsing ? (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin" />
            <p className="text-gray-600">
              {isParsing ? 'Detecting questions...' : `Uploading... ${uploadProgress}%`}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : questionFile ? (
          <div className="space-y-3">
            <div className="h-12 w-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{formData.originalFilename}</p>
              <p className="text-sm text-gray-500">{formatFileSize(formData.fileSize)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuestionFile(null);
                setFormData((prev) => ({
                  ...prev,
                  fileUrl: '',
                  fileSize: 0,
                  originalFilename: '',
                  questions: [],
                  totalQuestions: 0,
                }));
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove and upload different file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-10 w-10 mx-auto text-gray-400" />
            <div>
              <p className="text-gray-600">Drag and drop your PDF here, or</p>
              <label className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                Browse Files
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleQuestionFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">Maximum file size: 50MB</p>
          </div>
        )}
      </div>

      {/* Detected Questions */}
      {formData.questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Detected Questions ({formData.questions.length})
            </h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {formData.questions.map((q, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <input
                  type="text"
                  value={q.questionNumber}
                  onChange={(e) => handleUpdateQuestion(index, 'questionNumber', e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-gray-200 rounded"
                  placeholder="Q1"
                />
                <input
                  type="number"
                  value={q.marks || ''}
                  onChange={(e) => handleUpdateQuestion(index, 'marks', parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-sm border border-gray-200 rounded"
                  placeholder="Marks"
                />
                <span className="flex-1 text-sm text-gray-600 truncate">
                  {q.questionText || 'No text detected'}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Add if no questions */}
      {formData.fileUrl && formData.questions.length === 0 && (
        <div className="text-center py-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700 text-sm mb-2">No questions were automatically detected.</p>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Add questions manually
          </button>
        </div>
      )}
    </div>
  );

  // Step 3: Pricing
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Set Pricing</h2>
        <p className="text-gray-500 text-sm">
          {formData.paperType === 'with-solutions'
            ? 'Set prices for questions-only and full solution package'
            : 'Set the price for this question paper (set 0 for free)'}
        </p>
      </div>

      {formData.paperType === 'questions-only' ? (
        <div>
          <label htmlFor="questionsOnlyPrice" className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              id="questionsOnlyPrice"
              name="questionsOnlyPrice"
              value={formData.questionsOnlyPrice}
              onChange={handleChange}
              min={0}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="0"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Set to 0 to offer this paper for free</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="font-medium text-blue-900 mb-2">Dual Pricing</h3>
            <p className="text-sm text-blue-700">
              You can offer two pricing tiers: questions-only for practice, and full package with solutions for serious students.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="questionsOnlyPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Questions Only Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="questionsOnlyPrice"
                  name="questionsOnlyPrice"
                  value={formData.questionsOnlyPrice}
                  onChange={handleChange}
                  min={0}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Optional lower price tier</p>
            </div>

            <div>
              <label htmlFor="withSolutionsPrice" className="block text-sm font-medium text-gray-700 mb-2">
                With Solutions Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="withSolutionsPrice"
                  name="withSolutionsPrice"
                  value={formData.withSolutionsPrice}
                  onChange={handleChange}
                  min={0}
                  required
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  placeholder="49"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Premium price for full package</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Step 4: Solutions
  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Add Solutions</h2>
        <p className="text-gray-500 text-sm">Upload a solution PDF or enter answers manually</p>
      </div>

      {/* Solution Type Selection */}
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, solutionType: 'pdf' }))}
          className={`p-4 rounded-xl border-2 text-center transition ${
            formData.solutionType === 'pdf'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Upload className={`h-6 w-6 mx-auto mb-2 ${formData.solutionType === 'pdf' ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="font-medium text-sm">Upload PDF</div>
        </button>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, solutionType: 'manual' }))}
          className={`p-4 rounded-xl border-2 text-center transition ${
            formData.solutionType === 'manual'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className={`h-6 w-6 mx-auto mb-2 ${formData.solutionType === 'manual' ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="font-medium text-sm">Enter Manually</div>
        </button>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, solutionType: 'skip' }))}
          className={`p-4 rounded-xl border-2 text-center transition ${
            formData.solutionType === 'skip'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <X className={`h-6 w-6 mx-auto mb-2 ${formData.solutionType === 'skip' ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="font-medium text-sm">Skip for Now</div>
        </button>
      </div>

      {/* PDF Upload */}
      {formData.solutionType === 'pdf' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'solution')}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            solutionFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {solutionFile ? (
            <div className="space-y-3">
              <div className="h-12 w-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">Solution PDF uploaded</p>
              <p className="text-sm text-gray-500">{formatFileSize(formData.solutionFileSize)}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-10 w-10 mx-auto text-gray-400" />
              <p className="text-gray-600">Drag and drop solution PDF here</p>
              <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                Browse
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleSolutionFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry */}
      {formData.solutionType === 'manual' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter answers for each question below. You can use the rich text editor to format your answers.
          </p>
          {formData.questions.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.questions.map((q, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{q.questionNumber}</span>
                    {q.marks && <span className="text-sm text-gray-500">{q.marks} marks</span>}
                  </div>
                  <textarea
                    value={q.answer || ''}
                    onChange={(e) => handleUpdateQuestion(index, 'answer', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Enter the answer for this question..."
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No questions available. Go back to Step 2 to add questions.
            </p>
          )}
        </div>
      )}

      {/* Skip Message */}
      {formData.solutionType === 'skip' && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-600">
            You can add solutions later by editing this paper from the admin dashboard.
          </p>
        </div>
      )}
    </div>
  );

  // Step 5: Review
  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Publish</h2>
        <p className="text-gray-500 text-sm">Review all details before publishing</p>
      </div>

      <div className="space-y-4">
        {/* Basic Info Summary */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Title:</dt>
            <dd className="text-gray-900">{formData.title}</dd>
            <dt className="text-gray-500">Category:</dt>
            <dd className="text-gray-900 capitalize">{formData.category}</dd>
            <dt className="text-gray-500">Exam/University:</dt>
            <dd className="text-gray-900">{formData.examName}</dd>
            <dt className="text-gray-500">Subject:</dt>
            <dd className="text-gray-900">{formData.subject}</dd>
            <dt className="text-gray-500">Year:</dt>
            <dd className="text-gray-900">{formData.year}</dd>
            <dt className="text-gray-500">Paper Type:</dt>
            <dd className="text-gray-900 capitalize">{formData.paperType.replace('-', ' ')}</dd>
          </dl>
        </div>

        {/* File Summary */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-900 mb-3">Files</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Question Paper:</dt>
            <dd className="text-gray-900">{formData.originalFilename || 'Not uploaded'}</dd>
            <dt className="text-gray-500">Questions Detected:</dt>
            <dd className="text-gray-900">{formData.questions.length}</dd>
            {formData.paperType === 'with-solutions' && (
              <>
                <dt className="text-gray-500">Solutions:</dt>
                <dd className="text-gray-900 capitalize">
                  {formData.solutionType === 'skip' ? 'Not provided' : formData.solutionType}
                </dd>
              </>
            )}
          </dl>
        </div>

        {/* Pricing Summary */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-900 mb-3">Pricing</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {formData.paperType === 'with-solutions' ? (
              <>
                <dt className="text-gray-500">Questions Only:</dt>
                <dd className="text-gray-900">₹{formData.questionsOnlyPrice}</dd>
                <dt className="text-gray-500">With Solutions:</dt>
                <dd className="text-gray-900 font-semibold">₹{formData.withSolutionsPrice}</dd>
              </>
            ) : (
              <>
                <dt className="text-gray-500">Price:</dt>
                <dd className="text-gray-900">
                  {formData.questionsOnlyPrice === 0 ? 'Free' : `₹${formData.questionsOnlyPrice}`}
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isSkipped = step.id === 4 && formData.paperType === 'questions-only';

            if (isSkipped) return null;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`ml-2 text-sm font-medium hidden sm:inline ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
                {index < STEPS.filter((s) => !(s.id === 4 && formData.paperType === 'questions-only')).length - 1 && (
                  <div
                    className={`w-12 sm:w-24 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Publish Paper
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
