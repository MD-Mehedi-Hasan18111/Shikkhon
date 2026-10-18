import { MetadataRoute } from "next";
import {
  getActiveTeachers,
  getAllPublishedNotices,
  getAllPublishedBlogPosts,
  getAllPublishedEvents,
} from "@/lib/public-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shikkhon.edu.bd";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/classes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/teachers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/notices`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/admissions`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const [teachers, notices, blogs, events] = await Promise.all([
      getActiveTeachers(),
      getAllPublishedNotices(),
      getAllPublishedBlogPosts(),
      getAllPublishedEvents(),
    ]);

    const teacherRoutes: MetadataRoute.Sitemap = teachers.map((t: any) => ({
      url: `${baseUrl}/teachers/${t._id}`,
      lastModified: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    const noticeRoutes: MetadataRoute.Sitemap = notices.map((n: any) => ({
      url: `${baseUrl}/notices/${n.slug}`,
      lastModified: n.updatedAt ? new Date(n.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((b: any) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    const eventRoutes: MetadataRoute.Sitemap = events.map((e: any) => ({
      url: `${baseUrl}/events/${e._id}`,
      lastModified: e.updatedAt ? new Date(e.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...teacherRoutes,
      ...noticeRoutes,
      ...blogRoutes,
      ...eventRoutes,
    ];
  } catch (error) {
    // Fallback to static routes if database is unreachable during sitemap generation
    return staticRoutes;
  }
}
