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
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { Student } from "@/models/Student";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "সময় HH:MM ফরম্যাটে দিন (যেমন: 16:00)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "সময় HH:MM ফরম্যাটে দিন (যেমন: 17:30)"),
  roomNo: z.string().optional(),
});

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    // If teacher, verify assigned batch access
    if (session.role === "teacher") {
      await requireTeacherBatchAccess(session, id);
    } else if (session.role === "student") {
      const student = await Student.findOne({ userId: session.userId });
      if (!student) {
        throw AppError.notFound(
          "Student profile not found",
          "শিক্ষার্থীর প্রোফাইল পাওয়া যায়নি।"
        );
      }
      const isEnrolled = await Enrollment.findOne({
        student: student._id,
        batch: id,
        status: "active",
      });
      if (!isEnrolled) {
        throw AppError.forbidden(
          "Not enrolled in batch",
          "আপনি এই ব্যাচে অন্তর্ভুক্ত নন।"
        );
      }
    } else {
      requireRole(session, ["super_admin", "admin", "guardian", "staff"]);
    }

    const batch = await Batch.findById(id)
      .populate("academicSession", "name code isCurrent status")
      .populate("assignedTeachers", "fullName teacherCode phone email qualifications")
      .lean();

    if (!batch) {
      throw AppError.notFound("Batch not found", "ব্যাচটি পাওয়া যায়নি।");
    }

    // Calculate active enrollment count and capacity availability
    const activeEnrollments = await Enrollment.countDocuments({
      batch: id,
      status: "active",
    });

    return apiSuccess(
      {
        batch,
        enrolledCount: activeEnrollments,
        availableSeats: Math.max(0, batch.capacity - activeEnrollments),
        isFull: activeEnrollments >= batch.capacity,
      },
      "ব্যাচের বিস্তারিত তথ্য পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);

const updateBatchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  assignedTeachers: z.array(z.string()).optional(),
  subjects: z.array(z.string().trim()).min(1).optional(),
  schedule: z.array(scheduleItemSchema).optional(),
  roomOrOnlineDetails: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
  monthlyFee: z.number().min(0).optional(),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateBatchSchema.parse(body);

    const batch = await Batch.findById(id);
    if (!batch) {
      throw AppError.notFound("Batch not found", "ব্যাচটি পাওয়া যায়নি।");
    }

    // Validate capacity change against active enrollments
    if (validated.capacity !== undefined) {
      const activeEnrollments = await Enrollment.countDocuments({
        batch: id,
        status: "active",
      });

      if (validated.capacity < activeEnrollments) {
        throw AppError.badRequest(
          "Capacity cannot be less than active enrollments",
          `ব্যাচের বর্তমান সক্রিয় শিক্ষার্থী সংখ্যা (${activeEnrollments})। আসন সংখ্যা এর চেয়ে কম করা যাবে না।`
        );
      }
      batch.capacity = validated.capacity;
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      { $set: validated },
      { new: true, runValidators: true }
    );

    return apiSuccess(updatedBatch, "ব্যাচের তথ্য সফলভাবে আপডেট করা হয়েছে।");
  },
  { requireDb: true }
);

export const DELETE = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin"]);

    const batch = await Batch.findById(id);
    if (!batch) {
      throw AppError.notFound("Batch not found", "ব্যাচটি পাওয়া যায়নি।");
    }

    // Preservation of academic history: archive by marking completed
    batch.status = "completed";
    await batch.save();

    return apiSuccess(
      batch,
      "ব্যাচটি সফলভাবে সমাপ্ত ও আর্কাইভ করা হয়েছে (পূর্বের সমস্ত হাজিরা ও ফলাফল সংরক্ষিত থাকবে)।"
    );
  },
  { requireDb: true }
);
