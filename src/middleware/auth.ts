import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { BadRequestError } from "./errorHandler";

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
    return next(new BadRequestError("No token Provided"));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new BadRequestError("Invalid or Expired Token"));
  }
};
