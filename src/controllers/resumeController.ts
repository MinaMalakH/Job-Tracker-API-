import { Request, Response, NextFunction } from "express";
import { ResumeService } from "../services/resumeService";
import { authenticatedRequest } from "../middleware/auth";
import { BadRequestError } from "../middleware/errorHandler";
import { getSignedResumeUrl } from "../utils/cloudinary"; // ← import here

export const uploadResume = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");
    if (!req.file) throw new BadRequestError("No resume file provided");

    const resume = await ResumeService.uploadResume(
      req.user.userId,
      req.file,
      req.body.version,
    );
    // Generate signed URL for immediate access
    const signedUrl = getSignedResumeUrl(resume.publicId, 86400); // 24 hours for convenience

    res.status(201).json({
      success: true,
      data: {
        ...resume.toObject(),
        fileUrl: signedUrl, // override the original direct URL
        // OR: signedFileUrl: signedUrl,   // keep both if you prefer
      },
      message: "Resume uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllResumes = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    const resumes = await ResumeService.getUserResumes(req.user.userId);

    res.status(200).json({
      success: true,
      data: resumes,
      count: resumes.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getResume = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    const resume = await ResumeService.getResumeById(
      req.user.userId,
      req.params.id as string,
    );
    const signedUrl = getSignedResumeUrl(resume.publicId, 3600);

    res.status(200).json({
      success: true,
      data: {
        ...resume.toObject(),
        fileUrl: signedUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
