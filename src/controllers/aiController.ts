import { Response, Request, NextFunction } from "express";
import { AiService } from "../services/aiService";
import { authenticatedRequest } from "../middleware/auth";
import { ResumeService } from "../services/resumeService";
import { BadRequestError } from "../middleware/errorHandler";
import { Application } from "../models/Application";
import { aiQueue } from "../queues/aiQueue";

interface AnalyzeRequest extends authenticatedRequest {
  body: {
    resumeId?: string;
    resumeText?: string;
    jobDescription: string;
    applicationId?: string;
  };
}

export const analyzeResume = async (
  req: AnalyzeRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    const {
      resumeId,
      resumeText: providedText,
      jobDescription,
      applicationId,
    } = req.body;

    let textToAnalyze = providedText || "";
    // If resumeId provided, fetch extractedText from DB
    if (resumeId) {
      const resume = await ResumeService.getResumeById(
        req.user.userId,
        resumeId,
      );
      if (!resume.extractedText) {
        throw new BadRequestError("Resume has no extracted text");
      }
      textToAnalyze = resume.extractedText;
    }
    if (!textToAnalyze.trim()) {
      throw new BadRequestError("No resume text available for analysis");
    }
    if (!jobDescription.trim()) {
      throw new BadRequestError("Job description is required");
    }

    // Add to queue instead of running directly
    const job = await aiQueue.add("analyze-resume", {
      resumeId,
      resumeText: textToAnalyze,
      jobDescription,
      applicationId,
      userId: req.user.userId,
    });

    res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        status: "queued",
        message:
          "Analysis job queued. Use /api/ai/job/" +
          job.id +
          " to check status later.",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const testAiConnection = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await AiService.testConnection();

    res.status(200).json({
      success: true,
      data: {
        response: result,
      },
      message: "OpenAI connection test successful",
    });
  } catch (error) {
    next(error);
  }
};

export const generateCoverLetter = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    const { position, company, resumeSummary, jobDescription, applicationId } =
      req.body;

    if (!position || !company || !resumeSummary || !jobDescription) {
      throw new BadRequestError(
        "Position, company, resume summary, and job description are required",
      );
    }

    // Add job to queue
    const job = await aiQueue.add("generate-cover-letter", {
      position,
      company,
      resumeSummary,
      jobDescription,
      applicationId,
      userId: req.user.userId,
    });

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: "queued",
        message:
          "Cover letter generation queued. Use /api/ai/job/" +
          job.id +
          " to check status later.",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateInterviewPrep = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    const { position, company, resumeSummary } = req.body;

    const prep = await AiService.generateInterviewPrep(
      position,
      company,
      resumeSummary,
    );

    res.status(200).json({
      success: true,
      data: prep,
      message: "Interview preparation generated",
    });
  } catch (error) {
    next(error);
  }
};
