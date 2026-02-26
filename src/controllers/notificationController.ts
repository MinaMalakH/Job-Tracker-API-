import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notificationService";
import { authenticatedRequest } from "../middleware/auth";

export const getNotifications = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");
    const notifications = await NotificationService.getUserNotifications(
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};
