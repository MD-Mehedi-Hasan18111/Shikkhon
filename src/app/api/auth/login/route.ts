import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import {
  comparePassword,
  signJwtToken,
  generateCsrfToken,
  checkAccountLockout,
  recordFailedLoginAttempt,
  recordSuccessfulLogin,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  CSRF_COOKIE_NAME,
  CSRF_COOKIE_OPTIONS,
} from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";
import { normalizePhoneNumber } from "@/lib/db-utils";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";

const loginSchema = z.object({
  phone: z.string().trim().min(1, "মোবাইল নম্বর প্রদান করুন"),
  password: z.string().min(1, "পাসওয়ার্ড প্রদান করুন"),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    // 1. Client IP and Rate Limiting
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const ipRateLimit = checkRateLimit(`login:ip:${clientIp}`, 10, 15 * 60 * 1000);
    if (!ipRateLimit.allowed) {
      throw AppError.forbidden(
        "Rate limit exceeded",
        `অতিরিক্ত লগইন চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে ${Math.ceil(
          ipRateLimit.retryAfterSeconds / 60
        )} মিনিট পর চেষ্টা করুন।`
      );
    }

    // 2. Validate Request Body
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    const normalizedPhone = normalizePhoneNumber(validatedData.phone);
    if (!normalizedPhone || normalizedPhone.length !== 11) {
      throw AppError.unauthorized(
        "Invalid credentials",
        "প্রদত্ত মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।"
      );
    }

    // Rate limit per phone number
    const phoneRateLimit = checkRateLimit(
      `login:phone:${normalizedPhone}`,
      5,
      15 * 60 * 1000
    );
    if (!phoneRateLimit.allowed) {
      throw AppError.forbidden(
        "Too many attempts for this account",
        `এই অ্যাকাউন্টে একাধিক ভুল চেষ্টার কারণে লগইন সাময়িকভাবে স্থগিত। ${Math.ceil(
          phoneRateLimit.retryAfterSeconds / 60
        )} মিনিট পর চেষ্টা করুন।`
      );
    }

    // 3. Find User
    const user = await User.findOne({ phone: normalizedPhone }).select("+password");

    // Generic error message if user not found (prevents user enumeration)
    if (!user || !user.password) {
      throw AppError.unauthorized(
        "Invalid credentials",
        "প্রদত্ত মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।"
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw AppError.forbidden(
        "Account inactive",
        "আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
      );
    }

    // Check account lockout
    checkAccountLockout(user);

    // 4. Verify Password
    const isPasswordValid = await comparePassword(validatedData.password, user.password);

    if (!isPasswordValid) {
      await recordFailedLoginAttempt(user);
      throw AppError.unauthorized(
        "Invalid credentials",
        "প্রদত্ত মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।"
      );
    }

    // 5. Successful Login: Reset failed attempts & rate limits
    await recordSuccessfulLogin(user);
    resetRateLimit(`login:phone:${normalizedPhone}`);

    // Resolve linked Student or Teacher ID if applicable
    let studentId: string | undefined;
    let teacherId: string | undefined;

    if (user.role === "student") {
      let studentProfile = await Student.findOne({ userId: user._id }).select("_id");
      if (!studentProfile) {
        studentProfile = await Student.findOne({ phone: user.phone }).select("_id");
        if (studentProfile) {
          await Student.updateOne(
            { _id: studentProfile._id },
            { $set: { userId: user._id } }
          );
        }
      }
      if (studentProfile) {
        studentId = studentProfile._id.toString();
      }
    } else if (user.role === "teacher") {
      let teacherProfile = await Teacher.findOne({ userId: user._id }).select("_id");
      if (!teacherProfile) {
        teacherProfile = await Teacher.findOne({ phone: user.phone }).select("_id");
        if (teacherProfile) {
          await Teacher.updateOne(
            { _id: teacherProfile._id },
            { $set: { userId: user._id } }
          );
        }
      }
      if (teacherProfile) {
        teacherId = teacherProfile._id.toString();
      }
    }

    // 6. Sign JWT
    const token = signJwtToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      fullName: user.fullName,
      studentId,
      teacherId,
    });

    const csrfToken = generateCsrfToken();

    // 7. Safe Client Response
    const safeUserData = {
      id: user._id.toString(),
      phone: user.phone,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      studentId,
      teacherId,
    };

    const response = apiSuccess(
      { user: safeUserData, token, csrfToken },
      "লগইন সফল হয়েছে।"
    );

    // 8. Set HttpOnly auth_token and client-accessible csrf_token cookies
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      ...AUTH_COOKIE_OPTIONS,
    });

    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: csrfToken,
      ...CSRF_COOKIE_OPTIONS,
    });

    return response;
  },
  { requireDb: true }
);
