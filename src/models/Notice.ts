import mongoose, { Schema, Document, Model } from "mongoose";
import { INotice } from "@/types/database";
import { generateSlug, defaultSchemaOptions } from "@/lib/db-utils";
import "@/models/User";

export interface INoticeDocument extends Omit<INotice, "_id">, Document {}

const NoticeSchema = new Schema<INoticeDocument>(
  {
    title: {
      type: String,
      required: [true, "নোটিশের শিরোনাম আবশ্যক"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "নোটিশের বিস্তারিত বিবরণ আবশ্যক"],
    },
    summary: {
      type: String,
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    visibility: {
      type: String,
      enum: ["public", "students", "teachers", "all"],
      default: "all",
      index: true,
    },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "লেখক (Author) রেফারেন্স আবশ্যক"],
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

NoticeSchema.pre("save", function () {
  if (!this.slug || this.isModified("title")) {
    const baseSlug = generateSlug(this.title);
    const suffix = Math.random().toString(36).substring(2, 7);
    this.slug = baseSlug ? `${baseSlug}-${suffix}` : `notice-${Date.now()}`;
  }
});

// Compound indexes
NoticeSchema.index({ status: 1, visibility: 1, publishedAt: -1 });
NoticeSchema.index({ isPinned: -1, publishedAt: -1 });

export const Notice: Model<INoticeDocument> =
  mongoose.models.Notice || mongoose.model<INoticeDocument>("Notice", NoticeSchema);
