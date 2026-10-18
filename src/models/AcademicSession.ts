import mongoose, { Schema, Document, Model } from "mongoose";
import { IAcademicSession } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface IAcademicSessionDocument
  extends Omit<IAcademicSession, "_id">, Document {}

const AcademicSessionSchema = new Schema<IAcademicSessionDocument>(
  {
    name: {
      type: String,
      required: [true, "শিক্ষাবর্ষের নাম আবশ্যক (যেমন: ২০২৬ শিক্ষাবর্ষ)"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "সেশন কোড আবশ্যক (যেমন: SESSION-2026)"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "শুরুর তারিখ আবশ্যক"],
    },
    endDate: {
      type: Date,
      required: [true, "সমাপ্তির তারিখ আবশ্যক"],
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "archived"],
      default: "active",
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

// Middleware: ensure only one session has isCurrent = true if set
AcademicSessionSchema.pre("save", async function () {
  if (this.isModified("isCurrent") && this.isCurrent) {
    await (this.constructor as Model<IAcademicSessionDocument>).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
});

export const AcademicSession: Model<IAcademicSessionDocument> =
  mongoose.models.AcademicSession ||
  mongoose.model<IAcademicSessionDocument>("AcademicSession", AcademicSessionSchema);
