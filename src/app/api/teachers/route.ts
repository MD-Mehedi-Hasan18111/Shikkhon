import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import {
  normalizePhoneNumber,
  isValidBangladeshiPhone,
  normalizeEmail,
} from "@/lib/db-utils";
import { Teacher } from "@/models/Teacher";
import { User } from "@/models/User";
import { Student } from "@/models/Student";

const createTeacherSchema = z.object({
  fullName: z.string().trim().min(2, "শিক্ষকের নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
  phone: z
    .string()
    .trim()
    .refine((v) => isValidBangladeshiPhone(v), {
      message: "সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন",
    }),
  password: z
    .string()
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
    .optional()
    .default("123456"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  qualifications: z.array(z.string()).default([]),
  subjects: z.array(z.string().trim()).min(1, "কমপক্ষে একটি পাঠদানের বিষয় উল্লেখ করুন"),
  biography: z.string().optional(),
  joiningDate: z.string().optional(),
  avatarUrl: z.string().optional(),
  teacherCode: z.string().optional(),
});

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    requireRole(session, [
      "super_admin",
      "admin",
      "teacher",
      "student",
      "guardian",
      "staff",
    ]);

    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(
      searchParams,
      "fullName",
      10
    );

    const search = searchParams.get("search");
    const subject = searchParams.get("subject");
    const isActiveParam = searchParams.get("isActive");

    const filter: Record<string, unknown> = {};

    // Students and public/guardians can only view active teachers
    if (session.role === "student" || session.role === "guardian") {
      filter.isActive = true;
    } else if (
      isActiveParam !== null &&
      isActiveParam !== undefined &&
      isActiveParam !== ""
    ) {
      filter.isActive = isActiveParam === "true";
    }

    if (subject) {
      filter.subjects = { $in: [subject] };
    }

    if (search) {
      const normalizedSearch = normalizePhoneNumber(search);
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { teacherCode: { $regex: search, $options: "i" } },
        { phone: { $regex: normalizedSearch || search, $options: "i" } },
        { subjects: { $regex: search, $options: "i" } },
      ];
    }

    const [teachers, total] = await Promise.all([
      Teacher.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Teacher.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(teachers, "শিক্ষকদের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = createTeacherSchema.parse(body);

    const normalizedPhone = normalizePhoneNumber(validated.phone);

    // Auto-generate teacherCode if not provided
    let teacherCode = validated.teacherCode?.trim().toUpperCase();
    if (!teacherCode) {
      const count = await Teacher.countDocuments();
      teacherCode = `TCH-${String(count + 1).padStart(3, "0")}`;
    }

    // 1. Check duplicate teacherCode
    const existingTeacherCode = await Teacher.findOne({ teacherCode });
    if (existingTeacherCode) {
      throw AppError.conflict(
        "Teacher code already exists",
        `এই শিক্ষক কোড (${teacherCode}) ইতিমধ্যে ব্যবহৃত হয়েছে।`,
        { teacherCode: [`এই শিক্ষক কোড (${teacherCode}) ইতিমধ্যে ব্যবহৃত হয়েছে।`] }
      );
    }

    // 2. Strictly ensure the phone number is unique across all Users, Teachers, and Students
    const [existingUser, existingTeacher, existingStudent] = await Promise.all([
      User.findOne({ phone: normalizedPhone }),
      Teacher.findOne({ phone: normalizedPhone }),
      Student.findOne({ phone: normalizedPhone }),
    ]);

    if (existingUser || existingTeacher || existingStudent) {
      throw AppError.conflict(
        "Phone already registered",
        "এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য মোবাইল নম্বর ব্যবহার করুন।",
        { phone: ["এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য নম্বর ব্যবহার করুন।"] }
      );
    }

    // 3. Create fresh User account for the teacher
    const user = await User.create({
      phone: normalizedPhone,
      fullName: validated.fullName,
      password: validated.password || "123456",
      email: normalizeEmail(validated.email) || undefined,
      avatarUrl: validated.avatarUrl || undefined,
      role: "teacher",
      isActive: true,
    });

    const newTeacher = await Teacher.create({
      teacherCode,
      userId: user._id,
      fullName: validated.fullName,
      phone: normalizedPhone,
      email: normalizeEmail(validated.email),
      qualifications: validated.qualifications,
      subjects: validated.subjects,
      biography: validated.biography || "",
      joiningDate: validated.joiningDate ? new Date(validated.joiningDate) : new Date(),
      avatarUrl: validated.avatarUrl || "",
      isActive: true,
    });

    return apiCreated(newTeacher, "নতুন শিক্ষক সফলভাবে যুক্ত করা হয়েছে।");
  },
  { requireDb: true }
);
