import mongoose, { Schema, Document, Model } from "mongoose";
import { IBlogPost } from "@/types/database";
import { generateSlug, defaultSchemaOptions } from "@/lib/db-utils";

export interface IBlogPostDocument extends Omit<IBlogPost, "_id">, Document {}

const BlogPostSchema = new Schema<IBlogPostDocument>(
  {
    title: {
      type: String,
      required: [true, "ব্লগের শিরোনাম আবশ্যক"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    summary: {
      type: String,
      required: [true, "সংক্ষিপ্ত সারসংক্ষেপ (Summary) আবশ্যক"],
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: [true, "ব্লগের মূল বিষয়বস্তু আবশ্যক"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "লেখক (Author) রেফারেন্স আবশ্যক"],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

BlogPostSchema.pre("save", function () {
  if (!this.slug || this.isModified("title")) {
    const baseSlug = generateSlug(this.title);
    const suffix = Math.random().toString(36).substring(2, 7);
    this.slug = baseSlug ? `${baseSlug}-${suffix}` : `post-${Date.now()}`;
  }
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

BlogPostSchema.index({ status: 1, publishedAt: -1 });

export const BlogPost: Model<IBlogPostDocument> =
  mongoose.models.BlogPost ||
  mongoose.model<IBlogPostDocument>("BlogPost", BlogPostSchema);
