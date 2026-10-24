import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/rbac";
import { Notice } from "@/models/Notice";
import { Event } from "@/models/Event";
import { BlogPost } from "@/models/BlogPost";
import { NotificationRead } from "@/models/NotificationRead";

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);

    // Notifications are exclusively intended for Teachers, Students & Guardians
    const isTargetRole = ["teacher", "student", "guardian"].includes(session.role);
    if (!isTargetRole) {
      return apiSuccess({ notifications: [], unreadCount: 0 }, "নোটিফিকেশন পাওয়া গেছে।");
    }

    // Fetch items from the past 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Notices (visible to public, all, or role-specific)
    const noticeVisibility: ("public" | "students" | "teachers" | "all")[] =
      session.role === "teacher"
        ? ["public", "all", "teachers"]
        : ["public", "all", "students"];

    const notices = await Notice.find({
      status: { $ne: "archived" },
      visibility: { $in: noticeVisibility },
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("_id title priority createdAt publishedAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 2. Events (published)
    const events = await Event.find({
      status: "published",
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("_id title eventDate createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 3. Blog Posts (published)
    const blogs = await BlogPost.find({
      status: "published",
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select("_id title slug createdAt publishedAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Fetch user's read items
    const readRecords = await NotificationRead.find({
      user: session.userId,
    })
      .select("entityId")
      .lean();

    const readEntityIds = new Set(readRecords.map((r) => r.entityId));

    // Combine and format all items
    const allNotifications: any[] = [];

    notices.forEach((n: any) => {
      const idStr = String(n._id);
      allNotifications.push({
        id: idStr,
        entityId: idStr,
        type: "notice",
        typeName: "নোটিশ",
        title: n.title,
        priority: n.priority,
        link: `/notices/${idStr}`,
        createdAt: n.publishedAt || n.createdAt,
        isRead: readEntityIds.has(idStr),
      });
    });

    events.forEach((e: any) => {
      const idStr = String(e._id);
      allNotifications.push({
        id: idStr,
        entityId: idStr,
        type: "event",
        typeName: "ইভেন্ট",
        title: e.title,
        link: `/events/${idStr}`,
        createdAt: e.createdAt,
        isRead: readEntityIds.has(idStr),
      });
    });

    blogs.forEach((b: any) => {
      const idStr = String(b._id);
      allNotifications.push({
        id: idStr,
        entityId: idStr,
        type: "blog",
        typeName: "ব্লগ",
        title: b.title,
        link: `/blog/${b.slug || idStr}`,
        createdAt: b.publishedAt || b.createdAt,
        isRead: readEntityIds.has(idStr),
      });
    });

    // Sort by createdAt desc
    allNotifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = allNotifications.filter((item) => !item.isRead).length;

    return apiSuccess(
      {
        notifications: allNotifications.slice(0, 20),
        unreadCount,
      },
      "নোটিফিকেশন পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);
