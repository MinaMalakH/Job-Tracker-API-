import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET must be set in environment variables. Generate: openssl rand -base64 32",
  );
}

if (!REFRESH_TOKEN_SECRET) {
  throw new Error(
    "JWT_REFRESH_SECRET must be set in environment variables. Generate: openssl rand -base64 32",
  );
}
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (user: Partial<IUser>): string => {
  const payload: TokenPayload = {
    userId: user._id!.toString(),
    email: user.email!,
  };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

export const generateRefreshToken = (user: Partial<IUser>): string => {
  const payload: TokenPayload = {
    userId: user._id!.toString(),
    email: user.email!,
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
};
