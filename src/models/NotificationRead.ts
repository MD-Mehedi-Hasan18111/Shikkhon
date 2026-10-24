import mongoose, { Schema, Document, Model } from "mongoose";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface INotificationRead extends Document {
  user: mongoose.Types.ObjectId;
  entityId: string;
  entityType: "notice" | "event" | "blog";
  readAt: Date;
}

const NotificationReadSchema = new Schema<INotificationRead>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["notice", "event", "blog"],
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// Unique compound index so a user only has one read record per entity
NotificationReadSchema.index({ user: 1, entityId: 1 }, { unique: true });

export const NotificationRead: Model<INotificationRead> =
  mongoose.models.NotificationRead ||
  mongoose.model<INotificationRead>("NotificationRead", NotificationReadSchema);
