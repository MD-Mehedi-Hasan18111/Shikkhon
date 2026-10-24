import mongoose, { Schema, Document, Model } from "mongoose";
import { ISiteSettings } from "@/types/database";
import { defaultSchemaOptions } from "@/lib/db-utils";

export interface ISiteSettingsDocument extends Omit<ISiteSettings, "_id">, Document {}

const SiteSettingsSchema = new Schema<ISiteSettingsDocument>(
  {
    key: {
      type: String,
      default: "main",
      unique: true,
      index: true,
    },
    institutionName: {
      type: String,
      default: "শিক্ষণ একাডেমিক কেয়ার",
      trim: true,
    },
    shortName: {
      type: String,
      default: "শিক্ষণ",
      trim: true,
    },
    motto: {
      type: String,
      default: "চলো সেরা হই...",
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "/images/logo.png",
    },
    bannerUrl: {
      type: String,
      default: "/images/banner.png",
    },
    phones: {
      type: [String],
      default: ["০১৯৮-২৭০৫৬৪৬", "০১৮৫৯-৭৮৭৩৯৯"],
    },
    email: {
      type: String,
      default: "info@shikkhon.edu.bd",
      trim: true,
    },
    address: {
      type: String,
      default: "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
      trim: true,
    },
    socialLinks: {
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    whatsAppNumber: {
      type: String,
      default: "+8801859787399",
    },
    whatsAppPrefillMessage: {
      type: String,
      default: "আসসালামু আলাইকুম, আমি কোচিং এ ভর্তির ব্যাপারে তথ্য জানতে চাচ্ছি।",
    },
    isWhatsAppEnabled: {
      type: Boolean,
      default: true,
    },
    allowTeacherStudentMessaging: {
      type: Boolean,
      default: true,
    },
    admissionNotice: {
      type: String,
      default:
        "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসা স্পেশাল কেয়ারে ভর্তি চলছে।",
    },
    isAdmissionOpen: {
      type: Boolean,
      default: true,
    },
    heroTitle: {
      type: String,
      default: "শিক্ষণ একাডেমিক কেয়ার",
    },
    heroSubtitle: {
      type: String,
      default: "মানসম্মত শিক্ষা ও আধুনিক পাঠদানের নির্ভরযোগ্য প্রতিষ্ঠান",
    },
    aboutTitle: {
      type: String,
      default:
        "শিক্ষার্থীদের মেধা বিকাশ ও বোর্ড পরীক্ষায় শ্রেষ্ঠত্ব অর্জনে আমরা অঙ্গীকারাবদ্ধ",
    },
    aboutText: {
      type: String,
      default:
        "শিক্ষণ একাডেমিক কেয়ার চট্টগ্রাম হালিশহরে প্রতিষ্ঠিত একটি প্রথম সারির পাঠদান কেন্দ্র। অভিজ্ঞ শিক্ষকমণ্ডলী, নিয়মিত ওএমআর মডেল টেস্ট এবং দুর্বল শিক্ষার্থীদের জন্য বিশেষ তদারকির মাধ্যমে আমরা প্রতিটি শিক্ষার্থীর কাঙ্ক্ষিত ফলাফল নিশ্চিত করি।",
    },
    metaDescription: {
      type: String,
      default:
        "জেনারেল ও আলিয়া মাদ্রাসার একটি পূর্ণাঙ্গ একাডেমিক কেয়ার - হালিশহর, চট্টগ্রাম।",
    },
  },
  {
    ...defaultSchemaOptions,
  }
);

export const SiteSettings: Model<ISiteSettingsDocument> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettingsDocument>("SiteSettings", SiteSettingsSchema);
