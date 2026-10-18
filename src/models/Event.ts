import mongoose, { Schema, Document, Model } from "mongoose";
import { IEvent } from "@/types/database";
import { generateSlug, defaultSchemaOptions } from "@/lib/db-utils";

export interface IEventDocument extends Omit<IEvent, "_id">, Document {}

const EventSchema = new Schema<IEventDocument>(
  {
    title: {
      type: String,
      required: [true, "ইভেন্টের নাম আবশ্যক"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "ইভেন্টের বিবরণ আবশ্যক"],
    },
    venue: {
      type: String,
      required: [true, "অনুষ্ঠানস্থল (Venue) আবশ্যক"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "ইভেন্টের শুরুর তারিখ আবশ্যক"],
      index: true,
    },
    endDate: {
      type: Date,
    },
    coverImage: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "completed", "cancelled"],
      default: "published",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

EventSchema.pre("save", function () {
  if (!this.slug || this.isModified("title")) {
    const baseSlug = generateSlug(this.title);
    const suffix = Math.random().toString(36).substring(2, 7);
    this.slug = baseSlug ? `${baseSlug}-${suffix}` : `event-${Date.now()}`;
  }
});

EventSchema.index({ startDate: 1, status: 1 });

export const Event: Model<IEventDocument> =
  mongoose.models.Event || mongoose.model<IEventDocument>("Event", EventSchema);
