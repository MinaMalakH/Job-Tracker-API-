import { Resume, IResume } from "../models/Resume";
import PDFParse from "pdf-parse-new";
import mammoth from "mammoth";
import { BadRequestError } from "../middleware/errorHandler";
import cloudinary from "../config/cloudinary"; // your config file
import { Readable } from "stream";

export class ResumeService {
  static async uploadResume(
    userId: string,
    file: Express.Multer.File,
    version?: string,
  ): Promise<IResume> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestError("No valid file uploaded");
    }

    let extractedText = "";
    try {
      if (file.mimetype === "application/pdf") {
        const data = await PDFParse(file.buffer);
        extractedText = data.text || "";
      } else if (
        file.mimetype === "application/msword" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value || "";
      }
    } catch (error: any) {
      console.error("Text extraction failed:", error);
    }

    const fileExtension =
      file.originalname.split(".").pop()?.toLowerCase() || "pdf";
    const fileName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/\.[^/.]+$/, "");

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "job-tracker/resumes",
          resource_type: "raw",
          public_id: `${userId}-${Date.now()}-${fileName}`,
          format: fileExtension,
          allowed_formats: ["pdf", "doc", "docx"],
          type: "upload",
          access_mode: "public",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });

    // ---------------------------------------------------------------
    // Preview URL  → opens the file inline in the browser tab
    // No Cloudinary flags needed; the browser decides based on MIME type
    // ---------------------------------------------------------------
    const fileUrl = uploadResult.secure_url;

    // ---------------------------------------------------------------
    // Download URL → forces the browser to download the file.
    // fl_attachment:<filename> tells Cloudinary to set the header:
    //   Content-Disposition: attachment; filename="<filename>"
    // The filename is URI-encoded so spaces / special chars are safe.
    // ---------------------------------------------------------------
    const encodedFileName = encodeURIComponent(file.originalname);
    const fileDownloadUrl = uploadResult.secure_url.replace(
      "/upload/",
      `/upload/fl_attachment:${encodedFileName}/`,
    );

    const resume = await Resume.create({
      userId,
      fileName: file.originalname,
      fileUrl, // ← use this when you want to open/preview the file
      fileDownloadUrl, // ← use this when you want to trigger a download
      publicId: uploadResult.public_id,
      extractedText,
      version: version || "v1",
      isDefault: false,
    });

    return resume;
  }

  static async getUserResumes(userId: string): Promise<IResume[]> {
    return Resume.find({ userId }).sort({ uploadedAt: -1 }).lean();
  }

  static async getResumeById(
    userId: string,
    resumeId: string,
  ): Promise<IResume> {
    const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!resume) {
      throw new BadRequestError("Resume not found or not owned by user");
    }
    return resume;
  }
}
