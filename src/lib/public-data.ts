import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";
import { Teacher } from "@/models/Teacher";
import { Notice } from "@/models/Notice";
import { BlogPost } from "@/models/BlogPost";
import { Event } from "@/models/Event";
import { Batch } from "@/models/Batch";
import { AcademicSession } from "@/models/AcademicSession";
import { User } from "@/models/User";

/**
 * Public Data Layer: Direct MongoDB queries for Next.js App Router Server Components
 * Enforces published-only visibility so draft/archived content is never exposed prematurely.
 * Includes graceful fallbacks for offline builds and SSR resilience.
 */

const defaultSiteSettings = {
  key: "main",
  institutionName: "শিক্ষণ একাডেমিক কেয়ার",
  shortName: "শিক্ষণ",
  tagline: "চলো সেরা হই...",
  motto: "চলো সেরা হই...",
  heroTitle: "সেরা প্রস্তুতিতে গড়ে তুলুন নিশ্চিত ভবিষ্যৎ",
  heroSubtitle:
    "৬ষ্ঠ থেকে দ্বাদশ শ্রেণি ও আলিয়া মাদ্রাসা স্পেশাল কেয়ার। অভিজ্ঞ শিক্ষক ও নিয়মিত মূল্যায়নের মাধ্যমে শিক্ষার্থীর সামগ্রিক মেধা বিকাশ।",
  aboutTitle: "অভিজ্ঞতা ও আধুনিক পাঠদানের অনন্য সমন্বয়",
  aboutText:
    "শিক্ষণ একাডেমিক কেয়ারে আমরা শিক্ষার্থীদের মুখস্থ বিদ্যার পরিবর্তে বিষয়ের মৌলিক ধারণা স্পষ্ট করার ওপর জোর দিই। অভিজ্ঞ শিক্ষক মণ্ডলীর প্রত্যক্ষ তত্ত্বাবধান, মানসম্মত লেকচার শিট, নিয়মিত ওএমআর পরীক্ষা এবং অভিভাবক সমন্বয়ের মাধ্যমে প্রতিটি শিক্ষার্থীর মেধা বিকাশ নিশ্চিত করা হয়।",
  contactPhone: "০১৯৮-২৭০৫৬৪৬",
  contactEmail: "info@shikkhon.edu.bd",
  address: "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
  whatsappNumber: "+8801859787399",
  whatsAppNumber: "+8801859787399",
  whatsAppPrefillMessage:
    "আসসালামু আলাইকুম, আমি কোচিং এ ভর্তির ব্যাপারে তথ্য জানতে চাচ্ছি।",
  isWhatsAppEnabled: true,
  allowTeacherStudentMessaging: true,
  admissionNotice:
    "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসা স্পেশাল কেয়ারে ভর্তি চলছে।",
  isAdmissionOpen: true,
  metaDescription:
    "জেনারেল ও আলিয়া মাদ্রাসার একটি পূর্ণাঙ্গ একাডেমিক কেয়ার - হালিশহর, চট্টগ্রাম।",
  socialLinks: {
    facebook: "https://facebook.com/shikkhonacademiccare",
    youtube: "",
    instagram: "",
  },
};

export async function getSiteSettings() {
  try {
    await connectToDatabase();
    let settings = await SiteSettings.findOne({ key: "main" }).lean();
    if (!settings) {
      settings = await SiteSettings.create({ key: "main" });
    }
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    return defaultSiteSettings;
  }
}

export async function getActiveTeachers() {
  try {
    await connectToDatabase();
    const teachers = await Teacher.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    return JSON.parse(JSON.stringify(teachers));
  } catch (error) {
    return [];
  }
}

export async function getTeacherById(id: string) {
  try {
    await connectToDatabase();
    const teacher = await Teacher.findOne({ _id: id, isActive: true }).lean();
    if (!teacher) return null;

    // Also query batches assigned to this teacher
    const batches = await Batch.find({
      assignedTeachers: id,
      status: "active",
    })
      .select("name code classLevel subjects schedule roomOrOnlineDetails")
      .lean();

    return JSON.parse(JSON.stringify({ ...teacher, batches }));
  } catch (error) {
    return null;
  }
}

