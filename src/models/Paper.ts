import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaper extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'university' | 'board' | 'competitive';
  examName: string;
  subject: string;
  year: number;

  // Legacy field - kept for backward compatibility
  price: number;

  fileUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  uploadedBy: mongoose.Types.ObjectId;
  downloads: number;
  ratings: {
    average: number;
    count: number;
  };
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // File metadata (new)
  fileSize?: number;
  originalFilename?: string;
  uploadedAt?: Date;

  // Paper type and pricing (new)
  paperType: 'questions-only' | 'with-solutions';
  questionsOnlyPrice: number;
  withSolutionsPrice?: number;

  // Solutions storage (new)
  hasSolutions: boolean;
  solutionType?: 'pdf' | 'manual' | 'hybrid';
  solutionFileUrl?: string;
  solutionFileSize?: number;

  // Question structure (new)
  questions: Array<{
    questionNumber: string;
    questionText?: string;
    marks?: number;
    pageNumber?: number;
    answer?: string;
    answerImageUrl?: string;
  }>;
  totalQuestions: number;
}

const PaperSchema: Schema<IPaper> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    category: {
      type: String,
      enum: ['university', 'board', 'competitive'],
      required: [true, 'Please select a category'],
    },
    examName: {
      type: String,
      required: [true, 'Please provide exam name'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide subject'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Please provide year'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: [0, 'Price cannot be negative'],
    },
    fileUrl: {
      type: String,
      required: [true, 'Please provide file URL'],
    },
    previewUrl: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    // File metadata
    fileSize: {
      type: Number,
      required: false,
    },
    originalFilename: {
      type: String,
      required: false,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    // Paper type and pricing
    paperType: {
      type: String,
      enum: ['questions-only', 'with-solutions'],
      default: 'questions-only',
      required: true,
    },
    questionsOnlyPrice: {
      type: Number,
      min: 0,
      default: 0, // Can be free
    },
    withSolutionsPrice: {
      type: Number,
      min: 0,
      required: false,
    },
    // Solutions storage
    hasSolutions: {
      type: Boolean,
      default: false,
    },
    solutionType: {
      type: String,
      enum: ['pdf', 'manual', 'hybrid'],
      required: false,
    },
    solutionFileUrl: {
      type: String,
      required: false,
    },
    solutionFileSize: {
      type: Number,
      required: false,
    },
    // Question structure
    questions: [
      {
        questionNumber: {
          type: String,
          required: true,
        },
        questionText: {
          type: String,
          required: false,
        },
        marks: {
          type: Number,
          required: false,
          min: 0,
          max: 100,
        },
        pageNumber: {
          type: Number,
          required: false,
          min: 1,
        },
        answer: {
          type: String, // HTML content from rich text editor
          required: false,
        },
        answerImageUrl: {
          type: String,
          required: false,
        },
      },
    ],
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search optimization
PaperSchema.index({ title: 'text', description: 'text', subject: 'text', examName: 'text' });
PaperSchema.index({ category: 1, subject: 1, year: -1 });
PaperSchema.index({ price: 1 });

const Paper: Model<IPaper> = mongoose.models.Paper || mongoose.model<IPaper>('Paper', PaperSchema);

export default Paper;
