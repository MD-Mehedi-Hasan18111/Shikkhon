import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/rbac";
import { NotificationRead } from "@/models/NotificationRead";

const markReadSchema = z.object({
  entityId: z.string().optional(),
  entityType: z.enum(["notice", "event", "blog"]).optional(),
  all: z.boolean().optional(),
  entityIds: z.array(z.string()).optional(),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const body = await req.json();
    const validated = markReadSchema.parse(body);

    if (validated.all && validated.entityIds && validated.entityIds.length > 0) {
      // Mark all specified entities as read
      const bulkOps = validated.entityIds.map((id) => ({
        updateOne: {
          filter: { user: session.userId, entityId: id },
          update: {
            $setOnInsert: {
              user: session.userId,
              entityId: id,
              entityType: validated.entityType || "notice",
              readAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      await NotificationRead.bulkWrite(bulkOps);
      return apiSuccess({ success: true }, "সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে।");
    }

    if (validated.entityId) {
      await NotificationRead.findOneAndUpdate(
        { user: session.userId, entityId: validated.entityId },
        {
          $setOnInsert: {
            user: session.userId,
            entityId: validated.entityId,
            entityType: validated.entityType || "notice",
            readAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    return apiSuccess({ success: true }, "নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে।");
  },
  { requireDb: true }
);
