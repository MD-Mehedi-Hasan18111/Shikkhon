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
import { Student } from "@/models/Student";
import { User } from "@/models/User";

const createStudentSchema = z.object({
  fullName: z.string().trim().min(2, "পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
  phone: z
    .string()
    .trim()
    .refine((v) => isValidBangladeshiPhone(v), {
      message: "সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: ০১৭১১XXXXXX)",
    }),
  password: z
    .string()
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
    .optional()
    .default("123456"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  institutionName: z.string().trim().min(2, "প্রতিষ্ঠান/স্কুল/কলেজের নাম দিন"),
  classLevel: z.enum([
    "class_6",
    "class_7",
    "class_8",
    "class_9",
    "class_10",
    "hsc_1st",
    "hsc_2nd",
    "alim_1st",
    "alim_2nd",
    "admission",
  ]),
  academicGroup: z
    .enum(["science", "humanities", "business_studies", "general"])
    .default("general"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).default("male"),
  guardian: z.object({
    name: z.string().trim().min(2, "অভিভাবকের নাম দিন"),
    phone: z
      .string()
      .trim()
      .refine((v) => isValidBangladeshiPhone(v), {
        message: "অভিভাবকের সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন",
      }),
    relation: z.string().default("পিতা"),
    occupation: z.string().optional(),
  }),
  address: z.object({
    present: z.string().trim().min(2, "বর্তমান ঠিকানা দিন"),
    permanent: z.string().optional(),
  }),
  studentId: z.string().optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin", "teacher"]);

    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(searchParams);

    const search = searchParams.get("search");
    const classLevel = searchParams.get("classLevel");
    const academicGroup = searchParams.get("academicGroup");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    if (classLevel) filter.classLevel = classLevel;
    if (academicGroup) filter.academicGroup = academicGroup;
    if (status) filter.status = status;

    if (search) {
      const normalizedSearch = normalizePhoneNumber(search);
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { phone: { $regex: normalizedSearch || search, $options: "i" } },
        { institutionName: { $regex: search, $options: "i" } },
        { "guardian.phone": { $regex: normalizedSearch || search, $options: "i" } },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(students, "শিক্ষার্থীদের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = createStudentSchema.parse(body);

    const normalizedPhone = normalizePhoneNumber(validated.phone);
    const normalizedGuardianPhone = normalizePhoneNumber(validated.guardian.phone);

    // Auto-generate studentId if not provided
    let studentId = validated.studentId?.trim().toUpperCase();
    if (!studentId) {
      const year = new Date().getFullYear();
      const count = await Student.countDocuments();
      studentId = `S-${year}-${String(count + 1).padStart(4, "0")}`;
    }

    // Check duplicate studentId
    const existingStudentId = await Student.findOne({ studentId });
    if (existingStudentId) {
      throw AppError.conflict(
        "Student ID already exists",
        `এই শিক্ষার্থী আইডি (${studentId}) ইতিমধ্যে নিবন্ধিত রয়েছে।`
      );
    }

    // Create or link User account for student dashboard access
    let user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      user = await User.create({
        phone: normalizedPhone,
        fullName: validated.fullName,
        password: validated.password || "123456",
        email: normalizeEmail(validated.email) || undefined,
        role: "student",
        avatarUrl: validated.avatarUrl || undefined,
        isActive: true,
      });
    } else {
      if (validated.password) {
        user.password = validated.password;
      }
      if (validated.avatarUrl) {
        user.avatarUrl = validated.avatarUrl;
      }
      await user.save();
    }

    const newStudent = await Student.create({
      studentId,
      userId: user._id,
      fullName: validated.fullName,
      phone: normalizedPhone,
      email: normalizeEmail(validated.email),
      avatarUrl: validated.avatarUrl || "",
      institutionName: validated.institutionName,
      classLevel: validated.classLevel,
      academicGroup: validated.academicGroup,
      bloodGroup: validated.bloodGroup,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
      gender: validated.gender,
      guardian: {
        ...validated.guardian,
        phone: normalizedGuardianPhone,
      },
      address: validated.address,
      status: "active",
      notes: validated.notes,
    });

    return apiCreated(newStudent, "নতুন শিক্ষার্থী সফলভাবে ভর্তি ও নিবন্ধিত হয়েছে।");
  },
  { requireDb: true }
);
