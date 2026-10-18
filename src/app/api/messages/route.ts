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
  text: z
    .string()
    .trim()
    .min(1, "মেসেজের বিষয়বস্তু লিখুন")
    .max(2000, "মেসেজ সর্বোচ্চ ২০০০ অক্ষরের মধ্যে হতে হবে"),
  attachments: z.array(z.any()).optional(),
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

      const totalCount = await Message.countDocuments({
        conversation: conversationId,
      });

      // To fetch the most recent messages while paging backwards:
      // skip = Math.max(0, totalCount - (page * limit))
      const skip = Math.max(0, totalCount - page * limit);
      const effectiveLimit = Math.min(limit, totalCount - (page - 1) * limit);

      const messages = await Message.find({ conversation: conversationId })
        .populate("sender", "fullName role avatarUrl")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(effectiveLimit > 0 ? effectiveLimit : limit)
        .lean();

      // Mark unread messages as read
      await Message.updateMany(
        {
          conversation: conversationId,
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
    // ==========================================
    const conversations = await Conversation.find({
      participants: session.userId,
      status: "active",
    })
      .populate("participants", "fullName role avatarUrl phone")
      .populate("lastMessage.sender", "fullName role")
      .sort({ "lastMessage.sentAt": -1, updatedAt: -1 })
      .lean();

    // Compute live unread message counts per conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: session.userId },
          readBy: { $ne: session.userId },
        });

        return {
          ...conv,
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

    // Strictly disallow file attachments until upload validation & virus scans are deployed
    if (validated.attachments && validated.attachments.length > 0) {
      throw AppError.badRequest(
        "Attachments not permitted",
        "নিরাপত্তার স্বার্থে ফাইল বা ছবি সংযুক্তি এখনো অনুমোদিত নয়।"
      );
    }

    // Rate Limiting Check: Max 15 messages in the last 60 seconds per user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = await Message.countDocuments({
      sender: session.userId,
      createdAt: { $gte: oneMinuteAgo },
    });

    if (recentCount >= 15) {
      throw AppError.tooManyRequests(
        "Rate limit exceeded",
        "আপনি খুব দ্রুত বার্তা পাঠাচ্ছেন। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।"
      );
    }

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
    } else {
      throw AppError.badRequest(
        "Invalid request",
        "কথোপকথন আইডি অথবা প্রাপকের আইডি প্রদান করুন।"
      );
    }

    // Create Message
    const message = await Message.create({
      conversation: conversation._id,
      sender: session.userId,
      text: validated.text,
      readBy: [session.userId],
      status: "sent",
    });

    // Update Conversation lastMessage
    conversation.lastMessage = {
      text: validated.text,
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
