import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/rbac";
import { Conversation } from "@/models/Conversation";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { SiteSettings } from "@/models/SiteSettings";
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";

const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  text: z.string().trim().max(2000, "মেসেজ সর্বোচ্চ ২০০০ অক্ষরের মধ্যে হতে হবে").optional().default(""),
  imageUrl: z.string().trim().optional(),
  attachments: z.array(z.any()).optional(),
  initOnly: z.boolean().optional(),
}).refine((data) => data.initOnly || (data.text && data.text.trim().length > 0) || (data.imageUrl && data.imageUrl.trim().length > 0) || (data.attachments && data.attachments.length > 0), {
  message: "বার্তা লিখুন অথবা একটি ছবি নির্বাচন করুন",
});

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get("conversationId");

    // ==========================================
    // 1. Fetch Paginated Messages for a Conversation
    // ==========================================
    if (conversationId) {
      const conv = await Conversation.findOne({
        _id: conversationId,
        participants: session.userId,
      });

      if (!conv) {
        throw AppError.notFound(
          "Conversation not found",
          "কথোপকথনটি পাওয়া যায়নি বা দেখার অনুমতি নেই।"
        );
      }

      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("limit") || "30", 10))
      );

      const messageFilter = {
        conversation: conversationId,
        deletedFor: { $ne: session.userId },
      };

      const totalCount = await Message.countDocuments(messageFilter);

      // To fetch the most recent messages while paging backwards:
      const skip = Math.max(0, totalCount - page * limit);
      const effectiveLimit = Math.min(limit, totalCount - (page - 1) * limit);

      const messages = await Message.find(messageFilter)
        .populate("sender", "fullName role avatarUrl")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(effectiveLimit > 0 ? effectiveLimit : limit)
        .lean();

      // Mark unread messages as read
      await Message.updateMany(
        {
          conversation: conversationId,
          deletedFor: { $ne: session.userId },
          sender: { $ne: session.userId },
          readBy: { $ne: session.userId },
        },
        { $addToSet: { readBy: session.userId }, $set: { status: "read" } }
      );

      const totalPages = Math.ceil(totalCount / limit) || 1;
      const hasMore = page < totalPages;

      return apiSuccess(
        {
          messages,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasMore,
          },
        },
        "মেসেজ তালিকা পাওয়া গেছে।"
      );
    }

    // ==========================================
    // 2. Fetch User's Active Conversations with Unread Counts
    // (excluding conversations deleted from user's inbox)
    // ==========================================
    const conversations = await Conversation.find({
      participants: session.userId,
      deletedFor: { $ne: session.userId },
      status: "active",
    })
      .populate("participants", "fullName role avatarUrl phone")
      .populate("lastMessage.sender", "fullName role")
      .sort({ "lastMessage.sentAt": -1, updatedAt: -1 })
      .lean();

    // Compute live unread message counts and effective last message per conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          deletedFor: { $ne: session.userId },
          sender: { $ne: session.userId },
          readBy: { $ne: session.userId },
        });

        // Find latest message visible to this user
        const latestMessage = await Message.findOne({
          conversation: conv._id,
          deletedFor: { $ne: session.userId },
        })
          .sort({ createdAt: -1 })
          .populate("sender", "fullName role")
          .lean();

        const effectiveLastMessage = latestMessage
          ? {
              text: latestMessage.text,
              sender: latestMessage.sender,
              sentAt: (latestMessage as any).createdAt,
            }
          : {
              text: "কথোপকথন শুরু করুন...",
              sentAt: (conv as any).updatedAt || new Date(),
            };

        return {
          ...conv,
          lastMessage: effectiveLastMessage,
          unreadCount,
        };
      })
    );

    return apiSuccess(conversationsWithUnread, "কথোপকথন তালিকা পাওয়া গেছে।");
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const body = await req.json();
    const validated = sendMessageSchema.parse(body);

    // Rate Limiting Check: Max 20 messages in the last 60 seconds per user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = await Message.countDocuments({
      sender: session.userId,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentCount >= 20) {
      throw AppError.tooManyRequests(
        "Rate limit exceeded",
        "আপনি খুব দ্রুত বার্তা পাঠাচ্ছেন। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।"
      );
    }

    const finalImageUrl =
      validated.imageUrl ||
      (validated.attachments && validated.attachments.length > 0
        ? validated.attachments[0]?.url || validated.attachments[0]
        : undefined);

    let conversation;

    if (validated.conversationId) {
      conversation = await Conversation.findOne({
        _id: validated.conversationId,
        participants: session.userId,
      });

      if (!conversation) {
        throw AppError.forbidden(
          "Not participant",
          "এই কথোপকথনে মেসেজ পাঠানোর অনুমতি নেই।"
        );
      }

      if (conversation.status === "archived") {
        throw AppError.badRequest(
          "Conversation archived",
          "এই কথোপকথনটি আর্কাইভ করা হয়েছে। এতে আর কোনো বার্তা পাঠানো যাবে না।"
        );
      }
    } else if (validated.recipientId) {
      // Direct recipient validation & policy checks
      if (validated.recipientId === session.userId) {
        throw AppError.badRequest(
          "Self messaging not allowed",
          "নিজের অ্যাকাউন্টে মেসেজ পাঠানো যাবে না।"
        );
      }

      const recipient = await User.findById(validated.recipientId);
      if (!recipient || !recipient.isActive) {
        throw AppError.notFound(
          "Recipient not found or inactive",
          "প্রাপক ব্যবহারকারী সক্রিয় নেই বা পাওয়া যায়নি।"
        );
      }

      const senderRole = session.role;
      const recipientRole = recipient.role;

      // Policy 1: Student-to-student messaging is strictly prohibited
      if (
        (senderRole === "student" || senderRole === "guardian") &&
        (recipientRole === "student" || recipientRole === "guardian")
      ) {
        throw AppError.forbidden(
          "Student-student messaging prohibited",
          "শিক্ষার্থীদের পরস্পরের মধ্যে সরাসরি চ্যাটের অনুমতি নেই।"
        );
      }

      // Policy 2: Teacher-student messaging subject to institution policy
      const isTeacherStudentPair =
        (senderRole === "teacher" &&
          (recipientRole === "student" || recipientRole === "guardian")) ||
        ((senderRole === "student" || senderRole === "guardian") &&
          recipientRole === "teacher");

      if (isTeacherStudentPair) {
        const settings = await SiteSettings.findOne({ key: "main" }).lean();
        if (settings && settings.allowTeacherStudentMessaging === false) {
          throw AppError.forbidden(
            "Teacher-student messaging disabled",
            "কোচিং সেন্টারের নীতি অনুযায়ী শিক্ষক ও শিক্ষার্থীর মধ্যে সরাসরি চ্যাট সাময়িকভাবে স্থগিত রয়েছে। প্রশাসনিক সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।"
          );
        }
      }

      // Find or create direct conversation
      conversation = await Conversation.findOne({
        type: "direct",
        participants: { $all: [session.userId, validated.recipientId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [session.userId, validated.recipientId],
          type: "direct",
          status: "active",
        });
      }

      // If user only wanted to open/init conversation without sending an initial message
      if (validated.initOnly) {
        if (conversation.deletedFor && conversation.deletedFor.length > 0) {
          conversation.deletedFor = conversation.deletedFor.filter(
            (id: any) => id.toString() !== session.userId.toString()
          );
          await conversation.save();
        }
        return apiSuccess({ conversation: conversation._id }, "কথোপকথন প্রস্তুত করা হয়েছে।");
      }
    } else {
      throw AppError.badRequest(
        "Invalid request",
        "কথোপকথন আইডি অথবা প্রাপকের আইডি প্রদান করুন।"
      );
    }

    const messageText = validated.text?.trim() || (finalImageUrl ? "📷 ছবি" : "");

    // Create Message
    const message = await Message.create({
      conversation: conversation._id,
      sender: session.userId,
      text: messageText,
      imageUrl: finalImageUrl,
      readBy: [session.userId],
      deletedFor: [],
      status: "sent",
    });

    // Unhide conversation for any participant who previously deleted it
    conversation.deletedFor = [];
    conversation.lastMessage = {
      text: messageText,
      sender: session.userId as any,
      sentAt: new Date(),
    };
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "fullName role avatarUrl")
      .lean();

    return apiCreated(populatedMessage, "মেসেজ সফলভাবে পাঠানো হয়েছে।");
  },
  { requireDb: true }
);

