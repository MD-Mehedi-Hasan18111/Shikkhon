import mongoose, { Schema, Document, Model } from "mongoose";
import { IBatch } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IBatchDocument extends Omit<IBatch, "_id">, Document {}

const ScheduleItemSchema = new Schema(
  {
    day: {
      type: String,
      enum: [
        "saturday",
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ],
      required: true,
    },
    startTime: {
      type: String,
      required: true, // e.g. "16:00"
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "সময় HH:MM ফরম্যাটে দিন (যেমন: 16:00)"],
    },
    endTime: {
      type: String,
      required: true, // e.g. "17:30"
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "সময় HH:MM ফরম্যাটে দিন (যেমন: 17:30)"],
    },
    roomNo: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const BatchSchema = new Schema<IBatchDocument>(
  {
    name: {
      type: String,
      required: [true, "ব্যাচের নাম আবশ্যক"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "ব্যাচ কোড আবশ্যক"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    classLevel: {
      type: String,
      enum: [
        "class_6",
        "class_7",
        "class_8",
        "class_9",
        "class_10",
        "hsc_1st",
        "hsc_2nd",
        "alim_1st",
        "alim_2nd",
        "admission",
      ],
      required: [true, "শ্রেণি স্তর আবশ্যক"],
      index: true,
    },
    academicSession: {
      type: Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "শিক্ষাবর্ষ (Session) আবশ্যক"],
      index: true,
    },
    assignedTeachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
    subjects: {
      type: [String],
      required: [true, "কমপক্ষে একটি বিষয় উল্লেখ করুন"],
    },
    schedule: {
      type: [ScheduleItemSchema],
      default: [],
    },
    roomOrOnlineDetails: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "সর্বোচ্চ আসন সংখ্যা আবশ্যক"],
      min: [1, "কমপক্ষে ১টি আসন থাকতে হবে"],
      default: 40,
    },
    monthlyFee: {
      type: Number,
      required: [true, "মাসিক ফি আবশ্যক"],
      min: [0, "ফি ঋণাত্মক হতে পারে না"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled", "archived"],
      default: "active",
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// Compound indexes
BatchSchema.index({ academicSession: 1, status: 1 });
BatchSchema.index({ classLevel: 1, status: 1 });

export const Batch: Model<IBatchDocument> =
  mongoose.models.Batch || mongoose.model<IBatchDocument>("Batch", BatchSchema);
