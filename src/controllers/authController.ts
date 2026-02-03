import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { BadRequestError } from "../middleware/errorHandler";
import { User } from "../models/User";

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface RefreshRequest extends Request {
  body: {
    refreshToken: string;
  };
}

export const register = async (
  req: RegisterRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      data: user,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: LoginRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(
      email,
      password,
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request & { user?: TokenPayload },
  res: Response,
  next: NextFunction,
) => {
  try {
    // user is attached by auth middleware (we'll create it next)
    if (!req.user) {
      throw new Error("User not authenticated");
    }
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      throw new BadRequestError("User not found");
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: RefreshRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new BadRequestError("Refresh token required");
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      data: tokens,
      message: "Tokens refreshed",
    });
  } catch (error) {
    next(error);
  }
};
