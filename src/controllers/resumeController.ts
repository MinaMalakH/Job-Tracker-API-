import { Request, Response, NextFunction } from "express";
import { ResumeService } from "../services/resumeService";
import { authenticatedRequest } from "../middleware/auth";
import { BadRequestError } from "../middleware/errorHandler";

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

    res.status(201).json({
      success: true,
      data: resume,
      message: "Resume uploaded successfully ",
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

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};
