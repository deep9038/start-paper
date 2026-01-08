# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

Star Paper is a Next.js 16 full-stack application for selling previous year question papers with handwritten solutions. It uses the App Router pattern.

### Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Lucide icons, Tiptap (rich text editor)
- **Backend**: Next.js API routes, MongoDB/Mongoose, NextAuth.js (JWT)
- **Payments**: Razorpay integration
- **File Storage**: Vercel Blob Storage (production) / Local storage (development)
- **PDF Processing**: pdf-parse (question extraction), react-pdf (viewer)
- **Math Rendering**: KaTeX (LaTeX equations)

### Directory Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── auth/[...nextauth]/  # NextAuth config
│   │   ├── papers/           # Papers CRUD + [id] routes
│   │   │   └── parse-pdf/    # PDF question extraction
│   │   ├── upload/
│   │   │   └── paper/        # File upload endpoint
│   │   └── payment/          # create-order/, verify/
│   ├── auth/                 # Login, Register pages
│   ├── admin/                # Admin dashboard, upload (multi-step wizard)
│   │   └── papers/[id]/edit/ # Edit existing papers
│   ├── dashboard/            # User dashboard, downloads
│   └── papers/               # Browse + [id] detail page + viewer
├── components/
│   ├── layout/               # Header, Footer
│   ├── admin/                # AnswerEditor (rich text for solutions)
│   ├── papers/               # PaperViewer (integrated Q&A viewer)
│   └── ui/                   # SearchBar, PaperCard, FilterSidebar
├── lib/
│   ├── mongodb.ts            # DB connection singleton
│   ├── auth.ts               # Auth helpers (getSession, requireAuth, requireAdmin)
│   ├── fileValidation.ts     # PDF validation utilities
│   ├── blobStorage.ts        # Vercel Blob upload/delete functions
│   └── pdfParser.ts          # Question extraction from PDFs
├── models/                   # Mongoose schemas: User, Paper, Transaction
└── types/                    # Type extensions (next-auth.d.ts)
```

### Data Models

**User**: `name`, `email`, `password`, `role` (student|admin), `purchasedPapers[]`, `wishlist[]`

**Paper** (comprehensive schema):
- **Basic**: `title`, `description`, `category` (university|board|competitive), `examName`, `subject`, `year`, `tags[]`
- **Pricing**: `paperType` (questions-only|with-solutions), `questionsOnlyPrice`, `withSolutionsPrice`, `price` (legacy)
- **Files**: `fileUrl`, `fileSize`, `originalFilename`, `uploadedAt`
- **Solutions**: `hasSolutions`, `solutionType` (pdf|manual|hybrid), `solutionFileUrl`, `solutionFileSize`
- **Questions**: `questions[]` (questionNumber, questionText, marks, pageNumber, answer, answerImageUrl), `totalQuestions`
- **Meta**: `downloads`, `ratings`, `uploadedBy`, `isActive`

**Transaction**: `userId`, `paperId`, `amount`, `razorpayOrderId`, `razorpayPaymentId`, `status` (pending|completed|failed|refunded), `downloadCount`, `maxDownloads`, `purchaseType` (questions-only|with-solutions)

### Authentication Flow
- NextAuth.js with Credentials provider
- JWT sessions (30-day expiry)
- Role-based access: `student` (default), `admin`
- Auth helpers in `lib/auth.ts`: `requireAuth()`, `requireAdmin()`, `getCurrentUser()`

### Payment Flow
1. `POST /api/payment/create-order` - Creates Razorpay order, saves pending transaction
2. Client handles Razorpay modal
3. `POST /api/payment/verify` - Verifies signature, updates transaction, grants access

### Upload & Solutions Management Flow

**Paper Types:**
- **Questions Only**: Upload question paper PDF only (free or low-cost, for practice)
- **With Solutions**: Full paper with solutions (premium pricing)

**Upload Flow (Multi-step wizard):**
1. **Step 1 - Basic Info**: Title, description, category, exam, subject, year, paper type
2. **Step 2 - Question PDF**: Upload PDF, auto-detect questions via OCR/parsing
3. **Step 3 - Pricing**: Set prices (single or dual pricing based on paper type)
4. **Step 4 - Solutions** (if with-solutions): Upload solution PDF OR manually enter answers
5. **Step 5 - Review & Publish**: Preview and publish

**Solution Provision Methods:**
- **PDF Upload**: Separate solution PDF file stored in Vercel Blob
- **Manual Entry**: Rich text editor (Tiptap) with LaTeX support for each question
- **Hybrid**: Combination of PDF and manual answers

**Question Auto-Detection:**
- `POST /api/papers/parse-pdf` extracts questions from uploaded PDF
- Pattern matching: `1(a)`, `Q1`, `Question 1`, etc.
- Extracts marks allocation and page numbers
- Admin can review/edit detected questions before saving

**File Upload API:**
- `POST /api/upload/paper` - Upload question or solution PDFs
- Server-side validation: PDF signature (magic bytes), file size (≤50MB), MIME type
- **Development**: Files stored locally in `public/uploads/` (served by Next.js)
- **Production**: Files stored in Vercel Blob with sanitized filenames

### API Patterns
- Papers API supports: pagination (`page`, `limit`), filters (`category`, `subject`, `year`, `minPrice`, `maxPrice`), full-text `search`, sorting (`newest`, `price-low`, `popular`, etc.)
- File URLs excluded from list queries for security
- Mongoose models use `mongoose.models.X || mongoose.model()` pattern to prevent recompilation

## Environment Variables

Required in `.env.local`:
```
# Database
MONGODB_URI=mongodb://localhost:27017/starpaper

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Vercel Blob Storage (optional for development)
# Leave commented out to use local storage (public/uploads/)
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXX

