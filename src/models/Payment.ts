import mongoose, { Schema, Document, Model } from "mongoose";
import { IPayment } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";
import "./Student";
import "./Batch";
import "./AcademicSession";
import "./User";

export interface IPaymentDocument extends Omit<IPayment, "_id">, Document {}

const PaymentSchema = new Schema<IPaymentDocument>(
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
      index: true,
    },
    classLevel: {
      type: String,
      required: [true, "শ্রেণি আবশ্যক"],
      index: true,
    },
    month: {
      type: Number,
      required: [true, "মাস (Month) আবশ্যক"],
      min: [1, "মাস ১ থেকে ১২ এর মধ্যে হতে হবে"],
      max: [12, "মাস ১ থেকে ১২ এর মধ্যে হতে হবে"],
      index: true,
    },
    year: {
      type: Number,
      required: [true, "বছর (Year) আবশ্যক"],
      min: [2000, "সঠিক বছর দিন"],
      index: true,
    },
    feeAmount: {
      type: Number,
      required: [true, "ফি এর পরিমাণ আবশ্যক"],
      min: [0, "ফি ঋণাত্মক হতে পারে না"],
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "ডিসকাউন্ট ঋণাত্মক হতে পারে না"],
    },
    payableAmount: {
      type: Number,
      required: true,
      min: [0, "পরিশোধযোগ্য ফি ঋণাত্মক হতে পারে না"],
      default: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      min: [0, "পরিশোধিত অর্থ ঋণাত্মক হতে পারে না"],
      default: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
      min: [0, "বকেয়া ঋণাত্মক হতে পারে না"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["paid", "partial", "due"],
      default: "due",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bkash", "nagad", "rocket", "bank", "other"],
      default: "cash",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
      index: true,
    },
    paidAt: {
      type: Date,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Compound index to guarantee uniqueness for a student in a batch for a specific month and year
PaymentSchema.index({ student: 1, batch: 1, month: 1, year: 1 }, { unique: true });

// Analytical and filtering indexes
PaymentSchema.index({ year: 1, month: 1, status: 1 });
PaymentSchema.index({ batch: 1, year: 1, month: 1 });
PaymentSchema.index({ classLevel: 1, year: 1, month: 1 });
PaymentSchema.index({ createdAt: -1 });

export const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment ||
  mongoose.model<IPaymentDocument>("Payment", PaymentSchema);
