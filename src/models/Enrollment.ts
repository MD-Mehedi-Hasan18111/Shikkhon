import mongoose, { Schema, Document, Model } from "mongoose";
import { IEnrollment } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IEnrollmentDocument extends Omit<IEnrollment, "_id">, Document {}

const EnrollmentSchema = new Schema<IEnrollmentDocument>(
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
    academicSession: {
      type: Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: [true, "শিক্ষাবর্ষ রেফারেন্স আবশ্যক"],
      index: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    feeDiscountPercent: {
      type: Number,
      min: [0, "ডিসকাউন্ট ০% এর কম হতে পারে না"],
      max: [100, "ডিসকাউন্ট ১০০% এর বেশি হতে পারে না"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "transferred"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// Prevent duplicate enrollments for the same student, batch, and session
EnrollmentSchema.index({ student: 1, batch: 1, academicSession: 1 }, { unique: true });

// Performance query indexes
EnrollmentSchema.index({ batch: 1, status: 1 });
EnrollmentSchema.index({ student: 1, status: 1 });

export const Enrollment: Model<IEnrollmentDocument> =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollmentDocument>("Enrollment", EnrollmentSchema);
