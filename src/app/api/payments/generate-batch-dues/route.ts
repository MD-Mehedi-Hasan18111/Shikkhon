import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { Payment } from "@/models/Payment";
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";

const generateBatchDuesSchema = z.object({
  batchId: z.string().min(1, "ব্যাচ আইডি আবশ্যক"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  customFee: z.number().min(0).optional(),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const { batchId, month, year, customFee } = generateBatchDuesSchema.parse(body);

    const batch = await Batch.findById(batchId);
    if (!batch) {
      throw AppError.notFound("Batch not found", "ব্যাচটি পাওয়া যায়নি।");
    }

    const enrollments = await Enrollment.find({
      batch: batch._id,
      status: "active",
    })
      .populate("student", "_id classLevel")
      .lean();

    if (enrollments.length === 0) {
      throw AppError.badRequest(
        "No active enrollments",
        "এই ব্যাচে কোনো সক্রিয় শিক্ষার্থী ভর্তি নেই।"
      );
    }

    const fee = customFee !== undefined ? customFee : batch.monthlyFee || 0;
    let createdCount = 0;
    let skippedCount = 0;

    for (const enrollment of enrollments) {
      const studentId =
        typeof enrollment.student === "object"
          ? (enrollment.student as any)?._id
          : enrollment.student;

      if (!studentId) continue;

      // Check if payment entry already exists
      const exists = await Payment.findOne({
        student: studentId,
        batch: batch._id,
        month,
        year,
      });

      if (exists) {
        skippedCount++;
        continue;
      }

      const discountPercent = enrollment.feeDiscountPercent || 0;
      const discountAmount = Math.round((fee * discountPercent) / 100);
      const payableAmount = Math.max(0, fee - discountAmount);

      await Payment.create({
        student: studentId,
        batch: batch._id,
        academicSession: batch.academicSession,
        classLevel: batch.classLevel,
        month,
        year,
        feeAmount: fee,
        discountAmount,
        payableAmount,
        paidAmount: 0,
        dueAmount: payableAmount,
        status: "due",
        paymentMethod: "cash",
        receiptNumber: `RCP-${year}${String(month).padStart(2, "0")}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        recordedBy: session.userId,
      });

      createdCount++;
    }

    return apiCreated(
      { createdCount, skippedCount, totalStudents: enrollments.length },
      `সফলভাবে ${createdCount} জন শিক্ষার্থীর জন্য মাসিক ফি/বকেয়া তৈরি করা হয়েছে। (${skippedCount} জনের আগেই তৈরি ছিল)`
    );
  },
  { requireDb: true }
);
