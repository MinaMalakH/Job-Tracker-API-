import { Schema, model, Document, Types } from "mongoose";

export interface IResume extends Document {
  userId: Types.ObjectId;
  fileName: string;
  fileUrl: string; // Cloudinary secure URL
  publicId: string; // Cloudinary public_id (for deletion later)
  fileDownloadUrl: string; // Cloudinary URL with flags for forced download
  extractedText?: string; // Raw text content
  version?: string; // e.g. "v1", "v2 - tailored for Google"
  uploadedAt: Date;
  isDefault: boolean;
}

const resumeSchema = new Schema<IResume>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileDownloadUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  extractedText: {
    type: String,
  },
  version: {
    type: String,
    default: "v1",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

// Ensure only one default resume per user
resumeSchema.pre("save", async function () {
  try {
    if (this.isDefault && this.isModified("isDefault")) {
      // Only run if isDefault was actually modified and set to true
      await Resume.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } },
      );
    }
  } catch (error) {
    console.error("Error ensuring single default resume:", error);
    throw error; // Let the error propagate to be handled by the caller
  }
});

export const Resume = model<IResume>("Resume", resumeSchema);
