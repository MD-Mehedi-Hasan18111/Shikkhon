import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { Batch } from "@/models/Batch";

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(
      searchParams,
      "createdAt",
      20
    );

    const examId = searchParams.get("exam");
    const batchId = searchParams.get("batch");
    const studentIdParam = searchParams.get("student");

    const filter: Record<string, unknown> = {};

    if (session.role === "student") {
      const student = await Student.findOne({ userId: session.userId });
      if (!student) {
        throw AppError.notFound(
          "Student profile not found",
          "শিক্ষার্থীর প্রোফাইল পাওয়া যায়নি।"
        );
      }
      filter.student = student._id;

      // Only published exam results are visible to students
      const publishedExams = await Exam.find({ publicationStatus: "published" }).select(
        "_id"
      );
      filter.exam = { $in: publishedExams.map((e) => e._id) };
    } else if (session.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: session.userId });
      if (!teacher) {
        throw AppError.notFound(
          "Teacher profile not found",
          "শিক্ষক প্রোফাইল পাওয়া যায়নি।"
        );
      }
      // Find batches taught by this teacher
      const taughtBatches = await Batch.find({ assignedTeachers: teacher._id }).select(
        "_id"
      );
      const taughtExams = await Exam.find({
        batch: { $in: taughtBatches.map((b) => b._id) },
      }).select("_id");
      filter.exam = { $in: taughtExams.map((e) => e._id) };

      if (examId) filter.exam = examId;
      if (studentIdParam) filter.student = studentIdParam;
    } else {
      // Super Admin and Admin
      if (examId) filter.exam = examId;
      if (studentIdParam) filter.student = studentIdParam;
      if (batchId) {
        const batchExams = await Exam.find({ batch: batchId }).select("_id");
        filter.exam = { $in: batchExams.map((e) => e._id) };
      }
    }

    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate({
          path: "exam",
          select:
            "title subject maximumMarks passMarks examDate publicationStatus batch examType",
          populate: {
            path: "batch",
            select: "name code classLevel",
          },
        })
        .populate("student", "fullName studentId rollNumber phone")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(results, "ফলাফল তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);
