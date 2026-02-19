import { Response, Request, NextFunction } from "express";
import { AiService } from "../services/aiService";
import { authenticatedRequest } from "../middleware/auth";

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
