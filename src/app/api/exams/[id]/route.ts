import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import {
  getAuthenticatedUser,
  requireRole,
  requireTeacherBatchAccess,
  verifyCsrfProtection,
} from "@/lib/rbac";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";

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

    const exam = await Exam.findById(id).populate("batch", "name code classLevel").lean();

    if (!exam) {
      throw AppError.notFound("Exam not found", "পরীক্ষার তথ্য পাওয়া যায়নি।");
    }

    // Students and guardians can only view published exams
    if (
      (session.role === "student" || session.role === "guardian") &&
      exam.publicationStatus !== "published"
    ) {
      throw AppError.forbidden(
        "Exam result is not published yet",
        "এই পরীক্ষার ফলাফল এখনও প্রকাশিত হয়নি।"
      );
    }

    // Aggregate summary statistics of this exam
    const results = await Result.find({ exam: id }).select("obtainedMarks").lean();
    const count = results.length;
    let highestMarks = 0;
    let totalMarks = 0;
    let passedCount = 0;

    for (const r of results) {
      if (r.obtainedMarks > highestMarks) highestMarks = r.obtainedMarks;
      totalMarks += r.obtainedMarks;
      if (exam.passMarks && r.obtainedMarks >= exam.passMarks) passedCount++;
    }

    const averageMarks = count > 0 ? +(totalMarks / count).toFixed(2) : 0;

    return apiSuccess(
      {
        exam,
        stats: {
          totalSubmissions: count,
          highestMarks,
          averageMarks,
          passedCount,
        },
      },
      "পরীক্ষার বিস্তারিত তথ্য পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);

const updateExamSchema = z.object({
  title: z.string().trim().min(2).optional(),
  subject: z.string().trim().min(1).optional(),
  examDate: z.string().or(z.date()).optional(),
  maximumMarks: z.number().min(1).optional(),
  passMarks: z.number().min(0).optional(),
  examType: z.enum(["weekly", "monthly", "model_test", "term"]).optional(),
  publicationStatus: z.enum(["draft", "published", "archived"]).optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    const exam = await Exam.findById(id);

    if (!exam) {
      throw AppError.notFound("Exam not found", "পরীক্ষা খুঁজে পাওয়া যায়নি।");
    }

    // Check teacher access to batch
    if (session.role === "teacher") {
      await requireTeacherBatchAccess(session, String(exam.batch));
    } else {
      requireRole(session, ["super_admin", "admin"]);
    }

    const body = await req.json();
    const validated = updateExamSchema.parse(body);

    if (validated.title !== undefined) exam.title = validated.title;
    if (validated.subject !== undefined) exam.subject = validated.subject;
    if (validated.examDate !== undefined) exam.examDate = new Date(validated.examDate);
    if (validated.maximumMarks !== undefined) exam.maximumMarks = validated.maximumMarks;
    if (validated.passMarks !== undefined) exam.passMarks = validated.passMarks;
    if (validated.examType !== undefined) exam.examType = validated.examType;

    // If changing publicationStatus to published, also publish linked results
    if (validated.publicationStatus !== undefined) {
      exam.publicationStatus = validated.publicationStatus;
      if (validated.publicationStatus === "published") {
        await Result.updateMany(
          { exam: id },
          { $set: { publicationStatus: "published" } }
        );
      } else if (validated.publicationStatus === "draft") {
        await Result.updateMany({ exam: id }, { $set: { publicationStatus: "draft" } });
      }
    }

    await exam.save();

    return apiSuccess(exam, "পরীক্ষার তথ্য সফলভাবে আপডেট করা হয়েছে।");
  },
  { requireDb: true }
);

export const DELETE = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const exam = await Exam.findById(id);
    if (!exam) {
      throw AppError.notFound("Exam not found", "পরীক্ষা পাওয়া যায়নি।");
    }

    // History preservation: archive instead of hard delete
    exam.publicationStatus = "archived";
    await exam.save();

    return apiSuccess(
      exam,
      "পরীক্ষাটি সফলভাবে আর্কাইভ করা হয়েছে (ফলাফল সংরক্ষিত থাকবে)।"
    );
  },
  { requireDb: true }
);
