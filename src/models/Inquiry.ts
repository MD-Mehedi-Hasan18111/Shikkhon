import mongoose, { Schema, Document, Model } from "mongoose";
import { IInquiry } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IInquiryDocument extends Omit<IInquiry, "_id">, Document {}

const InquirySchema = new Schema<IInquiryDocument>(
  {
    fullName: {
      type: String,
      required: [true, "নাম আবশ্যক"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "মোবাইল নম্বর আবশ্যক"],
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
    classLevel: {
      type: String,
      required: [true, "কাঙ্ক্ষিত শ্রেণি নির্বাচন করুন"],
      index: true,
    },
    previousSchool: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "enrolled", "cancelled"],
      default: "pending",
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

InquirySchema.index({ createdAt: -1 });

export const Inquiry: Model<IInquiryDocument> =
  mongoose.models.Inquiry || mongoose.model<IInquiryDocument>("Inquiry", InquirySchema);
