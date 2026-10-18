import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser } from "@/lib/rbac";
import { Message } from "@/models/Message";
import { Conversation } from "@/models/Conversation";
import { MessageReport } from "@/models/MessageReport";

const reportMessageSchema = z.object({
  messageId: z.string().min(1, "মেসেজ আইডি আবশ্যক"),
  reason: z
    .string()
    .trim()
    .min(5, "রিপোর্টের কারণ বিস্তারিত লিখুন (কমপক্ষে ৫ অক্ষর)")
    .max(500, "রিপোর্টের কারণ সর্বোচ্চ ৫০০ অক্ষরের মধ্যে হতে হবে"),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const body = await req.json();
    const validated = reportMessageSchema.parse(body);

    const message = await Message.findById(validated.messageId);
    if (!message) {
      throw AppError.notFound("Message not found", "রিপোর্টকৃত মেসেজটি পাওয়া যায়নি।");
    }

    // Verify reporter is participant of the conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: session.userId,
    });

    if (!conversation) {
      throw AppError.forbidden(
        "Not conversation participant",
        "এই মেসেজটি রিপোর্ট করার অনুমতি নেই।"
      );
    }

    const report = await MessageReport.create({
      reporter: session.userId,
      messageId: message._id,
      conversationId: conversation._id,
      reason: validated.reason,
      status: "pending",
    });

    return apiCreated(
      { reportId: report._id },
      "মেসেজটি সফলভাবে কর্তৃপক্ষের পর্যালোচনার জন্য জমা দেওয়া হয়েছে।"
    );
  },
  { requireDb: true }
);
