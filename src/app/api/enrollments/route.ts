import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import {
  parsePaginationParams,
  buildPaginationMeta,
  runWithTransaction,
} from "@/lib/api-query-utils";
import { Enrollment } from "@/models/Enrollment";
import { Batch } from "@/models/Batch";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";

const enrollStudentSchema = z.object({
  student: z.string().min(1, "শিক্ষার্থী আইডি আবশ্যক"),
  batch: z.string().min(1, "ব্যাচ আইডি আবশ্যক"),
  rollNumber: z.string().optional(),
  feeDiscountPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
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

    const batchId = searchParams.get("batch");
    const studentId = searchParams.get("student");
    const sessionId = searchParams.get("academicSession");
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    if (batchId) filter.batch = batchId;
    if (sessionId) filter.academicSession = sessionId;
    if (status) filter.status = status;

    // Student role restriction: Students can only view their own enrollments
    if (session.role === "student") {
      const student = await Student.findOne({ userId: session.userId });
      if (!student) {
        throw AppError.notFound(
          "Student profile not found",
          "শিক্ষার্থীর প্রোফাইল খুঁজে পাওয়া যায়নি।"
        );
      }
      filter.student = student._id;
    } else if (session.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: session.userId });
      if (!teacher) {
        throw AppError.notFound(
          "Teacher profile not found",
          "শিক্ষক প্রোফাইল পাওয়া যায়নি।"
        );
      }
      const taughtBatches = await Batch.find({ assignedTeachers: teacher._id }).select(
        "_id"
      );
      const taughtBatchIds = taughtBatches.map((b) => b._id);
      if (batchId) {
        if (!taughtBatchIds.some((id) => id.toString() === batchId)) {
          throw AppError.forbidden("Not assigned batch", "আপনি এই ব্যাচের শিক্ষক নন।");
        }
        filter.batch = batchId;
      } else {
        filter.batch = { $in: taughtBatchIds };
      }
      if (studentId) filter.student = studentId;
    } else if (studentId) {
      filter.student = studentId;
    }

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate("student", "fullName studentId phone institutionName classLevel")
        .populate("batch", "name code classLevel capacity monthlyFee")
        .populate("academicSession", "name code isCurrent")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(enrollments, "ভর্তি রেকর্ডের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = enrollStudentSchema.parse(body);

    // 1. Verify Student exists and is active
    const student = await Student.findById(validated.student);
    if (!student) {
      throw AppError.notFound("Student not found", "শিক্ষার্থী খুঁজে পাওয়া যায়নি।");
    }
    if (student.status !== "active") {
      throw AppError.badRequest(
        "Student is not active",
        "শিক্ষার্থীর স্ট্যাটাস সক্রিয় নয়। শুধুমাত্র সক্রিয় শিক্ষার্থীকে ব্যাচে ভর্তি করানো যাবে।"
      );
    }

    // 2. Verify Batch exists and is active/upcoming
    const batch = await Batch.findById(validated.batch);
    if (!batch) {
      throw AppError.notFound("Batch not found", "ব্যাচ খুঁজে পাওয়া যায়নি।");
    }
    if (batch.status === "completed" || batch.status === "cancelled") {
      throw AppError.badRequest(
        "Batch is not accepting admissions",
        "এই ব্যাচটির কার্যক্রম সমাপ্ত বা বাতিল হয়েছে। নতুন শিক্ষার্থী ভর্তি সম্ভব নয়।"
      );
    }

    // 3. Prevent duplicate active enrollment in the same batch & session
    const existingEnrollment = await Enrollment.findOne({
      student: student._id,
      batch: batch._id,
      academicSession: batch.academicSession,
      status: "active",
    });

    if (existingEnrollment) {
      throw AppError.conflict(
        "Student already enrolled in this batch",
        "এই শিক্ষার্থী ইতিমধ্যে এই ব্যাচে সক্রিয়ভাবে ভর্তি রয়েছে।"
      );
    }

    // 4. Atomic capacity check and enrollment creation
    const newEnrollment = await runWithTransaction(async (dbSession) => {
      // Check batch capacity inside transaction
      const activeCount = await Enrollment.countDocuments(
        { batch: batch._id, status: "active" },
        { session: dbSession }
      );

      if (activeCount >= batch.capacity) {
        throw AppError.badRequest(
          "Batch capacity full",
          `ব্যাচের সর্বোচ্চ আসন সংখ্যা (${batch.capacity}) পূর্ণ হয়ে গেছে। আসন খালি না হওয়া পর্যন্ত নতুন শিক্ষার্থী ভর্তি সম্ভব নয়।`
        );
      }

      const [created] = await Enrollment.create(
        [
          {
            student: student._id,
            batch: batch._id,
            academicSession: batch.academicSession,
            enrollmentDate: new Date(),
            rollNumber: validated.rollNumber || String(activeCount + 1),
            feeDiscountPercent: validated.feeDiscountPercent,
            status: "active",
            notes: validated.notes || "",
          },
        ],
        { session: dbSession }
      );

      return created;
    });

    return apiCreated(newEnrollment, "শিক্ষার্থীকে সফলভাবে ব্যাচে ভর্তি করা হয়েছে।");
  },
  { requireDb: true }
);
