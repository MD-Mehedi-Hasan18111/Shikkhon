import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { Batch } from "@/models/Batch";
import { AcademicSession } from "@/models/AcademicSession";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Enrollment } from "@/models/Enrollment";

const timeFormatSchema = z.string().transform((val, ctx) => {
  const trimmed = val.trim();
  // 24-hour format: "16:00", "04:30"
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
    return trimmed;
  }
  // 12-hour format: "04:00 PM", "4:30 AM", "04:00PM", etc.
  const match = trimmed.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const p = match[3].toUpperCase();
    if (p === "PM" && h < 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m}`;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "সময় সঠিক ফরম্যাটে দিন (যেমন: 04:00 PM বা 16:00)",
  });
  return z.NEVER;
});

const scheduleItemSchema = z.object({
  day: z.enum([
    "saturday",
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]),
  startTime: timeFormatSchema,
  endTime: timeFormatSchema,
  roomNo: z.string().optional(),
});

const createBatchSchema = z.object({
  name: z.string().trim().min(2, "ব্যাচের নাম আবশ্যক"),
  code: z.string().trim().min(2, "ব্যাচ কোড দিন").toUpperCase(),
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
  academicSession: z.string().min(1, "শিক্ষাবর্ষ আইডি আবশ্যক"),
  assignedTeachers: z.array(z.string()).default([]),
  subjects: z.array(z.string().trim()).min(1, "কমপক্ষে একটি বিষয় উল্লেখ করুন"),
  schedule: z.array(scheduleItemSchema).default([]),
  roomOrOnlineDetails: z.string().optional(),
  capacity: z.number().int().min(1, "সর্বনিম্ন আসন ১টি হতে হবে").default(40),
  monthlyFee: z.number().min(0, "মাসিক ফি ঋণাত্মক হতে পারে না").default(0),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).default("active"),
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
      "createdAt",
      10
    );

    const academicSession = searchParams.get("academicSession");
    const classLevel = searchParams.get("classLevel");
    const status = searchParams.get("status");
    const teacherId = searchParams.get("teacherId");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (academicSession) filter.academicSession = academicSession;
    if (classLevel) filter.classLevel = classLevel;
    if (status) filter.status = status;

    // If logged-in user is a teacher, restrict to their assigned batches
    if (session.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: session.userId });
      if (teacher) {
        filter.assignedTeachers = teacher._id;
      } else {
        filter._id = { $in: [] };
      }
    } else if (session.role === "student") {
      const student = await Student.findOne({ userId: session.userId });
      if (student) {
        const enrollments = await Enrollment.find({
          student: student._id,
          status: "active",
        }).select("batch");
        const batchIds = enrollments.map((e) => e.batch);
        filter._id = { $in: batchIds };
      } else {
        filter._id = { $in: [] };
      }
    } else if (teacherId) {
      filter.assignedTeachers = teacherId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { subjects: { $regex: search, $options: "i" } },
      ];
    }

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate("academicSession", "name code isCurrent")
        .populate("assignedTeachers", "fullName teacherCode phone")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Batch.countDocuments(filter),
    ]);

    // Compute active enrollment counts and available seats for each batch
    const batchIds = batches.map((b) => b._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { batch: { $in: batchIds }, status: "active" } },
      { $group: { _id: "$batch", count: { $sum: 1 } } },
    ]);
    const countsMap = new Map<string, number>(
      enrollmentCounts.map((e) => [String(e._id), e.count])
    );

    const batchesWithCapacity = batches.map((b) => {
      const enrolledCount = countsMap.get(String(b._id)) || 0;
      const availableSeats = Math.max(0, b.capacity - enrolledCount);
      const isFull = enrolledCount >= b.capacity;
      return {
        ...b,
        enrolledCount,
        availableSeats,
        isFull,
      };
    });

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(batchesWithCapacity, "ব্যাচসমূহের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = createBatchSchema.parse(body);

    // Verify academic session exists
    const sessionDoc = await AcademicSession.findById(validated.academicSession);
    if (!sessionDoc) {
      throw AppError.notFound(
        "Academic session not found",
        "নির্বাচিত শিক্ষাবর্ষটি খুঁজে পাওয়া যায়নি।"
      );
    }

    // Check duplicate code
    const existing = await Batch.findOne({ code: validated.code });
    if (existing) {
      throw AppError.conflict(
        "Batch code already exists",
        `এই ব্যাচ কোডটি (${validated.code}) ইতিমধ্যে বিদ্যমান রয়েছে।`
      );
    }

    const newBatch = await Batch.create(validated);

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/classes");
      revalidatePath("/");
    } catch {
      // Ignore if revalidatePath fails in non-server action context
    }

    return apiCreated(newBatch, "নতুন ব্যাচ সফলভাবে খোলা হয়েছে।");
  },
  { requireDb: true }
);
