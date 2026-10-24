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
    imageUrl: {
      type: String,
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    ...defaultSchemaOptions,
  }
);

// High-performance compound indexes for paginated chat history and per-user deleted status
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ conversation: 1, deletedFor: 1, createdAt: -1 });

export const Message: Model<IMessageDocument> =
  mongoose.models.Message || mongoose.model<IMessageDocument>("Message", MessageSchema);
