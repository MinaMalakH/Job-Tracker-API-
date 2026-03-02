import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { BadRequestError, UnauthorizedError } from "./errorHandler";

export interface authenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new UnauthorizedError("No token Provided")); // ✅ 401
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or Expired Token")); // ✅ 401
  }
};
