import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import {
  getAuthenticatedUser,
  requireTeacherBatchAccess,
  verifyCsrfProtection,
} from "@/lib/rbac";
import { normalizeDateToStartOfDay } from "@/lib/db-utils";
import { Attendance } from "@/models/Attendance";
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const markAttendanceSchema = z.object({
  classDate: z.string().or(z.date()),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1, "শিক্ষার্থী আইডি আবশ্যক"),
        status: z.enum(["present", "absent", "late", "excused"]),
        remarks: z.string().optional(),
      })
    )
    .min(1, "কমপক্ষে একজন শিক্ষার্থীর হাজিরা রেকর্ড দিন"),
});

export const POST = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id: batchId } = await params;

    // 1. Authenticate User
    const session = await getAuthenticatedUser(req);

    // 2. Enforce Teacher Batch Access: Teacher can ONLY modify assigned batches!
    await requireTeacherBatchAccess(session, batchId);

    // Verify batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw AppError.notFound("Batch not found", "ব্যাচটি পাওয়া যায়নি।");
    }

    // Verify batch is not archived
    if (batch.status === "archived") {
      throw AppError.badRequest(
        "Batch is archived",
        "আর্কাইভকৃত ব্যাচে নতুন হাজিরা গ্রহণ করা যাবে না।"
      );
    }

    // 3. Validate Body
    const body = await req.json();
    const validated = markAttendanceSchema.parse(body);

    const normalizedDate = normalizeDateToStartOfDay(validated.classDate);

    // 4. Validate duplicate students in the submission payload
    const seenStudentIds = new Set<string>();
    for (const record of validated.records) {
      if (seenStudentIds.has(record.studentId)) {
        throw AppError.badRequest(
          "Duplicate student attendance in payload",
          "একই শিক্ষার্থীর একাধিক হাজিরা রেকর্ড সাবমিট করা যাবে না।"
        );
      }
      seenStudentIds.add(record.studentId);
    }

    // 5. Verify all students have active enrollments in this batch
    const activeEnrollments = await Enrollment.find({
      batch: batchId,
      status: "active",
    })
      .select("student")
      .lean();

    const activeStudentIdSet = new Set(
      activeEnrollments.map((enr) => String(enr.student))
    );

    for (const record of validated.records) {
      if (!activeStudentIdSet.has(record.studentId)) {
        throw AppError.badRequest(
          "Student is not actively enrolled in this batch",
          `শিক্ষার্থী (আইডি: ${record.studentId}) এই ব্যাচে সক্রিয়ভাবে ভর্তি নেই অথবা ভর্তি বাতিল হয়েছে।`
        );
      }
    }

    // 6. Upsert Attendance Records
    const savedRecords = [];
    for (const record of validated.records) {
      const attendanceDoc = await Attendance.findOneAndUpdate(
        {
          student: record.studentId,
          batch: batchId,
          classDate: normalizedDate,
        },
        {
          $set: {
            status: record.status,
            remarks: record.remarks || "",
            recordedBy: session.userId,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      savedRecords.push(attendanceDoc);
    }

    return apiCreated(
      { count: savedRecords.length, classDate: normalizedDate },
      "ক্লাসের ডিজিটাল হাজিরা সফলভাবে সংরক্ষিত হয়েছে।"
    );
  },
  { requireDb: true }
);

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id: batchId } = await params;

    const session = await getAuthenticatedUser(req);
    await requireTeacherBatchAccess(session, batchId);

    const searchParams = req.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    const query: Record<string, unknown> = { batch: batchId };
    if (dateParam) {
      query.classDate = normalizeDateToStartOfDay(dateParam);
    }

    const attendanceRecords = await Attendance.find(query)
      .populate("student", "studentId fullName phone")
      .populate("recordedBy", "fullName role")
      .sort({ classDate: -1 })
      .lean();

    return apiSuccess(attendanceRecords, "ব্যাচের হাজিরা তালিকা পাওয়া গেছে।");
  },
  { requireDb: true }
);
