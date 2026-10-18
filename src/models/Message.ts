import mongoose, { Schema, Document, Model } from "mongoose";
import { IMessage } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IMessageDocument extends Omit<IMessage, "_id">, Document {}

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    sizeBytes: { type: Number },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "কথোপকথন (Conversation) রেফারেন্স আবশ্যক"],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "প্রেরক (Sender) রেফারেন্স আবশ্যক"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "বার্তা বিষয়বস্তু (Text) আবশ্যক"],
      trim: true,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// High-performance compound index for paginated chat history (avoiding 16MB doc limit)
MessageSchema.index({ conversation: 1, createdAt: -1 });

export const Message: Model<IMessageDocument> =
  mongoose.models.Message || mongoose.model<IMessageDocument>("Message", MessageSchema);
