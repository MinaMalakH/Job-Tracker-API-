import { Response, Request, NextFunction } from "express";
import { AiService } from "../services/aiService";
import { authenticatedRequest } from "../middleware/auth";
import { ResumeService } from "../services/resumeService";
import { BadRequestError } from "../middleware/errorHandler";
import { Application } from "../models/Application";

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
    const analysis = await AiService.analyzeResume(
      textToAnalyze,
      jobDescription,
    );

    // Optional: Save to application if applicationId provided
    if (applicationId) {
      await Application.findOneAndUpdate(
        { _id: applicationId, userId: req.user.userId },
        {
          $set: {
            aiSuggestions: {
              keywords: analysis.keywords,
              missingKeywords: analysis.missingKeywords,
              skillsToEmphasize: analysis.skillsToEmphasize,
              experienceToHighlight: analysis.experienceToHighlight,
              recommendedChanges: analysis.recommendedChanges,
              matchScore: analysis.matchScore,
              generatedAt: new Date(),
            },
          },
        },
      );
    }
    res.status(200).json({
      success: true,
      data: analysis,
      message: "Resume analysis complete",
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

    const { position, company, resumeSummary, jobDescription } = req.body;

    const coverLetter = await AiService.generateCoverLetter(
      position,
      company,
      resumeSummary,
      jobDescription,
    );
    res.status(200).json({
      success: true,
      data: { coverLetter },
      message: "Cover letter generated successfully",
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
