import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "@/types/database";
import {
  normalizePhoneNumber,
  isValidBangladeshiPhone,
  normalizeEmail,
  defaultSchemaOptions,
} from "@/lib/db-utils";

export interface IUserDocument extends Omit<IUser, "_id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    phone: {
      type: String,
      required: [true, "মোবাইল নম্বর প্রদান করা আবশ্যক"],
      unique: true,
      trim: true,
      set: (val: string) => normalizePhoneNumber(val),
      validate: {
        validator: (v: string) => isValidBangladeshiPhone(v),
        message: "অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর প্রদান করুন",
      },
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      set: (val?: string) => normalizeEmail(val),
      match: [/^\S+@\S+\.\S+$/, "সঠিক ইমেইল ঠিকানা প্রদান করুন"],
    },
    password: {
      type: String,
      required: [true, "পাসওয়ার্ড প্রদান করা আবশ্যক"],
      minlength: [6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, "পুরো নাম প্রদান করা আবশ্যক"],
      trim: true,
      minlength: [2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"],
      maxlength: [100, "নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারে"],
    },
    role: {
      type: String,
      enum: {
        values: ["super_admin", "admin", "teacher", "student", "guardian", "staff"],
        message: "সঠিক ব্যবহারকারী রোল নির্বাচন করুন",
      },
      default: "student",
      index: true,
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
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    ...defaultSchemaOptions,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving if modified
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
});

// Compare password helper method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
