import mongoose, { Schema, Document, Model } from "mongoose";
import { IStudent } from "@/types/database";
import {
  normalizePhoneNumber,
  isValidBangladeshiPhone,
  normalizeEmail,
  defaultSchemaOptions,
} from "@/lib/db-utils";

export interface IStudentDocument extends Omit<IStudent, "_id">, Document {}

const StudentSchema = new Schema<IStudentDocument>(
  {
    studentId: {
      type: String,
      required: [true, "শিক্ষার্থী আইডি (Student ID) আবশ্যক"],
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
      required: [true, "শিক্ষার্থীর নাম আবশ্যক"],
      trim: true,
      minlength: [2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"],
    },
    phone: {
      type: String,
      required: [true, "শিক্ষার্থীর মোবাইল নম্বর আবশ্যক"],
      unique: true,
      trim: true,
      set: (val: string) => normalizePhoneNumber(val),
      validate: {
        validator: (v: string) => isValidBangladeshiPhone(v),
        message: "সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন",
      },
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      set: (val?: string) => normalizeEmail(val),
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    institutionName: {
      type: String,
      required: [true, "স্কুল বা কলেজের নাম আবশ্যক"],
      trim: true,
    },
    classLevel: {
      type: String,
      enum: {
        values: [
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
        message: "সঠিক শ্রেণি স্তর নির্বাচন করুন",
      },
      required: [true, "শ্রেণি নির্বাচন আবশ্যক"],
      index: true,
    },
    academicGroup: {
      type: String,
      enum: ["science", "humanities", "business_studies", "general"],
      default: "general",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "লিঙ্গ নির্বাচন আবশ্যক"],
    },
    guardian: {
      name: {
        type: String,
        required: [true, "অভিভাবকের নাম আবশ্যক"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "অভিভাবকের মোবাইল নম্বর আবশ্যক"],
        trim: true,
        set: (val: string) => normalizePhoneNumber(val),
        validate: {
          validator: (v: string) => isValidBangladeshiPhone(v),
          message: "অভিভাবকের সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন",
        },
      },
      relation: {
        type: String,
        default: "পিতা",
        trim: true,
      },
      occupation: {
        type: String,
        trim: true,
      },
    },
    address: {
      present: {
        type: String,
        required: [true, "বর্তমান ঠিকানা আবশ্যক"],
        trim: true,
      },
      permanent: {
        type: String,
        trim: true,
      },
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "suspended"],
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

// Compound indexes
StudentSchema.index({ classLevel: 1, status: 1 });
StudentSchema.index({ "guardian.phone": 1 });
StudentSchema.index({ fullName: "text", institutionName: "text" });

export const Student: Model<IStudentDocument> =
  mongoose.models.Student || mongoose.model<IStudentDocument>("Student", StudentSchema);
