'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize,
  Minimize,
  FileText,
  BookOpen,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Question {
  questionNumber: string;
  questionText?: string;
  marks?: number;
  pageNumber?: number;
  answer?: string;
  answerImageUrl?: string;
}

interface PaperViewerProps {
  fileUrl: string;
  questions?: Question[];
  title?: string;
  hasSolutions?: boolean;
  purchasedWithSolutions?: boolean;
  onDownload?: () => void;
  className?: string;
}

type ViewMode = 'pdf-only' | 'questions-only' | 'side-by-side';

/**
 * Paper Viewer Component
 * Displays PDF with optional questions and answers
 * Supports multiple view modes and zoom controls
 */
export default function PaperViewer({
  fileUrl,
  questions = [],
  title,
  hasSolutions = false,
  purchasedWithSolutions = false,
  onDownload,
  className = '',
}: PaperViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  }, []);

  // Navigation functions
  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const goToPage = useCallback(
    (page: number) => {
      setPageNumber(Math.max(1, Math.min(page, numPages)));
    },
    [numPages]
  );

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  // Rotation
  const rotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Navigate to question's page
  const goToQuestion = useCallback(
    (index: number) => {
      const question = questions[index];
      if (question?.pageNumber) {
        setPageNumber(question.pageNumber);
      }
      setActiveQuestion(index);
    },
    [questions]
  );

  // Get questions on current page
  const currentPageQuestions = questions.filter(
    (q) => !q.pageNumber || q.pageNumber === pageNumber
  );

  // Render question answer content
  const renderAnswer = (question: Question) => {
    if (!purchasedWithSolutions && hasSolutions) {
      return (
        <div className="flex items-center justify-center gap-2 py-4 text-amber-600 bg-amber-50 rounded">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Purchase with solutions to view answer</span>
        </div>
      );
    }

    if (question.answerImageUrl) {
      return (
        <img
          src={question.answerImageUrl}
          alt={`Answer for question ${question.questionNumber}`}
          className="max-w-full rounded"
        />
      );
    }

    if (question.answer) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: question.answer }}
        />
      );
    }

    return <p className="text-gray-500 italic text-sm">No answer provided</p>;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="border-b bg-gray-50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {title && <h3 className="font-medium text-gray-900 truncate max-w-xs">{title}</h3>}
          {numPages > 0 && (
            <span className="text-sm text-gray-500">
              Page {pageNumber} of {numPages}
            </span>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('pdf-only')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                viewMode === 'pdf-only'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title="PDF Only"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => setViewMode('questions-only')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 border-l ${
                viewMode === 'questions-only'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title="Questions Only"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Q&A</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 border-l ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title="Side by Side"
            >
              <span className="hidden sm:inline">Both</span>
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-200 rounded"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div
        className={`flex ${viewMode === 'questions-only' ? '' : ''}`}
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '70vh' }}
      >
        {/* PDF Viewer */}
        {viewMode !== 'questions-only' && (
          <div
            className={`flex-1 overflow-auto bg-gray-200 ${
              viewMode === 'side-by-side' ? 'w-1/2 border-r' : 'w-full'
            }`}
          >
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center h-full text-red-600">
                <AlertCircle className="w-12 h-12 mb-2" />
                <p>{error}</p>
              </div>
            )}

            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="flex justify-center p-4"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-xl"
              />
            </Document>
          </div>
        )}

        {/* Questions Panel */}
        {viewMode !== 'pdf-only' && (
          <div
            className={`overflow-auto bg-white ${
              viewMode === 'side-by-side' ? 'w-1/2' : 'w-full'
            }`}
          >
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <BookOpen className="w-12 h-12 mb-2" />
                <p>No questions available</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Question navigation */}
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  <span className="text-sm font-medium text-gray-700 w-full mb-2">
                    Jump to Question:
                  </span>
                  {questions.map((q, index) => (
                    <button
                      key={q.questionNumber}
                      onClick={() => goToQuestion(index)}
                      className={`px-3 py-1.5 text-sm rounded border ${
                        activeQuestion === index
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Q{q.questionNumber}
                      {q.marks && (
                        <span className="ml-1 text-xs opacity-75">({q.marks}m)</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Questions list */}
                {(viewMode === 'questions-only' ? questions : currentPageQuestions.length > 0 ? currentPageQuestions : questions).map(
                  (question) => (
                    <div
                      key={question.questionNumber}
                      id={`question-${question.questionNumber}`}
                      className={`border rounded-lg p-4 ${
                        activeQuestion === questions.indexOf(question)
                          ? 'ring-2 ring-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            Question {question.questionNumber}
                          </span>
                          {question.marks && (
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {question.marks} marks
                            </span>
                          )}
                          {question.pageNumber && (
                            <button
                              onClick={() => goToPage(question.pageNumber!)}
                              className="text-xs text-gray-500 hover:text-blue-600"
                            >
                              Page {question.pageNumber}
                            </button>
                          )}
                        </div>
                      </div>

                      {question.questionText && (
                        <div className="mb-4 text-gray-700 bg-gray-50 p-3 rounded">
                          {question.questionText}
                        </div>
                      )}

                      {/* Answer section */}
                      {(hasSolutions || question.answer || question.answerImageUrl) && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-sm font-medium text-green-700 mb-2">
                            Answer:
                          </h4>
                          {renderAnswer(question)}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer toolbar */}
      <div className="border-t bg-gray-50 p-3 flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-14 px-2 py-1 border rounded text-center text-sm"
              min={1}
              max={numPages}
            />
            <span className="text-gray-500">/ {numPages}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={resetZoom}
            className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="border-l mx-2 h-6"></div>

          <button
            onClick={rotate}
            className="p-2 hover:bg-gray-200 rounded"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {onDownload && (
            <>
              <div className="border-l mx-2 h-6"></div>
              <button
                onClick={onDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
