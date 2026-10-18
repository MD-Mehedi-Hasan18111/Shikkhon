import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { runWithTransaction } from "@/lib/api-query-utils";
import { Enrollment } from "@/models/Enrollment";
import { Batch } from "@/models/Batch";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const transferSchema = z.object({
  targetBatchId: z.string().min(1, "স্থানান্তরযোগ্য ব্যাচ আইডি আবশ্যক"),
  reason: z.string().optional(),
  newRollNumber: z.string().optional(),
});

export const POST = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id: enrollmentId } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = transferSchema.parse(body);

    // 1. Fetch source enrollment
    const sourceEnrollment = await Enrollment.findById(enrollmentId);
    if (!sourceEnrollment) {
      throw AppError.notFound(
        "Enrollment not found",
        "বর্তমান ভর্তি রেকর্ডটি পাওয়া যায়নি।"
      );
    }

    if (sourceEnrollment.status !== "active") {
      throw AppError.badRequest(
        "Only active enrollments can be transferred",
        "শুধুমাত্র সক্রিয় ভর্তি রেকর্ড অন্য ব্যাচে স্থানান্তর করা সম্ভব।"
      );
    }

    if (String(sourceEnrollment.batch) === validated.targetBatchId) {
      throw AppError.badRequest(
        "Source and target batch are identical",
        "শিক্ষার্থী ইতিমধ্যে এই ব্যাচটিতেই রয়েছে। ভিন্ন ব্যাচ নির্বাচন করুন।"
      );
    }

    // 2. Fetch target batch
    const targetBatch = await Batch.findById(validated.targetBatchId);
    if (!targetBatch) {
      throw AppError.notFound("Target batch not found", "নতুন ব্যাচটি পাওয়া যায়নি।");
    }

    if (targetBatch.status === "completed" || targetBatch.status === "cancelled") {
      throw AppError.badRequest(
        "Target batch is not active",
        "নতুন ব্যাচটি সক্রিয় নয়। স্থানান্তরের জন্য সক্রিয় ব্যাচ নির্বাচন করুন।"
      );
    }

    // 3. Multi-document transaction for safe transfer preserving history
    const transferResult = await runWithTransaction(async (dbSession) => {
      // Check target batch capacity inside session
      const targetActiveCount = await Enrollment.countDocuments(
        { batch: targetBatch._id, status: "active" },
        { session: dbSession }
      );

      if (targetActiveCount >= targetBatch.capacity) {
        throw AppError.badRequest(
          "Target batch is full",
          `নতুন ব্যাচের সর্বোচ্চ আসন (${targetBatch.capacity}) পূর্ণ হয়ে গেছে। আসন খালি না থাকলে স্থানান্তর সম্ভব নয়।`
        );
      }

      // Check if student already has an active record in target batch
      const alreadyInTarget = await Enrollment.findOne(
        {
          student: sourceEnrollment.student,
          batch: targetBatch._id,
          academicSession: targetBatch.academicSession,
          status: "active",
        },
        null,
        { session: dbSession }
      );

      if (alreadyInTarget) {
        throw AppError.conflict(
          "Already enrolled in target batch",
          "শিক্ষার্থী ইতিমধ্যে নতুন ব্যাচে সক্রিয়ভাবে ভর্তি রয়েছে।"
        );
      }

      // Mark source enrollment as transferred
      sourceEnrollment.status = "transferred";
      const transferNote = `[${new Date().toLocaleDateString("bn-BD")}] ব্যাচ ${targetBatch.name}-এ স্থানান্তরিত। কারণ: ${validated.reason || "অ্যাডমিন কর্তৃক স্থানান্তর"}`;
      sourceEnrollment.notes = sourceEnrollment.notes
        ? `${sourceEnrollment.notes}\n${transferNote}`
        : transferNote;

      await sourceEnrollment.save({ session: dbSession });

      // Create new enrollment in target batch
      const [newEnrollment] = await Enrollment.create(
        [
          {
            student: sourceEnrollment.student,
            batch: targetBatch._id,
            academicSession: targetBatch.academicSession,
            enrollmentDate: new Date(),
            rollNumber: validated.newRollNumber || String(targetActiveCount + 1),
            feeDiscountPercent: sourceEnrollment.feeDiscountPercent,
            status: "active",
            notes: `পূর্বের ব্যাচ থেকে স্থানান্তরিত (ভর্তি আইডি: ${sourceEnrollment._id})`,
          },
        ],
        { session: dbSession }
      );

      return {
        previousEnrollment: sourceEnrollment,
        newEnrollment,
      };
    });

    return apiCreated(
      transferResult,
      "শিক্ষার্থীর ব্যাচ সফলভাবে পরিবর্তন ও স্থানান্তর করা হয়েছে (পূর্ববর্তী ইতিহাস অক্ষুণ্ণ রয়েছে)।"
    );
  },
  { requireDb: true }
);
