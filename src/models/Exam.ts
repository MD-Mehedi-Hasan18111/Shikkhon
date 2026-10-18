import mongoose, { Schema, Document, Model } from "mongoose";
import { IExam } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IExamDocument extends Omit<IExam, "_id">, Document {}

const ExamSchema = new Schema<IExamDocument>(
  {
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "ব্যাচ রেফারেন্স আবশ্যক"],
      index: true,
    },
    subject: {
      type: String,
      required: [true, "পরীক্ষার বিষয় আবশ্যক"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "পরীক্ষার শিরোনাম আবশ্যক"],
      trim: true,
    },
    examDate: {
      type: Date,
      required: [true, "পরীক্ষার তারিখ আবশ্যক"],
    },
    maximumMarks: {
      type: Number,
      required: [true, "পূর্ণমান (Maximum Marks) আবশ্যক"],
      min: [1, "পূর্ণমান কমপক্ষে ১ হতে হবে"],
    },
    passMarks: {
      type: Number,
      min: [0, "পাস মার্ক ঋণাত্মক হতে পারে না"],
    },
    examType: {
      type: String,
      enum: ["weekly", "monthly", "model_test", "term"],
      default: "weekly",
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

ExamSchema.index({ batch: 1, examDate: -1 });
ExamSchema.index({ batch: 1, publicationStatus: 1 });

export const Exam: Model<IExamDocument> =
  mongoose.models.Exam || mongoose.model<IExamDocument>("Exam", ExamSchema);
