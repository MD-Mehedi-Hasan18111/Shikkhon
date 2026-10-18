import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import {
  getAuthenticatedUser,
  requireRole,
  requireTeacherBatchAccess,
  requireStudentOwnership,
  verifyCsrfProtection,
} from "@/lib/rbac";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { Student } from "@/models/Student";
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { calculateGradeAndGpa } from "@/config/grading-scale";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id: examId } = await params;

    const session = await getAuthenticatedUser(req);

    const exam = await Exam.findById(examId).lean();
    if (!exam) {
      throw AppError.notFound("Exam not found", "পরীক্ষাটি খুঁজে পাওয়া যায়নি।");
    }

    // Role handling
    if (session.role === "student" || session.role === "guardian") {
      if (exam.publicationStatus !== "published") {
        throw AppError.forbidden(
          "Results not yet published",
          "এই পরীক্ষার ফলাফল এখনও প্রকাশ করা হয়নি।"
        );
      }

      let studentId: string | undefined;
      if (session.role === "student") {
        const student = await Student.findOne({ userId: session.userId });
        if (!student) {
          throw AppError.notFound(
            "Student profile not found",
            "শিক্ষার্থীর প্রোফাইল পাওয়া যায়নি।"
          );
        }
        studentId = String(student._id);
      } else {
        // Guardian provides studentId query
        const qStudentId = req.nextUrl.searchParams.get("studentId");
        if (!qStudentId) {
          throw AppError.badRequest("Student ID required", "শিক্ষার্থীর আইডি দিন।");
        }
        await requireStudentOwnership(session, qStudentId);
        studentId = qStudentId;
      }

      // Fetch student's specific result and calculate merit rank
      const allPublished = await Result.find({
        exam: examId,
        publicationStatus: "published",
      })
        .sort({ obtainedMarks: -1 })
        .select("student obtainedMarks highestMarksInBatch grade feedback")
        .lean();

      const rank = allPublished.findIndex((r) => String(r.student) === studentId) + 1;
      const myResult = allPublished.find((r) => String(r.student) === studentId);

      if (!myResult) {
        throw AppError.notFound(
          "Result not found",
          "এই পরীক্ষায় আপনার কোনো ফলাফল পাওয়া যায়নি।"
        );
      }

      return apiSuccess(
        {
          examTitle: exam.title,
          subject: exam.subject,
          maximumMarks: exam.maximumMarks,
          result: myResult,
          meritRank: rank > 0 ? rank : null,
          totalParticipants: allPublished.length,
        },
        "ফলাফল পাওয়া গেছে।"
      );
    }

    // Teachers, Admins, Staff:
    if (session.role === "teacher") {
      await requireTeacherBatchAccess(session, String(exam.batch));
    } else {
      requireRole(session, ["super_admin", "admin", "staff"]);
    }

    // Return full merit list sorted by obtainedMarks desc
    const results = await Result.find({ exam: examId })
      .populate("student", "fullName studentId phone institutionName classLevel")
      .sort({ obtainedMarks: -1 })
      .lean();

    return apiSuccess(
      { exam, results, totalResults: results.length },
      "পরীক্ষার সম্পূর্ণ মেধা তালিকা ও ফলাফল পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);

const bulkMarksSchema = z.object({
  marks: z
    .array(
      z.object({
        studentId: z.string().min(1, "শিক্ষার্থী আইডি আবশ্যক"),
        obtainedMarks: z.number().min(0, "প্রাপ্ত নম্বর ০ এর নিচে হতে পারে না"),
        feedback: z.string().optional(),
      })
    )
    .min(1, "কমপক্ষে একজন শিক্ষার্থীর নম্বর দিন"),
  publishImmediately: z.boolean().default(false),
});

export const POST = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id: examId } = await params;

    const session = await getAuthenticatedUser(req);
    const exam = await Exam.findById(examId);

    if (!exam) {
      throw AppError.notFound("Exam not found", "পরীক্ষাটি খুঁজে পাওয়া যায়নি।");
    }

    // Check if batch is archived
    const batch = await Batch.findById(exam.batch);
    if (!batch) {
      throw AppError.notFound("Batch not found", "পরীক্ষার ব্যাচ পাওয়া যায়নি।");
    }
    if (batch.status === "archived") {
      throw AppError.badRequest(
        "Batch is archived",
        "আর্কাইভকৃত ব্যাচের পরীক্ষার ফলাফল সংরক্ষণ বা পরিবর্তন করা যাবে না।"
      );
    }

    if (session.role === "teacher") {
      await requireTeacherBatchAccess(session, String(exam.batch));
    } else {
      requireRole(session, ["super_admin", "admin"]);
    }

    const body = await req.json();
    const validated = bulkMarksSchema.parse(body);

    // 1. Validate marks limits (0 <= marks <= maximumMarks)
    for (const item of validated.marks) {
      if (item.obtainedMarks > exam.maximumMarks) {
        throw AppError.badRequest(
          "Marks exceed maximum limit",
          `প্রাপ্ত নম্বর (${item.obtainedMarks}) পরীক্ষার পূর্ণমানের (${exam.maximumMarks}) চেয়ে বেশি হতে পারে না।`
        );
      }
      if (item.obtainedMarks < 0) {
        throw AppError.badRequest(
          "Marks cannot be negative",
          "প্রাপ্ত নম্বর ০ এর নিচে হতে পারে না।"
        );
      }
    }

    // 2. Validate duplicate student in payload
    const seenStudentIds = new Set<string>();
    for (const item of validated.marks) {
      if (seenStudentIds.has(item.studentId)) {
        throw AppError.badRequest(
          "Duplicate student in marks payload",
          "একই শিক্ষার্থীর নম্বর একাধিকবার প্রদান করা যাবে না।"
        );
      }
      seenStudentIds.add(item.studentId);
    }

    // 3. Verify students are actively enrolled in this batch
    const activeEnrollments = await Enrollment.find({
      batch: exam.batch,
      status: "active",
    })
      .select("student")
      .lean();

    const activeStudentIdSet = new Set(
      activeEnrollments.map((enr) => String(enr.student))
    );

    for (const item of validated.marks) {
      if (!activeStudentIdSet.has(item.studentId)) {
        throw AppError.badRequest(
          "Student is not actively enrolled in this batch",
          `শিক্ষার্থী (আইডি: ${item.studentId}) এই ব্যাচে সক্রিয়ভাবে ভর্তি নেই বা ভর্তি বাতিল হয়েছে।`
        );
      }
    }

    // Compute batch highest marks among existing and incoming
    const existingResults = await Result.find({ exam: examId })
      .select("obtainedMarks student")
      .lean();
    let currentHighest = 0;
    const incomingStudentMap = new Map<string, number>();

    for (const item of validated.marks) {
      incomingStudentMap.set(item.studentId, item.obtainedMarks);
      if (item.obtainedMarks > currentHighest) currentHighest = item.obtainedMarks;
    }

    for (const ex of existingResults) {
      if (!incomingStudentMap.has(String(ex.student))) {
        if (ex.obtainedMarks > currentHighest) currentHighest = ex.obtainedMarks;
      }
    }

    const publicationStatus = validated.publishImmediately
      ? "published"
      : exam.publicationStatus;

    // Upsert marks
    const savedResults = [];
    for (const item of validated.marks) {
      const { grade } = calculateGradeAndGpa(item.obtainedMarks, exam.maximumMarks);
      const doc = await Result.findOneAndUpdate(
        { exam: examId, student: item.studentId },
        {
          $set: {
            obtainedMarks: item.obtainedMarks,
            highestMarksInBatch: currentHighest,
            grade,
            feedback: item.feedback || "",
            publicationStatus,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      savedResults.push(doc);
    }

    // Update highestMarksInBatch across all existing results for consistency
    await Result.updateMany(
      { exam: examId },
      { $set: { highestMarksInBatch: currentHighest } }
    );

    if (validated.publishImmediately && exam.publicationStatus !== "published") {
      exam.publicationStatus = "published";
      await exam.save();
    }

    return apiCreated(
      {
        totalSaved: savedResults.length,
        highestMarks: currentHighest,
        isPublished: exam.publicationStatus === "published",
      },
      "পরীক্ষার নম্বর সফলভাবে ইনপুট ও সংরক্ষণ করা হয়েছে।"
    );
  },
  { requireDb: true }
);