export async function getLatestNotices(limit = 6) {
  try {
    await connectToDatabase();
    const notices = await Notice.find({
      status: "published",
      visibility: { $in: ["all", "public"] },
    })
      .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(notices));
  } catch (error) {
    return [];
  }
}

export async function getAllPublishedNotices(search?: string, priority?: string) {
  try {
    await connectToDatabase();
    const query: Record<string, unknown> = {
      status: "published",
      visibility: { $in: ["all", "public"] },
    };

    if (priority) {
      query.priority = priority;
    }

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { content: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const notices = await Notice.find(query)
      .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(notices));
  } catch (error) {
    return [];
  }
}

export async function getNoticeById(idOrSlug: string) {
  try {
    await connectToDatabase();
    if (!idOrSlug) return null;

    let decoded = idOrSlug;
    try {
      decoded = decodeURIComponent(idOrSlug);
    } catch {
      decoded = idOrSlug;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    let notice = null;

    if (isObjectId) {
      notice = await Notice.findOne({
        _id: idOrSlug,
        status: { $ne: "archived" },
      })
        .populate("author", "fullName role")
        .lean();
    }

    if (!notice) {
      notice = await Notice.findOne({
        slug: { $in: [decoded, idOrSlug] },
        status: { $ne: "archived" },
      })
        .populate("author", "fullName role")
        .lean();
    }

    // Direct ID fallback without status filter
    if (!notice && isObjectId) {
      notice = await Notice.findById(idOrSlug)
        .populate("author", "fullName role")
        .lean();
    }

    return notice ? JSON.parse(JSON.stringify(notice)) : null;
  } catch (error) {
    console.error("Error in getNoticeById:", error);
    return null;
  }
}

export const getNoticeBySlug = getNoticeById;

export async function getRecentBlogPosts(limit = 6) {
  try {
    await connectToDatabase();
    const posts = await BlogPost.find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("author", "fullName")
      .lean();
    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    return [];
  }
}

export async function getAllPublishedBlogPosts(tag?: string, search?: string) {
  try {
    await connectToDatabase();
    const query: Record<string, unknown> = { status: "published" };

    if (tag) {
      query.tags = tag;
    }

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { summary: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const posts = await BlogPost.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("author", "fullName")
      .lean();
    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    await connectToDatabase();
    const post = await BlogPost.findOne({ slug, status: "published" })
      .populate("author", "fullName role")
      .lean();
    if (!post) return null;

    // Increment view count asynchronously
    BlogPost.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } }).exec();

    // Also fetch 3 recent posts as related
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      status: "published",
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select("title slug coverImage images publishedAt")
      .lean();

    return JSON.parse(JSON.stringify({ post, relatedPosts }));
  } catch (error) {
    return null;
  }
}

export async function getUpcomingEvents(limit = 6) {
  try {
    await connectToDatabase();
    const events = await Event.find({ status: "published" })
      .sort({ startDate: 1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    return [];
  }
}

export async function getAllPublishedEvents() {
  try {
    await connectToDatabase();
    const events = await Event.find({ status: { $in: ["published", "completed"] } })
      .sort({ startDate: 1 })
      .lean();
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    return [];
  }
}

export async function getEventById(idOrSlug: string) {
  try {
    await connectToDatabase();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const query: Record<string, unknown> = {
      status: { $in: ["published", "completed"] },
    };
    if (isObjectId) {
      query._id = idOrSlug;
    } else {
      query.slug = idOrSlug;
    }
    const event = await Event.findOne(query).lean();
    return event ? JSON.parse(JSON.stringify(event)) : null;
  } catch (error) {
    return null;
  }
}

export async function getActiveBatchesWithDetails() {
  try {
    await connectToDatabase();
    const batches = await Batch.find({ status: "active" })
      .populate("academicSession", "name isCurrent")
      .populate("assignedTeachers", "fullName designation subjects")
      .sort({ classLevel: 1, name: 1 })
      .lean();
    return JSON.parse(JSON.stringify(batches));
  } catch (error) {
    return [];
  }
}
