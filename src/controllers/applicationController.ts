import { Request, Response, NextFunction } from "express";
import { ApplicationService } from "../services/applicationService";
import { authenticatedRequest } from "../middleware/auth";
import { BadRequestError } from "../middleware/errorHandler";
import { AnalyticService } from "../services/analyticsService";

export const createApplication = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const application = await ApplicationService.createApplication(
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: application,
      message: "Application created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated ");
    }

    const { status, platform, company, sortBy, page, limit } = req.query;

    const filters = {
      status: status as string | undefined,
      platform: platform as string | undefined,
      company: company as string | undefined,
      sortBy: sortBy as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    };

    const result = await ApplicationService.getUserApplications(
      req.user.userId,
      filters,
    );

    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: {
        total: result.total,
        page: result.page,
        limit: filters.limit || 20,
        totalPages: Math.ceil(result.total / (filters.limit || 20)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    const application = await ApplicationService.getApplicationById(
      req.user.userId,
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");
    const updated = await ApplicationService.updateApplication(
      req.user.userId,
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: updated,

      message: "Application updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteApplication = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    await ApplicationService.deleteApplication(
      req.user.userId,
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");

    const { status } = req.body;

    if (!status) {
      throw new BadRequestError("Status is required");
    }

    const updated = await ApplicationService.updateStatus(
      req.user.userId,
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
      status,
    );

    res.status(200).json({
      success: true,
      data: updated,
      message: `Status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new Error("User not authenticated");
    // Optional: trigger update before fetch (for fresh data)
    await AnalyticService.updateMonthlyStats(req.user.userId);

    const stats = await AnalyticService.getUserStats(req.user.userId);

    res.status(200).json({
      success: true,
      data: stats,
      message: "Application statistics retrieved",
    });
  } catch (error) {
    next(error);
  }
};
