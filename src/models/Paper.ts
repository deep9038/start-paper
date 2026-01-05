import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaper extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'university' | 'board' | 'competitive';
  examName: string;
  subject: string;
  year: number;
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
