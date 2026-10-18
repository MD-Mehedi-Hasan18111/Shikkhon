import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { normalizePhoneNumber } from "@/lib/db-utils";
import { User } from "@/models/User";
import { AppError } from "@/lib/api-error";

const forgotPasswordSchema = z.object({
  phone: z.string().min(1, "মোবাইল নম্বর প্রদান করুন"),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const rateLimit = checkRateLimit(`forgot-pass:${clientIp}`, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      throw AppError.forbidden(
        "Too many requests",
        "অতিরিক্ত পাসওয়ার্ড রিকভারি অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।"
      );
    }

    const body = await req.json();
    const validated = forgotPasswordSchema.parse(body);
    const normalizedPhone = normalizePhoneNumber(validated.phone);

    // Look up user silently
    const user = await User.findOne({ phone: normalizedPhone, isActive: true });

    if (user) {
      // In production: send SMS OTP / verification code
      console.log(`[Auth Password Reset] Triggered reset for phone: ${normalizedPhone}`);
    }

    // Always return identical generic success message to prevent account enumeration
    return apiSuccess(
      { sent: true },
      "যদি এই নম্বরে কোনো সক্রিয় অ্যাকাউন্ট নিবন্ধিত থাকে, তবে পাসওয়ার্ড পরিবর্তনের তথ্য পাঠানো হয়েছে।"
    );
  },
  { requireDb: true }
);
