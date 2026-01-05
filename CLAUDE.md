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
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Lucide icons
- **Backend**: Next.js API routes, MongoDB/Mongoose, NextAuth.js (JWT)
- **Payments**: Razorpay integration

### Directory Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── auth/[...nextauth]/  # NextAuth config
│   │   ├── papers/           # Papers CRUD + [id] routes
│   │   └── payment/          # create-order/, verify/
│   ├── auth/                 # Login, Register pages
│   ├── admin/                # Admin dashboard, upload
│   ├── dashboard/            # User dashboard, downloads
│   └── papers/               # Browse + [id] detail page
├── components/
│   ├── layout/               # Header, Footer
│   └── ui/                   # SearchBar, PaperCard, FilterSidebar
├── lib/
│   ├── mongodb.ts            # DB connection singleton
│   └── auth.ts               # Auth helpers (getSession, requireAuth, requireAdmin)
├── models/                   # Mongoose schemas: User, Paper, Transaction
└── types/                    # Type extensions (next-auth.d.ts)
```

### Data Models

**User**: `name`, `email`, `password`, `role` (student|admin), `purchasedPapers[]`, `wishlist[]`

**Paper**: `title`, `description`, `category` (university|board|competitive), `examName`, `subject`, `year`, `price`, `fileUrl`, `downloads`, `ratings`, `tags[]`

**Transaction**: `userId`, `paperId`, `amount`, `razorpayOrderId`, `razorpayPaymentId`, `status` (pending|completed|failed|refunded), `downloadCount`, `maxDownloads`

### Authentication Flow
- NextAuth.js with Credentials provider
- JWT sessions (30-day expiry)
- Role-based access: `student` (default), `admin`
- Auth helpers in `lib/auth.ts`: `requireAuth()`, `requireAdmin()`, `getCurrentUser()`

### Payment Flow
1. `POST /api/payment/create-order` - Creates Razorpay order, saves pending transaction
2. Client handles Razorpay modal
3. `POST /api/payment/verify` - Verifies signature, updates transaction, grants access

### API Patterns
- Papers API supports: pagination (`page`, `limit`), filters (`category`, `subject`, `year`, `minPrice`, `maxPrice`), full-text `search`, sorting (`newest`, `price-low`, `popular`, etc.)
- File URLs excluded from list queries for security
- Mongoose models use `mongoose.models.X || mongoose.model()` pattern to prevent recompilation

## Environment Variables

Required in `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/starpaper
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## Key Conventions
- Client components marked with `'use client'` directive
- All pages under `app/` use Next.js App Router conventions
- API route params use `params: Promise<{ id: string }>` pattern (Next.js 15+ async params)
- Toast notifications via `react-hot-toast`
- Icons from `lucide-react`
