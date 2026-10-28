import { NextRequest } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { Payment } from "@/models/Payment";
import { Student } from "@/models/Student";
import { Batch } from "@/models/Batch";

const paymentCreateSchema = z.object({
  student: z.string().min(1, "শিক্ষার্থী নির্বাচন আবশ্যক"),
  batch: z.string().min(1, "ব্যাচ নির্বাচন আবশ্যক"),
  academicSession: z.string().optional(),
  classLevel: z.string().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  feeAmount: z.number().min(0, "ফি ঋণাত্মক হতে পারে না"),
  discountAmount: z.number().min(0).default(0),
  paidAmount: z.number().min(0, "পরিশোধিত টাকা ঋণাত্মক হতে পারে না").default(0),
  paymentMethod: z
    .enum(["cash", "bkash", "nagad", "rocket", "bank", "other"])
    .default("cash"),
  transactionId: z.string().optional(),
  receiptNumber: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin", "teacher", "student", "guardian", "staff"]);

    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePaginationParams(searchParams, "createdAt", 15);

    const batchId = searchParams.get("batch");
    const classLevel = searchParams.get("classLevel");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    // Student role restriction: view only their own payments
    if (session.role === "student") {
      const student = await Student.findOne({ userId: session.userId });
      if (!student) {
        throw AppError.notFound("Student profile not found", "শিক্ষার্থীর প্রোফাইল পাওয়া যায়নি।");
      }
      filter.student = student._id;
    } else if (searchParams.get("student")) {
      const sId = searchParams.get("student");
      if (sId && mongoose.Types.ObjectId.isValid(sId)) {
        filter.student = new mongoose.Types.ObjectId(sId);
      } else {
        filter.student = sId;
      }
    }

    if (batchId) {
      if (mongoose.Types.ObjectId.isValid(batchId)) {
        filter.batch = new mongoose.Types.ObjectId(batchId);
      } else {
        filter.batch = batchId;
      }
    }
    if (classLevel) filter.classLevel = classLevel;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (status) filter.status = status;

    // Search query on student name, studentId or phone
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedStudents = await Student.find({
        $or: [
          { fullName: searchRegex },
          { studentId: searchRegex },
          { phone: searchRegex },
          { guardianPhone: searchRegex },
        ],
      })
        .select("_id")
        .lean();

      const studentIds = matchedStudents.map((s) => s._id);
      if (filter.student) {
        // If student filter already exists, ensure intersection
        filter.student = { $in: studentIds.filter((id) => id.toString() === String(filter.student)) };
      } else {
        filter.student = { $in: studentIds };
      }
    }

    const [payments, total, aggregateStats] = await Promise.all([
      Payment.find(filter)
        .populate("student", "fullName studentId phone guardianPhone classLevel institutionName")
        .populate("batch", "name code monthlyFee classLevel")
        .populate("academicSession", "name year")
        .populate("recordedBy", "fullName role")
        .sort({ year: -1, month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalFee: { $sum: "$feeAmount" },
            totalDiscount: { $sum: "$discountAmount" },
            totalPayable: { $sum: "$payableAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalDue: { $sum: "$dueAmount" },
            paidCount: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
            },
            partialCount: {
              $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] },
            },
            dueCount: {
              $sum: { $cond: [{ $eq: ["$status", "due"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const summary = aggregateStats[0] || {
      totalFee: 0,
      totalDiscount: 0,
      totalPayable: 0,
      totalPaid: 0,
      totalDue: 0,
      paidCount: 0,
      partialCount: 0,
      dueCount: 0,
    };

    return apiSuccess(
      {
        payments,
        summary,
      },
      "পেমেন্ট তথ্য পাওয়া গেছে।",
      buildPaginationMeta(page, limit, total)
    );
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin", "staff"]);

    const body = await req.json();
    const validated = paymentCreateSchema.parse(body);

    const student = await Student.findById(validated.student);
    if (!student) {
      throw AppError.notFound("Student not found", "নির্বাচিত শিক্ষার্থী পাওয়া যায়নি।");
    }

    const batch = await Batch.findById(validated.batch);
    if (!batch) {
      throw AppError.notFound("Batch not found", "নির্বাচিত ব্যাচ পাওয়া যায়নি।");
    }

    const payableAmount = Math.max(0, validated.feeAmount - validated.discountAmount);
    const paidAmount = Math.min(payableAmount, validated.paidAmount);
    const dueAmount = Math.max(0, payableAmount - paidAmount);

    let status: "paid" | "partial" | "due" = "due";
    if (dueAmount === 0 && payableAmount > 0) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    // Auto-generate receipt number if missing
    const receiptNumber =
      validated.receiptNumber?.trim() ||
      `RCP-${validated.year}${String(validated.month).padStart(2, "0")}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const paidAt =
      paidAmount > 0
        ? validated.paidAt
          ? new Date(validated.paidAt)
          : new Date()
        : undefined;

    // Check if an existing payment entry already exists for student, batch, month, year
    const existing = await Payment.findOne({
      student: student._id,
      batch: batch._id,
      month: validated.month,
      year: validated.year,
    });

    let payment;
    if (existing) {
      // Update existing record
      existing.feeAmount = validated.feeAmount;
      existing.discountAmount = validated.discountAmount;
      existing.payableAmount = payableAmount;
      existing.paidAmount = paidAmount;
      existing.dueAmount = dueAmount;
      existing.status = status;
      existing.paymentMethod = validated.paymentMethod;
      existing.transactionId = validated.transactionId;
      existing.notes = validated.notes;
      if (paidAt) existing.paidAt = paidAt;
      existing.recordedBy = session.userId as any;
      payment = await existing.save();
    } else {
      payment = await Payment.create({
        student: student._id,
        batch: batch._id,
        academicSession: validated.academicSession || batch.academicSession,
        classLevel: (validated.classLevel as any) || batch.classLevel,
        month: validated.month,
        year: validated.year,
        feeAmount: validated.feeAmount,
        discountAmount: validated.discountAmount,
        payableAmount,
        paidAmount,
        dueAmount,
        status,
        paymentMethod: validated.paymentMethod,
        transactionId: validated.transactionId,
        receiptNumber,
        paidAt,
        recordedBy: session.userId,
        notes: validated.notes,
      });
    }

    const populated = await Payment.findById(payment._id)
      .populate("student", "fullName studentId phone guardianPhone classLevel")
      .populate("batch", "name code monthlyFee classLevel")
      .populate("recordedBy", "fullName role")
      .lean();

    return apiCreated(populated, "পেমেন্ট রেকর্ড সফলভাবে সংরক্ষিত হয়েছে।");
  },
  { requireDb: true }
);
