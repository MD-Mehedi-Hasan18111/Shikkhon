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
import { Enrollment } from "@/models/Enrollment";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);

    const enrollment = await Enrollment.findById(id)
      .populate("student", "fullName studentId phone institutionName classLevel")
      .populate("batch", "name code classLevel schedule monthlyFee")
      .populate("academicSession", "name code isCurrent")
      .lean();

    if (!enrollment) {
      throw AppError.notFound(
        "Enrollment not found",
        "ভর্তি সংক্রান্ত রেকর্ড পাওয়া যায়নি।"
      );
    }

    // Role check / Ownership check
    if (session.role === "student" || session.role === "guardian") {
      const studentId =
        typeof enrollment.student === "object" && "_id" in enrollment.student
          ? String(enrollment.student._id)
          : String(enrollment.student);
      await requireStudentOwnership(session, studentId);
    } else {
      requireRole(session, ["super_admin", "admin", "teacher", "staff"]);
    }

    return apiSuccess(enrollment, "ভর্তি রেকর্ডের বিস্তারিত তথ্য পাওয়া গেছে।");
  },
  { requireDb: true }
);

const updateEnrollmentSchema = z.object({
  rollNumber: z.string().optional(),
  feeDiscountPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "completed", "cancelled", "transferred"]).optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateEnrollmentSchema.parse(body);

    const enrollment = await Enrollment.findByIdAndUpdate(
      id,
      { $set: validated },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      throw AppError.notFound(
        "Enrollment not found",
        "ভর্তি সংক্রান্ত রেকর্ড পাওয়া যায়নি।"
      );
    }

    return apiSuccess(enrollment, "ভর্তি সংক্রান্ত তথ্য সফলভাবে আপডেট করা হয়েছে।");
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

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      throw AppError.notFound(
        "Enrollment not found",
        "ভর্তি সংক্রান্ত রেকর্ড পাওয়া যায়নি।"
      );
    }

    // History preservation: mark as cancelled rather than deleting record
    enrollment.status = "cancelled";
    await enrollment.save();

    return apiSuccess(
      enrollment,
      "শিক্ষার্থীর ভর্তি সফলভাবে প্রত্যাহার ও বাতিল করা হয়েছে (ইতিহাস সংরক্ষিত রয়েছে)।"
    );
  },
  { requireDb: true }
);
