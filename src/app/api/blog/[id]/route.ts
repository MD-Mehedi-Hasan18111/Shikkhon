import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { TokenPayload } from "@/lib/auth";
import { BlogPost } from "@/models/BlogPost";

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

    const post = await BlogPost.findOne(query).populate("author", "fullName role");
    if (!post) {
      throw AppError.notFound("Blog post not found", "ব্লগ পোস্টটি খুঁজে পাওয়া যায়নি।");
    }

    // Security check: If unpublished and not admin, deny
    if (
      post.status !== "published" &&
      (!session || !["super_admin", "admin"].includes(session.role))
    ) {
      throw AppError.forbidden(
        "Post not published",
        "এই ব্লগ পোস্টটি এখনও প্রকাশিত হয়নি।"
      );
    }

    // Increment view count asynchronously
    if (post.status === "published") {
      await BlogPost.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } });
      post.viewCount += 1;
    }

    return apiSuccess(post, "ব্লগ পোস্টের বিস্তারিত তথ্য পাওয়া গেছে।");
  },
  { requireDb: true }
);

const updateBlogPostSchema = z.object({
  title: z.string().trim().min(3).optional(),
  summary: z.string().trim().min(5).max(300).optional(),
  content: z.string().trim().min(10).optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  publishedAt: z.string().optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateBlogPostSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.publishedAt) {
      updateData.publishedAt = new Date(validated.publishedAt);
    } else if (validated.status === "published") {
      updateData.publishedAt = new Date();
    }

    const post = await BlogPost.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!post) {
      throw AppError.notFound("Blog post not found", "ব্লগ পোস্টটি খুঁজে পাওয়া যায়নি।");
    }

    return apiSuccess(post, "ব্লগ পোস্ট সফলভাবে আপডেট করা হয়েছে।");
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

    const post = await BlogPost.findById(id);
    if (!post) {
      throw AppError.notFound("Blog post not found", "ব্লগ পোস্টটি পাওয়া যায়নি।");
    }

    post.status = "archived";
    await post.save();

    return apiSuccess(post, "ব্লগ পোস্টটি সফলভাবে আর্কাইভ করা হয়েছে।");
  },
  { requireDb: true }
);
