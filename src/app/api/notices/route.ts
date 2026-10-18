import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { TokenPayload } from "@/lib/auth";
import { Notice } from "@/models/Notice";

const createNoticeSchema = z.object({
  title: z.string().trim().min(3, "নোটিশের শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে"),
  content: z.string().trim().min(5, "নোটিশের বিস্তারিত বিবরণ দিন"),
  summary: z.string().optional(),
  visibility: z.enum(["public", "students", "teachers", "all"]).default("all"),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  isPinned: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  images: z.array(z.string()).default([]),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
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
      "publishedAt",
      10
    );

    const search = searchParams.get("search");
    const priority = searchParams.get("priority");
    const statusParam = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    // Enforce publication security: Unauthenticated or non-admin roles CANNOT view drafts or archived
    if (!session || !["super_admin", "admin"].includes(session.role)) {
      filter.status = "published";
      if (!session) {
        filter.visibility = { $in: ["public", "all"] };
      } else if (session.role === "student" || session.role === "guardian") {
        filter.visibility = { $in: ["public", "students", "all"] };
      } else if (session.role === "teacher") {
        filter.visibility = { $in: ["public", "teachers", "all"] };
      }
    } else {
      if (statusParam) filter.status = statusParam;
    }

    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .populate("author", "fullName role")
        .sort({ isPinned: -1, [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(notices, "নোটিশের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = createNoticeSchema.parse(body);

    const newNotice = await Notice.create({
      title: validated.title,
      content: validated.content,
      summary: validated.summary || validated.content.slice(0, 150),
      visibility: validated.visibility,
      priority: validated.priority,
      isPinned: validated.isPinned,
      status: validated.status,
      images: validated.images || [],
      author: session.userId,
      publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : new Date(),
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
    });

    return apiCreated(newNotice, "নতুন নোটিশ সফলভাবে তৈরি ও সংরক্ষণ করা হয়েছে।");
  },
  { requireDb: true }
);
