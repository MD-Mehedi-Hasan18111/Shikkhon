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
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";

import { calculateGradeAndGpa } from "@/config/grading-scale";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);

    const result = await Result.findById(id)
      .populate(
        "exam",
        "title subject maximumMarks passMarks examDate publicationStatus batch"
      )
      .populate("student", "fullName studentId phone")
      .lean();

    if (!result) {
      throw AppError.notFound("Result not found", "ফলাফল পাওয়া যায়নি।");
    }

    // If student/guardian, verify ownership & published status
    if (session.role === "student" || session.role === "guardian") {
      const studentId =
        typeof result.student === "object" && "_id" in result.student
          ? String(result.student._id)
          : String(result.student);
      await requireStudentOwnership(session, studentId);

      const examDoc = result.exam as { publicationStatus?: string } | null;
      if (examDoc && examDoc.publicationStatus !== "published") {
        throw AppError.forbidden("Result not published", "ফলাফলটি এখনও প্রকাশিত হয়নি।");
      }
    } else {
      requireRole(session, ["super_admin", "admin", "teacher", "staff"]);
    }

    return apiSuccess(result, "ফলাফল পাওয়া গেছে।");
  },
  { requireDb: true }
);

const updateResultSchema = z.object({
  obtainedMarks: z.number().min(0, "প্রাপ্ত নম্বর ০ এর নিচে হতে পারে না").optional(),
  feedback: z.string().optional(),
  publicationStatus: z.enum(["draft", "published"]).optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);

    const result = await Result.findById(id);
    if (!result) {
      throw AppError.notFound("Result not found", "ফলাফল পাওয়া যায়নি।");
    }

    const exam = await Exam.findById(result.exam);
    if (!exam) {
      throw AppError.notFound("Exam not found", "সংশ্লিষ্ট পরীক্ষা পাওয়া যায়নি।");
    }

    // Role check: If teacher, verify assigned to batch
    if (session.role === "teacher") {
      await requireTeacherBatchAccess(session, String(exam.batch));
    } else {
      requireRole(session, ["super_admin", "admin"]);
    }

    const body = await req.json();
    const validated = updateResultSchema.parse(body);

    if (validated.obtainedMarks !== undefined) {
      if (validated.obtainedMarks > exam.maximumMarks) {
        throw AppError.badRequest(
          "Marks exceed maximum marks",
          `প্রাপ্ত নম্বর (${validated.obtainedMarks}) পরীক্ষার পূর্ণমানের (${exam.maximumMarks}) চেয়ে বেশি হতে পারে না।`
        );
      }
      result.obtainedMarks = validated.obtainedMarks;
      result.grade = calculateGradeAndGpa(
        validated.obtainedMarks,
        exam.maximumMarks
      ).grade;
    }

    if (validated.feedback !== undefined) {
      result.feedback = validated.feedback;
    }

    if (validated.publicationStatus !== undefined) {
      result.publicationStatus = validated.publicationStatus;
    }

    await result.save();

    return apiSuccess(result, "ফলাফল সফলভাবে সংশোধন করা হয়েছে।");
  },
  { requireDb: true }
);
