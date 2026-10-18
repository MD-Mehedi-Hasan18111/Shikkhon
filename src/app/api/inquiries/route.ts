import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser, requireRole } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { Inquiry } from "@/models/Inquiry";

const createInquirySchema = z.object({
  fullName: z.string().trim().min(2, "শিক্ষার্থীর পূর্ণ নাম লিখুন"),
  phone: z.string().trim().min(11, "১১ ডিজিটের সঠিক মোবাইল নম্বর দিন"),
  guardianPhone: z.string().trim().optional(),
  classLevel: z.string().min(1, "শ্রেণি স্তর নির্বাচন করুন"),
  previousSchool: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const body = await req.json();
    const validated = createInquirySchema.parse(body);

    const inquiry = await Inquiry.create({
      fullName: validated.fullName,
      phone: validated.phone,
      guardianPhone: validated.guardianPhone || undefined,
      classLevel: validated.classLevel as any,
      previousSchool: validated.previousSchool || undefined,
      message: validated.message || undefined,
      status: "pending",
    });

    return apiCreated(
      inquiry,
      "আপনার ভর্তির তথ্য অনুসন্ধান সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।"
    );
  },
  { requireDb: true }
);

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin", "staff"]);

    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(
      searchParams,
      "createdAt",
      15
    );

    const status = searchParams.get("status");
    const classLevel = searchParams.get("classLevel");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (classLevel) filter.classLevel = classLevel;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(inquiries, "অনুসন্ধান তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);
