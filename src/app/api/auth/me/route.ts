import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/rbac";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const user = await User.findById(session.userId);

    if (!user) {
      throw AppError.notFound("User not found", "ব্যবহারকারী পাওয়া যায়নি।");
    }

    let profile: unknown = null;
    if (user.role === "student") {
      profile = await Student.findOne({ userId: user._id }).lean();
    } else if (user.role === "teacher") {
      profile = await Teacher.findOne({ userId: user._id }).lean();
    }

    const userData = {
      id: user._id.toString(),
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
      profile,
    };

    return apiSuccess(userData, "ব্যবহারকারীর সেশন তথ্য পাওয়া গেছে।");
  },
  { requireDb: true }
);

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "পূর্ণ নাম দিন").optional(),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  avatarUrl: z.string().optional(),
  biography: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে").optional(),
});

export const PUT = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const user = await User.findById(session.userId).select("+password");

    if (!user) {
      throw AppError.notFound("User not found", "ব্যবহারকারী পাওয়া যায়নি।");
    }

    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    if (validated.fullName) {
      user.fullName = validated.fullName;
    }
    if (validated.email !== undefined) {
      user.email = validated.email || undefined;
    }
    if (validated.avatarUrl !== undefined) {
      user.avatarUrl = validated.avatarUrl;
    }

    // Password change verification
    if (validated.newPassword) {
      if (!validated.currentPassword) {
        throw AppError.badRequest(
          "Current password required",
          "পাসওয়ার্ড পরিবর্তনের জন্য বর্তমান পাসওয়ার্ডটি প্রদান করুন।"
        );
      }

      const isMatch = await user.comparePassword(validated.currentPassword);
      if (!isMatch) {
        throw AppError.badRequest(
          "Incorrect current password",
          "বর্তমান পাসওয়ার্ডটি সঠিক নয়।"
        );
      }

      user.password = validated.newPassword;
      user.passwordChangedAt = new Date();
    }

    await user.save();

    // Also update role profile if applicable
    if (user.role === "teacher") {
      const teacherUpdate: Record<string, unknown> = {};
      if (validated.fullName) teacherUpdate.fullName = validated.fullName;
      if (validated.email !== undefined)
        teacherUpdate.email = validated.email || undefined;
      if (validated.avatarUrl !== undefined)
        teacherUpdate.avatarUrl = validated.avatarUrl;
      if (validated.biography !== undefined)
        teacherUpdate.biography = validated.biography;

      await Teacher.updateOne({ userId: user._id }, { $set: teacherUpdate });
    } else if (user.role === "student") {
      const studentUpdate: Record<string, unknown> = {};
      if (validated.fullName) studentUpdate.fullName = validated.fullName;
      if (validated.email !== undefined)
        studentUpdate.email = validated.email || undefined;
      if (validated.avatarUrl !== undefined)
        studentUpdate.avatarUrl = validated.avatarUrl;

      await Student.updateOne({ userId: user._id }, { $set: studentUpdate });
    }

    return apiSuccess(
      {
        id: user._id.toString(),
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      "প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে।"
    );
  },
  { requireDb: true }
);
