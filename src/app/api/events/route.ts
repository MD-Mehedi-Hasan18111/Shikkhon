import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { TokenPayload } from "@/lib/auth";
import { Event } from "@/models/Event";

const createEventSchema = z.object({
  title: z.string().trim().min(3, "ইভেন্টের নাম কমপক্ষে ৩ অক্ষরের হতে হবে"),
  description: z.string().trim().min(10, "ইভেন্টের বিস্তারিত বিবরণ দিন"),
  venue: z.string().trim().min(2, "অনুষ্ঠানস্থল (Venue) উল্লেখ করুন"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "completed", "cancelled"]).default("published"),
  isFeatured: z.boolean().default(false),
});

export const GET = createApiHandler(
  async (req: NextRequest) => {
    let session: TokenPayload | null = null;
    try {
      session = await getAuthenticatedUser(req);
    } catch {
      session = null;
    }

    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(
      searchParams,
      "startDate",
      10
    );

    const search = searchParams.get("search");
    const isFeatured = searchParams.get("isFeatured");
    const statusParam = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    // Enforce publication security: Unauthenticated or non-admin roles CANNOT view drafts or cancelled
    if (!session || !["super_admin", "admin"].includes(session.role)) {
      filter.status = "published";
    } else {
      if (statusParam) filter.status = statusParam;
    }

    if (isFeatured !== null && isFeatured !== undefined && isFeatured !== "") {
      filter.isFeatured = isFeatured === "true";
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
      ];
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ isFeatured: -1, [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(events, "ইভেন্টসমূহের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = createEventSchema.parse(body);

    const newEvent = await Event.create({
      title: validated.title,
      description: validated.description,
      venue: validated.venue,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      coverImage: validated.coverImage || "",
      images: validated.images || [],
      status: validated.status,
      isFeatured: validated.isFeatured,
    });

    return apiCreated(newEvent, "নতুন ইভেন্ট সফলভাবে তৈরি করা হয়েছে।");
  },
  { requireDb: true }
);
