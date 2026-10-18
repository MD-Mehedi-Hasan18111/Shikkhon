import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { TokenPayload } from "@/lib/auth";
import { Notice } from "@/models/Notice";

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

    // Query either by ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const notice = await Notice.findOne(query).populate("author", "fullName role").lean();
    if (!notice) {
      throw AppError.notFound("Notice not found", "নোটিশটি খুঁজে পাওয়া যায়নি।");
    }

    // Security check: If unpublished and not admin, deny
    if (
      notice.status !== "published" &&
      (!session || !["super_admin", "admin"].includes(session.role))
    ) {
      throw AppError.forbidden("Notice not published", "এই নোটিশটি এখনও প্রকাশিত হয়নি।");
    }

    return apiSuccess(notice, "নোটিশের বিস্তারিত তথ্য পাওয়া গেছে।");
  },
  { requireDb: true }
);

const updateNoticeSchema = z.object({
  title: z.string().trim().min(3).optional(),
  content: z.string().trim().min(5).optional(),
  summary: z.string().optional(),
  visibility: z.enum(["public", "students", "teachers", "all"]).optional(),
  priority: z.enum(["normal", "important", "urgent"]).optional(),
  isPinned: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  images: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const PATCH = createApiHandler(
  async (req: NextRequest, context: unknown) => {
    verifyCsrfProtection(req);
    const { params } = context as RouteParams;
    const { id } = await params;

    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateNoticeSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.publishedAt) {
      updateData.publishedAt = new Date(validated.publishedAt);
    }
    if (validated.expiresAt) {
      updateData.expiresAt = new Date(validated.expiresAt);
    }

    const notice = await Notice.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!notice) {
      throw AppError.notFound("Notice not found", "নোটিশটি খুঁজে পাওয়া যায়নি।");
    }

    return apiSuccess(notice, "নোটিশটি সফলভাবে আপডেট করা হয়েছে।");
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

    const notice = await Notice.findById(id);
    if (!notice) {
      throw AppError.notFound("Notice not found", "নোটিশটি পাওয়া যায়নি।");
    }

    // Preservation: archive rather than hard delete
    notice.status = "archived";
    await notice.save();

    return apiSuccess(notice, "নোটিশটি সফলভাবে আর্কাইভ করা হয়েছে।");
  },
  { requireDb: true }
);
