import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { Payment } from "@/models/Payment";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updatePaymentSchema = z.object({
  paidAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  feeAmount: z.number().min(0).optional(),
  paymentMethod: z
    .enum(["cash", "bkash", "nagad", "rocket", "bank", "other"])
    .optional(),
  transactionId: z.string().optional(),
  receiptNumber: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin", "teacher", "student", "guardian", "staff"]);

    const payment = await Payment.findById(id)
      .populate("student", "fullName studentId phone guardianPhone classLevel institutionName")
      .populate("batch", "name code monthlyFee classLevel")
      .populate("academicSession", "name year")
      .populate("recordedBy", "fullName role")
      .lean();

    if (!payment) {
      throw AppError.notFound("Payment not found", "পেমেন্ট রেকর্ডটি পাওয়া যায়নি।");
    }

    return apiSuccess(payment, "পেমেন্টের বিস্তারিত তথ্য পাওয়া গেছে।");
  },
  { requireDb: true }
);

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin", "staff"]);

    const body = await req.json();
    const validated = updatePaymentSchema.parse(body);

    const payment = await Payment.findById(id);
    if (!payment) {
      throw AppError.notFound("Payment not found", "পেমেন্ট রেকর্ডটি পাওয়া যায়নি।");
    }

    if (validated.feeAmount !== undefined) {
      payment.feeAmount = validated.feeAmount;
    }
    if (validated.discountAmount !== undefined) {
      payment.discountAmount = validated.discountAmount;
    }

    const payable = Math.max(0, payment.feeAmount - payment.discountAmount);
    payment.payableAmount = payable;

    if (validated.paidAmount !== undefined) {
      payment.paidAmount = Math.min(payable, validated.paidAmount);
    }

    const due = Math.max(0, payable - payment.paidAmount);
    payment.dueAmount = due;

    if (due === 0 && payable > 0) {
      payment.status = "paid";
    } else if (payment.paidAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "due";
    }

    if (validated.paymentMethod) payment.paymentMethod = validated.paymentMethod;
    if (validated.transactionId !== undefined) payment.transactionId = validated.transactionId;
    if (validated.receiptNumber !== undefined) payment.receiptNumber = validated.receiptNumber;
    if (validated.notes !== undefined) payment.notes = validated.notes;
    if (validated.paidAt) payment.paidAt = new Date(validated.paidAt);
    else if (payment.paidAmount > 0 && !payment.paidAt) payment.paidAt = new Date();

    payment.recordedBy = session.userId as any;
    await payment.save();

    const populated = await Payment.findById(id)
      .populate("student", "fullName studentId phone guardianPhone classLevel")
      .populate("batch", "name code monthlyFee classLevel")
      .populate("recordedBy", "fullName role")
      .lean();

    return apiSuccess(populated, "পেমেন্ট তথ্য সফলভাবে আপডেট করা হয়েছে।");
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

    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      throw AppError.notFound("Payment not found", "পেমেন্ট রেকর্ডটি পাওয়া যায়নি।");
    }

    return apiSuccess({ id }, "পেমেন্ট রেকর্ড সফলভাবে মুছে ফেলা হয়েছে।");
  },
  { requireDb: true }
);
