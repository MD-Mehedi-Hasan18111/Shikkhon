import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser, requireRole } from "@/lib/rbac";
import { Payment } from "@/models/Payment";
import { Batch } from "@/models/Batch";

const banglaMonthNames = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin", "staff"]);

    const searchParams = req.nextUrl.searchParams;
    const now = new Date();
    const currentYear = Number(searchParams.get("year")) || now.getFullYear();
    const currentMonth = Number(searchParams.get("month")) || now.getMonth() + 1; // 1-12

    // 1. Current Month Aggregations
    const monthMatch = { year: currentYear, month: currentMonth };
    const [monthAgg] = await Payment.aggregate([
      { $match: monthMatch },
      {
        $group: {
          _id: null,
          totalCollection: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          totalPayable: { $sum: "$payableAmount" },
          totalStudents: { $sum: 1 },
          paidStudents: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          partialStudents: {
            $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] },
          },
          dueStudents: {
            $sum: { $cond: [{ $eq: ["$status", "due"] }, 1, 0] },
          },
        },
      },
    ]);

    // 2. Yearly Aggregations
    const yearMatch = { year: currentYear };
    const [yearAgg] = await Payment.aggregate([
      { $match: yearMatch },
      {
        $group: {
          _id: null,
          totalCollection: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          totalPayable: { $sum: "$payableAmount" },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    // 3. 12-Month Trend for the Year
    const monthlyAgg = await Payment.aggregate([
      { $match: { year: currentYear } },
      {
        $group: {
          _id: "$month",
          collection: { $sum: "$paidAmount" },
          due: { $sum: "$dueAmount" },
          payable: { $sum: "$payableAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyTrendMap = new Map<number, { collection: number; due: number; payable: number; count: number }>();
    monthlyAgg.forEach((item) => {
      monthlyTrendMap.set(item._id, {
        collection: item.collection,
        due: item.due,
        payable: item.payable,
        count: item.count,
      });
    });

    const yearlyMonthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const data = monthlyTrendMap.get(monthNum) || {
        collection: 0,
        due: 0,
        payable: 0,
        count: 0,
      };
      return {
        month: monthNum,
        name: banglaMonthNames[i],
        collection: data.collection,
        due: data.due,
        payable: data.payable,
        count: data.count,
      };
    });

    // 4. Batch-wise Collection Breakdown
    const batchBreakdownAgg = await Payment.aggregate([
      { $match: { year: currentYear, month: currentMonth } },
      {
        $group: {
          _id: "$batch",
          collection: { $sum: "$paidAmount" },
          due: { $sum: "$dueAmount" },
          totalPayable: { $sum: "$payableAmount" },
          studentsCount: { $sum: 1 },
        },
      },
      { $sort: { collection: -1 } },
    ]);

    const populatedBatchBreakdown = await Batch.populate(batchBreakdownAgg, {
      path: "_id",
      select: "name code classLevel",
    });

    const batchBreakdown = populatedBatchBreakdown
      .filter((b) => b._id)
      .map((item: any) => ({
        batchId: item._id._id,
        name: item._id.name,
        code: item._id.code,
        classLevel: item._id.classLevel,
        collection: item.collection,
        due: item.due,
        totalPayable: item.totalPayable,
        studentsCount: item.studentsCount,
      }));

    // 5. Class-wise Collection Breakdown
    const classBreakdown = await Payment.aggregate([
      { $match: { year: currentYear, month: currentMonth } },
      {
        $group: {
          _id: "$classLevel",
          collection: { $sum: "$paidAmount" },
          due: { $sum: "$dueAmount" },
          totalPayable: { $sum: "$payableAmount" },
          studentsCount: { $sum: 1 },
        },
      },
      { $sort: { collection: -1 } },
    ]);

    return apiSuccess(
      {
        year: currentYear,
        month: currentMonth,
        monthName: banglaMonthNames[currentMonth - 1],
        monthly: {
          collection: monthAgg?.totalCollection || 0,
          due: monthAgg?.totalDue || 0,
          payable: monthAgg?.totalPayable || 0,
          totalStudents: monthAgg?.totalStudents || 0,
          paidStudents: monthAgg?.paidStudents || 0,
          partialStudents: monthAgg?.partialStudents || 0,
          dueStudents: monthAgg?.dueStudents || 0,
          collectionRate:
            monthAgg?.totalPayable > 0
              ? Math.round((monthAgg.totalCollection / monthAgg.totalPayable) * 100)
              : 0,
        },
        yearly: {
          collection: yearAgg?.totalCollection || 0,
          due: yearAgg?.totalDue || 0,
          payable: yearAgg?.totalPayable || 0,
          totalRecords: yearAgg?.totalRecords || 0,
          collectionRate:
            yearAgg?.totalPayable > 0
              ? Math.round((yearAgg.totalCollection / yearAgg.totalPayable) * 100)
              : 0,
        },
        yearlyMonthlyTrend,
        batchBreakdown,
        classBreakdown,
      },
      "আর্থিক রিপোর্ট ও পরিসংখ্যান পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);
