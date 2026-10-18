import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import {
  getAuthenticatedUser,
  requireRole,
  requireTeacherBatchAccess,
  verifyCsrfProtection,
} from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { Exam } from "@/models/Exam";
import { Batch } from "@/models/Batch";

const createExamSchema = z.object({
  batch: z.string().min(1, "ব্যাচ আইডি আবশ্যক"),
  subject: z.string().trim().min(1, "পরীক্ষার বিষয় আবশ্যক"),
  title: z.string().trim().min(2, "পরীক্ষার শিরোনাম দিন"),
  examDate: z.string().or(z.date()),
  maximumMarks: z.number().min(1, "পূর্ণমান কমপক্ষে ১ হতে হবে"),
  passMarks: z.number().min(0).optional(),
  examType: z.enum(["weekly", "monthly", "model_test", "term"]).default("weekly"),
  publicationStatus: z.enum(["draft", "published", "archived"]).default("draft"),
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
      "examDate",
      10
    );

    const batchId = searchParams.get("batch");
    const examType = searchParams.get("examType");
    const publicationStatus = searchParams.get("publicationStatus");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (batchId) filter.batch = batchId;
    if (examType) filter.examType = examType;

    // Students and guardians can ONLY see published exams
    if (session.role === "student" || session.role === "guardian") {
      filter.publicationStatus = "published";
    } else if (publicationStatus) {
      filter.publicationStatus = publicationStatus;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .populate("batch", "name code classLevel")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(exams, "পরীক্ষাসমূহের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);

    const body = await req.json();
    const validated = createExamSchema.parse(body);

    // Verify batch exists
    const batch = await Batch.findById(validated.batch);
    if (!batch) {
      throw AppError.notFound("Batch not found", "ব্যাচটি খুঁজে পাওয়া যায়নি।");
    }

    // Role verification: If teacher, verify assigned to this batch
    if (session.role === "teacher") {
      await requireTeacherBatchAccess(session, validated.batch);
    } else {
      requireRole(session, ["super_admin", "admin"]);
    }

    if (validated.passMarks && validated.passMarks > validated.maximumMarks) {
      throw AppError.badRequest(
        "Pass marks cannot exceed maximum marks",
        "পাস মার্ক পূর্ণমানের চেয়ে বেশি হতে পারে না।"
      );
    }

    const newExam = await Exam.create({
      batch: validated.batch,
      subject: validated.subject,
      title: validated.title,
      examDate: new Date(validated.examDate),
      maximumMarks: validated.maximumMarks,
      passMarks: validated.passMarks || Math.round(validated.maximumMarks * 0.4),
      examType: validated.examType,
      publicationStatus: validated.publicationStatus,
    });

    return apiCreated(newExam, "নতুন পরীক্ষার সময়সূচী সফলভাবে তৈরি করা হয়েছে।");
  },
  { requireDb: true }
);
