import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { jwtVerify, SignJWT } from "jose";
import { serverEnv } from "@/config/env";
import { UserRole } from "@/types/database";
import { AppError } from "./api-error";
import { IUserDocument } from "@/models/User";

export interface TokenPayload {
  userId: string;
  phone: string;
  role: UserRole;
  fullName: string;
  studentId?: string; // Linked Student document _id if role is student
  teacherId?: string; // Linked Teacher document _id if role is teacher
  iat?: number;
  exp?: number;
}

const SALT_ROUNDS = 12; // High-security salt rounds for password hashing

export const AUTH_COOKIE_NAME = "auth_token";
export const CSRF_COOKIE_NAME = "csrf_token";

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // Accessible to client-side scripts to attach in x-csrf-token header
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token (Node.js runtime)
 */
export function signJwtToken(
  payload: Omit<TokenPayload, "iat" | "exp">,
  expiresIn: string | number = serverEnv.JWT_EXPIRES_IN
): string {
  return jwt.sign(payload, serverEnv.JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Generate a signed JWT token using Jose (Edge compatible)
 */
export async function signEdgeJwt(
  payload: Omit<TokenPayload, "iat" | "exp">,
  expirationTime = "7d"
): Promise<string> {
  const secret = new TextEncoder().encode(serverEnv.JWT_SECRET);
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret);
}

/**
 * Verify and decode a JWT token (Node.js runtime)
 */
export function verifyJwtToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, serverEnv.JWT_SECRET) as TokenPayload;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: string }).name === "TokenExpiredError"
    ) {
      throw AppError.unauthorized(
        "Token has expired",
        "আপনার সেশনের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় লগইন করুন।"
      );
    }
    throw AppError.unauthorized(
      "Invalid token",
      "অননুমোদিত সেশন। অনুগ্রহ করে লগইন করুন।"
    );
  }
}

/**
 * Verify JWT token in Next.js Edge Middleware
 */
export async function verifyEdgeJwt(token: string): Promise<TokenPayload> {
  try {
    const secret = new TextEncoder().encode(serverEnv.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "ERR_JWT_EXPIRED"
    ) {
      throw AppError.unauthorized(
        "Token has expired",
        "আপনার সেশনের মেয়াদ শেষ হয়ে গেছে।"
      );
    }
    throw AppError.unauthorized("Invalid token", "অননুমোদিত সেশন।");
  }
}

/**
 * Generate a secure cryptographically random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a secure password reset token and its sha256 hash
 */
export function generatePasswordResetToken(): { rawToken: string; hashedToken: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
}

/**
 * Check if a user account is locked due to consecutive failed attempts
 */
export function checkAccountLockout(user: IUserDocument): void {
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockUntil.getTime() - Date.now()) / (60 * 1000)
    );
    throw AppError.forbidden(
      "Account temporarily locked",
      `অতিরিক্ত ভুল পাসওয়ার্ড দেওয়ার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক করা হয়েছে। অনুগ্রহ করে ${remainingMinutes} মিনিট পর চেষ্টা করুন।`
    );
  }
}

/**
 * Handle failed login: increment attempts and lock account if limit exceeded
 */
export async function recordFailedLoginAttempt(user: IUserDocument): Promise<void> {
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

  // Lock account for 15 minutes after 5 consecutive failed attempts
  if (user.failedLoginAttempts >= 5) {
    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  }

  await user.save();
}

/**
 * Handle successful login: reset failed attempts and clear lockout
 */
export async function recordSuccessfulLogin(user: IUserDocument): Promise<void> {
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
}