const editMessageSchema = z.object({
  messageId: z.string().min(1, "মেসেজ আইডি আবশ্যক"),
  text: z.string().trim().min(1, "নতুন বার্তা লিখুন").max(2000),
});

export const PATCH = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const body = await req.json();
    const { messageId, text } = editMessageSchema.parse(body);

    const message = await Message.findById(messageId);
    if (!message) {
      throw AppError.notFound("Message not found", "মেসেজটি পাওয়া যায়নি।");
    }

    if (message.sender.toString() !== session.userId) {
      throw AppError.forbidden(
        "Forbidden",
        "শুধুমাত্র নিজের পাঠানো বার্তা এডিট করতে পারবেন।"
      );
    }

    if (message.isDeleted) {
      throw AppError.badRequest(
        "Already deleted",
        "মুছে ফেলা বার্তা এডিট করা যাবে না।"
      );
    }

    // 1 Day (24 hours) check: After 1 day cannot edit anymore
    const oneDayMs = 24 * 60 * 60 * 1000;
    const diffMs = Date.now() - new Date(message.createdAt).getTime();
    if (diffMs > oneDayMs) {
      throw AppError.badRequest(
        "Edit window expired",
        "বার্তা পাঠানোর ১ দিন (২৪ ঘণ্টা) পার হয়ে যাওয়ায় এটি আর এডিট করা সম্ভব নয়।"
      );
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(messageId)
      .populate("sender", "fullName role avatarUrl")
      .lean();

    return apiSuccess(populated, "বার্তাটি সফলভাবে এডিট করা হয়েছে।");
  },
  { requireDb: true }
);

