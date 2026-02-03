import { BadRequestError } from "../middleware/errorHandler";
import { User, IUser } from "../models/User";
import { hashPassword, comparePassword } from "../utils/password";
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt";

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export class AuthService {
  static async register(data: RegisterInput): Promise<Partial<IUser>> {
    const { email, password, name, phone } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError("Email already in use");
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  static async login(
    email: string,
    password: string,
  ): Promise<{
    user: Partial<IUser>;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new BadRequestError("Invalid credentials");
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new BadRequestError("Invalid credentials");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new BadRequestError("User not found");
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new BadRequestError("Invalid refresh token");
    }
  }
}