# File Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
ALLOWED_MIME_TYPES=application/pdf

# App
NEXT_PUBLIC_APP_NAME=Star Paper
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Conventions
- Client components marked with `'use client'` directive
- All pages under `app/` use Next.js App Router conventions
- API route params use `params: Promise<{ id: string }>` pattern (Next.js 15+ async params)
- Toast notifications via `react-hot-toast`
- Icons from `lucide-react`

## Utility Libraries

### `lib/fileValidation.ts`
- `validatePDFMimeType(file)` - Client-side MIME check
- `validatePDFSignature(buffer)` - Server-side magic number check (0x25504446 = %PDF)
- `validateBuffer(buffer, filename)` - Comprehensive server validation
- `sanitizeFilename(filename)` - Generates safe unique filenames
- `formatFileSize(bytes)` - Human-readable file sizes

### `lib/blobStorage.ts`
- Automatically uses local storage (`public/uploads/`) when `BLOB_READ_WRITE_TOKEN` is not set
- `uploadPaperPDF(buffer, filename, folder)` - Upload PDF to storage
- `uploadSolutionPDF(buffer, filename)` - Upload solution files
- `uploadAnswerImage(buffer, filename, paperId, questionNumber)` - Upload answer images
- `deletePaperPDF(fileUrl)` - Delete files from storage
- `isVercelBlobUrl(url)` - Check if URL is from Vercel Blob
- `isLocalUrl(url)` - Check if URL is from local storage
- `getStorageInfo()` - Get current storage mode (local/vercel-blob)

### `lib/pdfParser.ts`
- `parsePDFQuestions(buffer)` - Extract question structure from PDF
- `cleanQuestions(questions)` - Remove duplicates and false positives
- `extractTotalMarks(text)` - Extract total marks from PDF header
- Pattern matching for: `1(a)`, `1.`, `Q1`, `Question 1`

## Implementation Status

### Phase 1: Foundation & Setup ✅
- [x] Dependencies installed (@vercel/blob, pdf-parse, tiptap, katex, react-pdf)
- [x] Environment variables configured
- [x] Utility libraries created (fileValidation, blobStorage, pdfParser)
- [x] Paper model updated with solutions schema
- [x] Upload API route created
- [x] PDF parsing API route created

### Phase 2: Upload Form & Question Detection ✅
- [x] Multi-step upload wizard (5 steps: Basic Info → Question PDF → Pricing → Solutions → Review)
- [x] Drag-and-drop PDF upload with progress indicator
- [x] Automatic question detection from uploaded PDFs
- [x] Question editing interface (add/remove/edit)
- [x] Paper type selection (questions-only vs with-solutions)
- [x] Dual pricing configuration

### Phase 3: Components ✅
- [x] AnswerEditor component (`src/components/admin/AnswerEditor.tsx`)
  - Tiptap rich text editor with toolbar
  - LaTeX/math support via KaTeX
  - Image upload support
  - Bubble menu for quick formatting
- [x] PaperViewer component (`src/components/papers/PaperViewer.tsx`)
  - react-pdf integration for PDF display
  - Multiple view modes: PDF-only, Q&A-only, side-by-side
  - Zoom, rotation, and navigation controls
  - Question navigation with page linking
  - Solution access control (locked for non-purchasers)

### Phase 3.5: Development Infrastructure ✅
- [x] Local file storage fallback for development (no Vercel Blob setup needed)
- [x] Fixed API auth to properly use `authOptions` with `getServerSession()`
- [x] Admin promotion script (`scripts/make-admin.js`)

### Phase 4-8: Pending
- [ ] Edit existing papers functionality
- [ ] Purchase flow with dual pricing
- [ ] Update Transaction model with purchaseType
- [ ] Access control for solutions in download API
- [ ] Testing and polish
