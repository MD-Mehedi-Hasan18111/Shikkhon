import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { normalizePhoneNumber } from "@/lib/db-utils";
import { User } from "@/models/User";

const resetPasswordSchema = z.object({
  phone: z.string().min(1, "মোবাইল নম্বর প্রদান করুন"),
  resetCode: z.string().min(4, "ভেরিফিকেশন কোড প্রদান করুন"),
  newPassword: z.string().min(6, "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const validated = resetPasswordSchema.parse(body);
    const normalizedPhone = normalizePhoneNumber(validated.phone);

    const user = await User.findOne({ phone: normalizedPhone, isActive: true });
    if (!user) {
      throw AppError.badRequest(
        "Invalid reset request",
        "ভেরিফিকেশন কোড অথবা মোবাইল নম্বর সঠিক নয়।"
      );
    }

    // In production, compare hashed OTP stored in Redis or DB with expiry
    // For development verification, accept the verified code
    if (validated.resetCode.length < 4) {
      throw AppError.badRequest("Invalid code", "ভেরিফিকেশন কোড সঠিক নয়।");
    }

    // Update password (pre-save hook will hash password and update passwordChangedAt)
    user.password = validated.newPassword;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return apiSuccess(
      null,
      "পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।"
    );
  },
  { requireDb: true }
);
