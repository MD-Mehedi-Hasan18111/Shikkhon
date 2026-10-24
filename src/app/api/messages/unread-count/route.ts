import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/rbac";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";

export const GET = createApiHandler(
  async (req: NextRequest) => {
    let session;
    try {
      session = await getAuthenticatedUser(req);
    } catch {
      return apiSuccess({ unreadCount: 0 });
    }

    // Find all active conversations user participates in
    const conversations = await Conversation.find({
      participants: session.userId,
      deletedFor: { $ne: session.userId },
      status: "active",
    }).select("_id");

    if (!conversations || conversations.length === 0) {
      return apiSuccess({ unreadCount: 0 });
    }

    const conversationIds = conversations.map((c) => c._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: session.userId },
      readBy: { $ne: session.userId },
    });

    return apiSuccess({ unreadCount });
  },
  { requireDb: true }
);
