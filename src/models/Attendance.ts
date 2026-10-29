import mongoose, { Schema, Document, Model } from "mongoose";
import { IAttendance } from "@/types/database";
import { normalizeDateToStartOfDay, defaultSchemaOptions } from "@/lib/db-utils";
import "./Student";
import "./Batch";
import "./User";

export interface IAttendanceDocument extends Omit<IAttendance, "_id">, Document {}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "শিক্ষার্থী রেফারেন্স আবশ্যক"],
      index: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "ব্যাচ রেফারেন্স আবশ্যক"],
      index: true,
    },
    classDate: {
      type: Date,
      required: [true, "ক্লাসের তারিখ আবশ্যক"],
      set: (val: Date | string | number) => normalizeDateToStartOfDay(val),
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["present", "absent", "late", "excused"],
        message: "সঠিক উপস্থিতির স্ট্যাটাস নির্বাচন করুন",
      },
      default: "present",
      required: true,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "হাজিরা গ্রহণকারী ব্যবহারকারীর রেফারেন্স আবশ্যক"],
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// Prevent duplicate attendance records for the same student, batch, and class date
AttendanceSchema.index({ student: 1, batch: 1, classDate: 1 }, { unique: true });

// Batch daily attendance query index
AttendanceSchema.index({ batch: 1, classDate: 1 });

// Student monthly attendance query index
AttendanceSchema.index({ student: 1, classDate: 1, status: 1 });

export const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendanceDocument>("Attendance", AttendanceSchema);
