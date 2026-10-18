import mongoose, { Schema, Document, Model } from "mongoose";
import { ITeacher } from "@/types/database";
import {
  normalizePhoneNumber,
  isValidBangladeshiPhone,
  normalizeEmail,
  defaultSchemaOptions,
} from "@/lib/db-utils";

export interface ITeacherDocument extends Omit<ITeacher, "_id">, Document {}

const TeacherSchema = new Schema<ITeacherDocument>(
  {
    teacherCode: {
      type: String,
      required: [true, "শিক্ষক কোড (Teacher Code) আবশ্যক"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "শিক্ষকের পুরো নাম আবশ্যক"],
      trim: true,
      minlength: [2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"],
    },
    phone: {
      type: String,
      required: [true, "মোবাইল নম্বর আবশ্যক"],
      unique: true,
      trim: true,
      set: (val: string) => normalizePhoneNumber(val),
      validate: {
        validator: (v: string) => isValidBangladeshiPhone(v),
        message: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন",
      },
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      set: (val?: string) => normalizeEmail(val),
    },
    qualifications: {
      type: [String],
      default: [],
    },
    subjects: {
      type: [String],
      required: [true, "কমপক্ষে একটি পাঠদানের বিষয় উল্লেখ করুন"],
    },
    biography: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

TeacherSchema.index({ subjects: 1 });
TeacherSchema.index({ fullName: "text", subjects: "text" });

export const Teacher: Model<ITeacherDocument> =
  mongoose.models.Teacher || mongoose.model<ITeacherDocument>("Teacher", TeacherSchema);
