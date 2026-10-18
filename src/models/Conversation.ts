import mongoose, { Schema, Document, Model } from "mongoose";
import { IConversation } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IConversationDocument extends Omit<IConversation, "_id">, Document {}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ["direct", "batch_group"],
      default: "direct",
      index: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    lastMessage: {
      text: { type: String, default: "" },
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      sentAt: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// Participant membership index
ConversationSchema.index({ participants: 1, status: 1 });
ConversationSchema.index({ "lastMessage.sentAt": -1 });

export const Conversation: Model<IConversationDocument> =
  mongoose.models.Conversation ||
  mongoose.model<IConversationDocument>("Conversation", ConversationSchema);