export const DELETE = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const searchParams = req.nextUrl.searchParams;
    const messageId = searchParams.get("messageId");
    const conversationId = searchParams.get("conversationId");

    // Case 1: Delete a Message
    if (messageId) {
      const message = await Message.findById(messageId);
      if (!message) {
        throw AppError.notFound("Message not found", "মেসেজটি পাওয়া যায়নি।");
      }

      if (
        message.sender.toString() !== session.userId &&
        session.role !== "super_admin"
      ) {
        throw AppError.forbidden("Forbidden", "মেসেজটি মোছার অনুমতি নেই।");
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.text = "এই বার্তাটি মুছে ফেলা হয়েছে";
      message.imageUrl = undefined;
      await message.save();

      return apiSuccess({ messageId }, "বার্তা মুছে ফেলা হয়েছে।");
    }

    // Case 2: Delete conversation for this user (other participant retains full chat history)
    if (conversationId) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: session.userId,
      });

      if (!conversation) {
        throw AppError.notFound(
          "Conversation not found",
          "কথোপকথনটি পাওয়া যায়নি।"
        );
      }

      // 1. Mark all existing messages as deleted for this user only
      await Message.updateMany(
        { conversation: conversationId },
        { $addToSet: { deletedFor: session.userId } }
      );

      // 2. Hide the conversation from this user's conversation list
      await Conversation.updateOne(
        { _id: conversationId },
        { $addToSet: { deletedFor: session.userId } }
      );

      // 3. Permanent cleanup: If all participants have deleted the messages/conversation, remove them from database
      if (conversation.participants && conversation.participants.length > 0) {
        await Message.deleteMany({
          conversation: conversationId,
          deletedFor: { $all: conversation.participants },
        });

        const updatedConv = await Conversation.findById(conversationId).lean();
        if (updatedConv) {
          const allDeleted = (conversation.participants as any[]).every((p) =>
            updatedConv.deletedFor?.some((df: any) => df.toString() === p.toString())
          );
          if (allDeleted) {
            await Conversation.deleteOne({ _id: conversationId });
          }
        }
      }

      return apiSuccess(
        { conversationId },
        "কথোপকথনটি আপনার পক্ষ থেকে মুছে ফেলা হয়েছে।"
      );
    }

    throw AppError.badRequest(
      "Invalid request",
      "messageId বা conversationId প্রদান করুন।"
    );
  },
  { requireDb: true }
);
