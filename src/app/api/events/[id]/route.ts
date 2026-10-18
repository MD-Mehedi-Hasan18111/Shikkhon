import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { TokenPayload } from "@/lib/auth";
import { Event } from "@/models/Event";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    const { params } = context as RouteParams;
    const { id } = await params;

    let session: TokenPayload | null = null;
    try {
      session = await getAuthenticatedUser(req);
    } catch {
      session = null;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const event = await Event.findOne(query).lean();
    if (!event) {
      throw AppError.notFound("Event not found", "ইভেন্টটি খুঁজে পাওয়া যায়নি।");
    }

    // Security check: If unpublished and not admin, deny
    if (
      event.status !== "published" &&
      (!session || !["super_admin", "admin"].includes(session.role))
    ) {
      throw AppError.forbidden("Event not published", "এই ইভেন্টটি এখনও প্রকাশিত হয়নি।");
    }

    return apiSuccess(event, "ইভেন্টের বিস্তারিত তথ্য পাওয়া গেছে।");
  },
  { requireDb: true }
);

const updateEventSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().min(10).optional(),
  venue: z.string().trim().min(2).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "completed", "cancelled"]).optional(),
  isFeatured: z.boolean().optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateEventSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.startDate) {
      updateData.startDate = new Date(validated.startDate);
    }
    if (validated.endDate) {
      updateData.endDate = new Date(validated.endDate);
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!event) {
      throw AppError.notFound("Event not found", "ইভেন্টটি পাওয়া যায়নি।");
    }

    return apiSuccess(event, "ইভেন্ট সফলভাবে আপডেট করা হয়েছে।");
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

    const event = await Event.findById(id);
    if (!event) {
      throw AppError.notFound("Event not found", "ইভেন্ট পাওয়া যায়নি।");
    }

    event.status = "cancelled";
    await event.save();

    return apiSuccess(event, "ইভেন্টটি সফলভাবে বাতিল ও সংরক্ষণ করা হয়েছে।");
  },
  { requireDb: true }
);
