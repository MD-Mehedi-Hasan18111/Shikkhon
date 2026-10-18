import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { TokenPayload } from "@/lib/auth";
import { BlogPost } from "@/models/BlogPost";

const createBlogPostSchema = z.object({
  title: z.string().trim().min(3, "ব্লগ শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে"),
  summary: z.string().trim().min(5, "সংক্ষিপ্ত সারসংক্ষেপ দিন").max(300),
  content: z.string().trim().min(10, "ব্লগের মূল বিষয়বস্তু দিন"),
  coverImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishedAt: z.string().optional(),
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
    const tag = searchParams.get("tag");
    const statusParam = searchParams.get("status");

    const filter: Record<string, unknown> = {};

    // Enforce publication security: Unauthenticated or non-admin roles CANNOT view drafts or archived
    if (!session || !["super_admin", "admin"].includes(session.role)) {
      filter.status = "published";
    } else {
      if (statusParam) filter.status = statusParam;
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .populate("author", "fullName role")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(posts, "ব্লগ পোস্টের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = createBlogPostSchema.parse(body);

    const newPost = await BlogPost.create({
      title: validated.title,
      summary: validated.summary,
      content: validated.content,
      coverImage: validated.coverImage || "",
      images: validated.images || [],
      tags: validated.tags,
      status: validated.status,
      author: session.userId,
      publishedAt: validated.publishedAt
        ? new Date(validated.publishedAt)
        : validated.status === "published"
          ? new Date()
          : undefined,
    });

    return apiCreated(newPost, "নতুন ব্লগ পোস্ট সফলভাবে তৈরি করা হয়েছে।");
  },
  { requireDb: true }
);
