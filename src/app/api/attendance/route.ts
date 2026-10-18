import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import {
  getAuthenticatedUser,
  requireRole,
  requireStudentOwnership,
  requireTeacherBatchAccess,
  verifyCsrfProtection,
} from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { normalizeDateToStartOfDay } from "@/lib/db-utils";
import { Attendance } from "@/models/Attendance";
import { Student } from "@/models/Student";
import mongoose from "mongoose";

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(
      searchParams,
      "classDate",
      20
    );

    const batchId = searchParams.get("batch");
    const studentIdParam = searchParams.get("student");
    const status = searchParams.get("status");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const filter: Record<string, unknown> = {};

    // 1. Role and Access Control Checks
    if (session.role === "student") {
      const student = await Student.findOne({ userId: session.userId });
      if (!student) {
        throw AppError.notFound(
          "Student profile not found",
          "শিক্ষার্থীর প্রোফাইল পাওয়া যায়নি।"
        );
      }
      filter.student = student._id;
    } else if (session.role === "guardian") {
      if (!studentIdParam) {
        throw AppError.badRequest("Student ID required", "শিক্ষার্থীর আইডি প্রদান করুন।");
      }
      await requireStudentOwnership(session, studentIdParam);
      filter.student = studentIdParam;
    } else if (session.role === "teacher") {
      if (batchId) {
        await requireTeacherBatchAccess(session, batchId);
        filter.batch = batchId;
      }
      if (studentIdParam) {
        filter.student = studentIdParam;
      }
    } else {
      requireRole(session, ["super_admin", "admin", "staff"]);
      if (batchId) filter.batch = batchId;
      if (studentIdParam) filter.student = studentIdParam;
    }

    if (status) filter.status = status;

    if (startDateParam || endDateParam) {
      const dateFilter: Record<string, Date> = {};
      if (startDateParam) {
        dateFilter.$gte = normalizeDateToStartOfDay(startDateParam);
      }
      if (endDateParam) {
        const endDate = normalizeDateToStartOfDay(endDateParam);
        // Include full end day
        endDate.setDate(endDate.getDate() + 1);
        dateFilter.$lt = endDate;
      }
      filter.classDate = dateFilter;
    }

    const [attendanceList, total] = await Promise.all([
      Attendance.find(filter)
        .populate("student", "fullName studentId phone classLevel")
        .populate("batch", "name code classLevel")
        .populate("recordedBy", "fullName role")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ]);

    // Aggregate summary counts for present, absent, late, excused
    const summaryAgg = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const summary: Record<string, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total,
    };
    for (const item of summaryAgg) {
      if (item._id in summary) {
        summary[item._id] = item.count;
      }
    }

    // DOCUMENTED RULE:
    // Effective Attendance = Present + Late
    // Countable Classes = Present + Late + Absent (Excused leave does not penalize student's attendance percentage)
    // Attendance Percentage (%) = Countable Classes > 0 ? Math.round((Effective Attendance / Countable Classes) * 100) : 100
    const countableClasses = summary.present + summary.late + summary.absent;
    const effectiveAttendance = summary.present + summary.late;
    const attendancePercentage =
      countableClasses > 0
        ? Math.round((effectiveAttendance / countableClasses) * 100)
        : 100;

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(
      {
        records: attendanceList,
        summary: {
          ...summary,
          countableClasses,
          effectiveAttendance,
          attendancePercentage,
          calculationRule:
            "উপস্থিতির হার (%) = (উপস্থিত + বিলম্ব) / (মোট গণনাযোগ্য ক্লাস [উপস্থিত + বিলম্ব + অনুপস্থিত]) × ১০০",
        },
      },
      "হাজিরার তথ্য সফলভাবে পাওয়া গেছে।",
      meta
    );
  },
  { requireDb: true }
);

const updateSingleAttendanceSchema = z.object({
  attendanceId: z.string().min(1, "হাজিরা রেকর্ড আইডি আবশ্যক"),
  status: z.enum(["present", "absent", "late", "excused"]),
  remarks: z.string().optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);

    const body = await req.json();
    const validated = updateSingleAttendanceSchema.parse(body);

    const record = await Attendance.findById(validated.attendanceId);
    if (!record) {
      throw AppError.notFound(
        "Attendance record not found",
        "হাজিরা রেকর্ড পাওয়া যায়নি।"
      );
    }

    // Role check: If teacher, verify assigned to this batch
    if (session.role === "teacher") {
      await requireTeacherBatchAccess(session, String(record.batch));
    } else {
      requireRole(session, ["super_admin", "admin"]);
    }

    // Disallow modifying attendance of archived batches
    const { Batch } = await import("@/models/Batch");
    const batch = await Batch.findById(record.batch);
    if (batch?.status === "archived") {
      throw AppError.badRequest(
        "Batch is archived",
        "আর্কাইভকৃত ব্যাচের পূর্বের হাজিরা রেকর্ড সংশোধন করা যাবে না।"
      );
    }

    record.status = validated.status;
    if (validated.remarks !== undefined) {
      record.remarks = validated.remarks;
    }
    record.recordedBy = new mongoose.Types.ObjectId(session.userId);
    await record.save();

    return apiSuccess(record, "হাজিরার স্ট্যাটাস সফলভাবে সংশোধন করা হয়েছে।");
  },
  { requireDb: true }
);
