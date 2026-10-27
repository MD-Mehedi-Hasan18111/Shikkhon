import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import {
  getAuthenticatedUser,
  requireRole,
  requireStudentOwnership,
  verifyCsrfProtection,
} from "@/lib/rbac";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { Teacher } from "@/models/Teacher";
import { Enrollment } from "@/models/Enrollment";
import { Attendance } from "@/models/Attendance";
import { Result } from "@/models/Result";
import { normalizePhoneNumber, normalizeEmail } from "@/lib/db-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    await requireStudentOwnership(session, id);

    const student = await Student.findById(id).lean();
    if (!student) {
      throw AppError.notFound(
        "Student not found",
        "শিক্ষার্থীর রেকর্ডটি খুঁজে পাওয়া যায়নি।"
      );
    }

    const [enrollments, attendanceStats, recentResults] = await Promise.all([
      Enrollment.find({ student: id })
        .populate("batch", "name code classLevel monthlyFee")
        .populate("academicSession", "name code")
        .lean(),
      Attendance.aggregate([
        { $match: { student: student._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Result.find({ student: id })
        .populate("exam", "title subject maximumMarks examDate")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return apiSuccess(
      { student, enrollments, attendanceStats, recentResults },
      "শিক্ষার্থীর বিস্তারিত তথ্য পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);

const updateStudentSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে").optional(),
  email: z.string().optional(),
  institutionName: z.string().optional(),
  classLevel: z
    .enum([
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
    ])
    .optional(),
  academicGroup: z
    .enum(["science", "humanities", "business_studies", "general"])
    .optional(),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  guardian: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relation: z.string().optional(),
      occupation: z.string().optional(),
    })
    .optional(),
  address: z
    .object({
      present: z.string().optional(),
      permanent: z.string().optional(),
    })
    .optional(),
  status: z.enum(["active", "inactive", "graduated", "suspended"]).optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateStudentSchema.parse(body);

    const student = await Student.findById(id);
    if (!student) {
      throw AppError.notFound(
        "Student not found",
        "শিক্ষার্থী রেকর্ড খুঁজে পাওয়া যায়নি।"
      );
    }

    const updatePayload: Record<string, unknown> = { ...validated };
    delete updatePayload.password;

    let normalizedPhone: string | undefined;
    if (validated.phone) {
      normalizedPhone = normalizePhoneNumber(validated.phone);
      if (normalizedPhone !== student.phone) {
        // Ensure new phone is unique across all Users, Students, and Teachers
        const [existingUser, existingStudent, existingTeacher] = await Promise.all([
          User.findOne({ phone: normalizedPhone, _id: { $ne: student.userId } }),
          Student.findOne({ phone: normalizedPhone, _id: { $ne: student._id } }),
          Teacher.findOne({ phone: normalizedPhone }),
        ]);

        if (existingUser || existingStudent || existingTeacher) {
          throw AppError.conflict(
            "Phone already registered",
            "এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য মোবাইল নম্বর ব্যবহার করুন।",
            { phone: ["এই মোবাইল নম্বরটি দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে অন্য নম্বর ব্যবহার করুন।"] }
          );
        }
        updatePayload.phone = normalizedPhone;
      }
    }

    if (validated.email !== undefined) {
      updatePayload.email = normalizeEmail(validated.email);
    }

    if (validated.guardian?.phone) {
      updatePayload.guardian = {
        ...student.guardian,
        ...validated.guardian,
        phone: normalizePhoneNumber(validated.guardian.phone),
      };
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw AppError.notFound(
        "Student not found",
        "শিক্ষার্থী রেকর্ড খুঁজে পাওয়া যায়নি।"
      );
    }

    // Handle student user account, phone, avatar and password update
    if (updatedStudent.userId) {
      const user = await User.findById(updatedStudent.userId);
      if (user) {
        if (normalizedPhone && normalizedPhone !== user.phone) {
          user.phone = normalizedPhone;
        }
        if (validated.fullName) user.fullName = validated.fullName.trim();
        if (validated.password) user.password = validated.password;
        if (validated.avatarUrl) user.avatarUrl = validated.avatarUrl;
        if (validated.status) {
          user.isActive = validated.status === "active";
        }
        await user.save();
      }
    }

    return apiSuccess(updatedStudent, "শিক্ষার্থীর তথ্য সফলভাবে আপডেট করা হয়েছে।");
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
    const student = await Student.findById(id);

    if (!student) {
      throw AppError.notFound("Student not found", "শিক্ষার্থী পাওয়া যায়নি।");
    }

    if (!forceDelete) {
      // Academic history preservation: deactivate rather than hard delete
      student.status = "inactive";
      await student.save();
      if (student.userId) {
        await User.findByIdAndUpdate(student.userId, { isActive: false });
      }
      return apiSuccess(
        student,
        "শিক্ষার্থীর রেকর্ডটি সফলভাবে নিষ্ক্রিয় ও আর্কাইভ করা হয়েছে (অ্যাকাডেমিক ইতিহাস সংরক্ষিত রয়েছে)।"
      );
    }

    // Force hard deletion if explicitly instructed
    await Promise.all([
      Student.findByIdAndDelete(id),
      Enrollment.deleteMany({ student: id }),
      Attendance.deleteMany({ student: id }),
      Result.deleteMany({ student: id }),
    ]);

    return apiSuccess(
      null,
      "শিক্ষার্থীর রেকর্ড ও সংশ্লিষ্ট ডেটা স্থায়ীভাবে মুছে ফেলা হয়েছে।"
    );
  },
  { requireDb: true }
);
