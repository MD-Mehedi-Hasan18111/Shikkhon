import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { AcademicSession } from "@/models/AcademicSession";
import { Batch } from "@/models/Batch";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, [
      "super_admin",
      "admin",
      "teacher",
      "student",
      "guardian",
      "staff",
    ]);

    const academicSession = await AcademicSession.findById(id).lean();
    if (!academicSession) {
      throw AppError.notFound(
        "Academic session not found",
        "শিক্ষাবর্ষ খুঁজে পাওয়া যায়নি।"
      );
    }

    const batchCount = await Batch.countDocuments({ academicSession: id });

    return apiSuccess(
      { session: academicSession, totalBatches: batchCount },
      "শিক্ষাবর্ষের তথ্য পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);

const updateSessionSchema = z.object({
  name: z.string().trim().min(3).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  isCurrent: z.boolean().optional(),
  status: z.enum(["upcoming", "active", "completed", "archived"]).optional(),
  description: z.string().optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateSessionSchema.parse(body);

    const targetSession = await AcademicSession.findById(id);
    if (!targetSession) {
      throw AppError.notFound("Academic session not found", "শিক্ষাবর্ষটি পাওয়া যায়নি।");
    }

    if (validated.startDate) targetSession.startDate = new Date(validated.startDate);
    if (validated.endDate) targetSession.endDate = new Date(validated.endDate);

    if (targetSession.endDate <= targetSession.startDate) {
      throw AppError.badRequest(
        "End date must be after start date",
        "শিক্ষাবর্ষ সমাপ্তির তারিখ শুরুর তারিখের পরবর্তী হতে হবে।"
      );
    }

    if (validated.name !== undefined) targetSession.name = validated.name;
    if (validated.status !== undefined) targetSession.status = validated.status;
    if (validated.description !== undefined)
      targetSession.description = validated.description;
    if (validated.isCurrent !== undefined) targetSession.isCurrent = validated.isCurrent;

    await targetSession.save();

    return apiSuccess(targetSession, "শিক্ষাবর্ষ সফলভাবে আপডেট করা হয়েছে।");
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

    const targetSession = await AcademicSession.findById(id);
    if (!targetSession) {
      throw AppError.notFound("Academic session not found", "শিক্ষাবর্ষটি পাওয়া যায়নি।");
    }

    // Preservation of academic history: archive instead of destructive delete
    targetSession.status = "archived";
    targetSession.isCurrent = false;
    await targetSession.save();

    return apiSuccess(
      targetSession,
      "শিক্ষাবর্ষটি সফলভাবে আর্কাইভ করা হয়েছে (পূর্বের সমস্ত ব্যাচ ও শিক্ষার্থীর ইতিহাস অক্ষুণ্ণ থাকবে)।"
    );
  },
  { requireDb: true }
);
