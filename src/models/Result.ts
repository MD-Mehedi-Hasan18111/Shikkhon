import mongoose, { Schema, Document, Model } from "mongoose";
import { IResult } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";
import "./Exam";
import "./Student";

export interface IResultDocument extends Omit<IResult, "_id">, Document {}

const ResultSchema = new Schema<IResultDocument>(
  {
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "পরীক্ষা রেফারেন্স আবশ্যক"],
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "শিক্ষার্থী রেফারেন্স আবশ্যক"],
      index: true,
    },
    obtainedMarks: {
      type: Number,
      required: [true, "প্রাপ্ত নম্বর (Obtained Marks) আবশ্যক"],
      min: [0, "প্রাপ্ত নম্বর ০ এর নিচে হতে পারে না"],
    },
    highestMarksInBatch: {
      type: Number,
      min: 0,
    },
    grade: {
      type: String,
      trim: true,
    },
    feedback: {
      type: String,
      trim: true,
    },
    publicationStatus: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// Prevent duplicate results for the same student in the same exam
ResultSchema.index({ exam: 1, student: 1 }, { unique: true });

// Merit list sorting index
ResultSchema.index({ exam: 1, obtainedMarks: -1 });

// Student performance history index
ResultSchema.index({ student: 1, createdAt: -1 });

export const Result: Model<IResultDocument> =
  mongoose.models.Result || mongoose.model<IResultDocument>("Result", ResultSchema);
