import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import {
  normalizePhoneNumber,
  isValidBangladeshiPhone,
  normalizeEmail,
} from "@/lib/db-utils";
import { Teacher } from "@/models/Teacher";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Batch } from "@/models/Batch";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, [
      "super_admin",
      "admin",
      "teacher",
      "student",
      "guardian",
      "staff",
    ]);

    const teacher = await Teacher.findById(id).lean();
    if (!teacher) {
      throw AppError.notFound("Teacher not found", "শিক্ষকের তথ্য খুঁজে পাওয়া যায়নি।");
    }

    // Find batches assigned to this teacher
    const assignedBatches = await Batch.find({
      assignedTeachers: teacher._id,
      status: { $ne: "cancelled" },
    })
      .populate("academicSession", "name code")
      .select("name code classLevel schedule capacity status")
      .lean();

    return apiSuccess(
      { teacher, assignedBatches },
      "শিক্ষকের বিস্তারিত তথ্য পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);

const updateTeacherSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z
    .string()
    .trim()
    .refine((v) => isValidBangladeshiPhone(v), {
      message: "সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন",
    })
    .optional(),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে").optional(),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  qualifications: z.array(z.string()).optional(),
  subjects: z.array(z.string().trim()).min(1).optional(),
  biography: z.string().optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateTeacherSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    delete updateData.password;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      throw AppError.notFound("Teacher not found", "শিক্ষক রেকর্ডটি খুঁজে পাওয়া যায়নি।");
    }

    let normalizedPhone: string | undefined;
    if (validated.phone) {
      normalizedPhone = normalizePhoneNumber(validated.phone);
      if (normalizedPhone !== teacher.phone) {
        // Ensure new phone is unique across all Users, Teachers, and Students
        const [existingUser, existingTeacher, existingStudent] = await Promise.all([
          User.findOne({ phone: normalizedPhone, _id: { $ne: teacher.userId } }),
          Teacher.findOne({ phone: normalizedPhone, _id: { $ne: teacher._id } }),
          Student.findOne({ phone: normalizedPhone }),
        ]);

        if (existingUser || existingTeacher || existingStudent) {
          throw AppError.conflict(
            "Phone already registered",
            "এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য মোবাইল নম্বর ব্যবহার করুন।",
            { phone: ["এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য নম্বর ব্যবহার করুন।"] }
          );
        }
        updateData.phone = normalizedPhone;
      }
    }

    if (validated.email !== undefined) {
      updateData.email = normalizeEmail(validated.email);
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTeacher) {
      throw AppError.notFound("Teacher not found", "শিক্ষক রেকর্ডটি খুঁজে পাওয়া যায়নি।");
    }

    // Handle teacher user account, phone, avatar and password update
    if (updatedTeacher.userId) {
      const user = await User.findById(updatedTeacher.userId);
      if (user) {
        if (normalizedPhone && normalizedPhone !== user.phone) {
          user.phone = normalizedPhone;
        }
        if (validated.fullName) user.fullName = validated.fullName.trim();
        if (validated.password) user.password = validated.password;
        if (validated.avatarUrl) user.avatarUrl = validated.avatarUrl;
        if (validated.email !== undefined) user.email = normalizeEmail(validated.email) || undefined;
        if (validated.isActive !== undefined) {
          user.isActive = validated.isActive;
        }
        await user.save();
      }
    }

    return apiSuccess(updatedTeacher, "শিক্ষকের তথ্য সফলভাবে আপডেট করা হয়েছে।");
  },
  { requireDb: true }
);

export const DELETE = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    const forceDelete = req.nextUrl.searchParams.get("force") === "true";

    if (forceDelete) {
      requireRole(session, ["super_admin"]);
    } else {
      requireRole(session, ["super_admin", "admin"]);
    }
    const teacher = await Teacher.findById(id);

    if (!teacher) {
      throw AppError.notFound("Teacher not found", "শিক্ষক তথ্য পাওয়া যায়নি।");
    }

    if (!forceDelete) {
      // Soft deactivation to preserve historical records in past batches
      teacher.isActive = false;
      await teacher.save();
      if (teacher.userId) {
        await User.findByIdAndUpdate(teacher.userId, { isActive: false });
      }

      return apiSuccess(
        teacher,
        "শিক্ষকের অ্যাকাউন্ট সফলভাবে নিষ্ক্রিয় করা হয়েছে (অ্যাকাডেমিক ইতিহাস অক্ষুণ্ণ রয়েছে)।"
      );
    }

    // Force hard deletion if explicitly instructed
    await Teacher.findByIdAndDelete(id);
    return apiSuccess(null, "শিক্ষকের প্রোফাইল স্থায়ীভাবে মুছে ফেলা হয়েছে।");
  },
  { requireDb: true }
);
