import { Schema, model, Document, Types } from "mongoose";

export interface IApplication extends Document {
  userId: Types.ObjectId;
  company: string;
  position: string;
  jobDescription?: string;
  jobUrl?: string;
  platform?: string; // e.g. LinkedIn, Wuzzuf, Direct, Company Website
  location?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  status: string; // applied, screening, interview, offer, rejected
  appliedDate: Date;
  lastUpdated: Date;
  timeline: Array<{
    status: string;
    date: Date;
    notes?: string;
  }>;
  notes?: string;
  resumeUsed?: Types.ObjectId; // ref to Resume later
  coverLetter?: string;
  aiSuggestions?: {
    keywords: string[];
    tailoredResume?: string;
    generatedAt?: Date;
  };
  followUpDate?: Date;
  createdAt: Date;
}

const applicationSchema = new Schema<IApplication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  company: {
    type: String,
    required: [true, "Company name is required"],
    trim: true,
  },
  position: {
    type: String,
    required: [true, "Position is required"],
    trim: true,
  },
  jobDescription: {
    type: String,
    trim: true,
  },
  jobUrl: {
    type: String,
    trim: true,
  },
  platform: {
    type: String,
    trim: true,
    default: "Direct",
  },
  location: String,
  salaryRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: "USD" },
  },
  status: {
    type: String,
    enum: ["applied", "screening", "interview", "offer", "rejected"],
    default: "applied",
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  timeline: [
    {
      status: String,
      date: { type: Date, default: Date.now },
      notes: String,
    },
  ],
  notes: String,
  resumeUsed: {
    type: Schema.Types.ObjectId,
    ref: "Resume",
  },
  coverLetter: String,
  aiSuggestions: {
    keywords: [String],
    tailoredResume: String,
    generatedAt: Date,
  },
  followUpDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update lastUpdated on save
applicationSchema.pre("save", async function () {
  this.lastUpdated = new Date();
});

export const Application = model<IApplication>(
  "Application",
  applicationSchema,
);
