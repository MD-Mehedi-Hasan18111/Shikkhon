import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { SiteSettings } from "@/models/SiteSettings";

const updateSiteSettingsSchema = z.object({
  institutionName: z.string().trim().min(2).optional(),
  shortName: z.string().trim().min(2).optional(),
  motto: z.string().trim().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  phones: z.array(z.string().trim()).optional(),
  email: z.string().email("সঠিক ইমেইল প্রদান করুন").optional(),
  address: z.string().trim().min(5).optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      youtube: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
    })
    .optional(),
  whatsAppNumber: z.string().optional(),
  whatsAppPrefillMessage: z.string().optional(),
  isWhatsAppEnabled: z.boolean().optional(),
  allowTeacherStudentMessaging: z.boolean().optional(),
  admissionNotice: z.string().optional(),
  isAdmissionOpen: z.boolean().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  aboutTitle: z.string().optional(),
  aboutText: z.string().optional(),
  metaDescription: z.string().optional(),

  // Home Page CMS
  homeStats: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  homeClasses: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        badge: z.string(),
        timing: z.string(),
        href: z.string(),
      })
    )
    .optional(),
  homeFeatures: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  classroomGallery: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).optional(),
        title: z.string(),
        badge: z.string().optional().default(""),
        description: z.string().optional().default(""),
        features: z.array(z.string()).optional().default([]),
        imageSrc: z.string(),
      })
    )
    .optional(),
  homeCtaTitle: z.string().optional(),
  homeCtaText: z.string().optional(),

  // About Page CMS
  aboutStoryParagraph2: z.string().optional(),
  aboutMission: z.string().optional(),
  aboutVision: z.string().optional(),
  aboutValues: z.string().optional(),
  aboutHighlights: z.array(z.string()).optional(),
  officeHours: z.string().optional(),

  // Classes Page CMS
  classesPageTitle: z.string().optional(),
  classesPageSubtitle: z.string().optional(),
  classPrograms: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        badge: z.string(),
        description: z.string(),
        features: z.array(z.string()),
      })
    )
    .optional(),

  // Admission Instructions Page CMS
  admissionsPageTitle: z.string().optional(),
  admissionsPageSubtitle: z.string().optional(),
  admissionsNoticeTitle: z.string().optional(),
  admissionsNoticeText: z.string().optional(),
  admissionSteps: z
    .array(
      z.object({
        num: z.string(),
        title: z.string(),
        desc: z.string(),
      })
    )
    .optional(),
  admissionRequirements: z.array(z.string()).optional(),

  // Contact Page CMS
  contactPageTitle: z.string().optional(),
  contactPageSubtitle: z.string().optional(),
  contactOfficeHours: z.string().optional(),
  contactMapEmbedUrl: z.string().optional(),
});

export const GET = createApiHandler(
  async () => {
    // Public endpoint: Fetch or initialize default settings
    let settings = await SiteSettings.findOne({ key: "main" }).lean();
    if (!settings) {
      settings = await SiteSettings.create({ key: "main" });
    }

    return apiSuccess(settings, "ওয়েবসাইটের সেটিংস পাওয়া গেছে।");
  },
  { requireDb: true }
);

export const PUT = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = updateSiteSettingsSchema.parse(body);

    const updatedSettings = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      { $set: validated },
      { upsert: true, new: true, runValidators: true }
    );

    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/contact");
      revalidatePath("/admissions");
      revalidatePath("/classes");
      revalidatePath("/teachers");
      revalidatePath("/events");
      revalidatePath("/notices");
      revalidatePath("/blog");
    } catch {
      // Ignore if revalidatePath fails in non-server action context
    }

    return apiSuccess(updatedSettings, "ওয়েবসাইটের কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।");
  },
  { requireDb: true }
);
