import mongoose, { Schema, Document, Model } from "mongoose";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IMessageReportDocument extends Document {
  reporter: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  reason: string;
  status: "pending" | "reviewed" | "dismissed" | "action_taken";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageReportSchema = new Schema<IMessageReportDocument>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, "রিপোর্টের কারণ উল্লেখ করুন"],
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "action_taken"],
      default: "pending",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

export const MessageReport: Model<IMessageReportDocument> =
  mongoose.models.MessageReport ||
  mongoose.model<IMessageReportDocument>("MessageReport", MessageReportSchema);
