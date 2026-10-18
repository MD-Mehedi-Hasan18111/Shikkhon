import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { parsePaginationParams, buildPaginationMeta } from "@/lib/api-query-utils";
import { AcademicSession } from "@/models/AcademicSession";

const createSessionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "সেশনের নাম কমপক্ষে ৩ অক্ষরের হতে হবে (যেমন: ২০২৬ শিক্ষাবর্ষ)"),
  code: z.string().trim().min(2, "সেশন কোড দিন (যেমন: SESSION-2026)").toUpperCase(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isCurrent: z.boolean().default(false),
  status: z.enum(["upcoming", "active", "completed", "archived"]).default("active"),
  description: z.string().optional(),
});

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    requireRole(session, [
      "super_admin",
      "admin",
      "teacher",
      "student",
      "guardian",
      "staff",
    ]);

    const searchParams = req.nextUrl.searchParams;
    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(
      searchParams,
      "startDate",
      10
    );

    const status = searchParams.get("status");
    const isCurrent = searchParams.get("isCurrent");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (isCurrent !== null && isCurrent !== undefined && isCurrent !== "") {
      filter.isCurrent = isCurrent === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const [sessions, total] = await Promise.all([
      AcademicSession.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      AcademicSession.countDocuments(filter),
    ]);

    const meta = buildPaginationMeta(page, limit, total);
    return apiSuccess(sessions, "শিক্ষাবর্ষসমূহের তালিকা পাওয়া গেছে।", meta);
  },
  { requireDb: true }
);

export const POST = createApiHandler(
  async (req: NextRequest) => {
    verifyCsrfProtection(req);
    const authUser = await getAuthenticatedUser(req);
    requireRole(authUser, ["super_admin", "admin"]);

    const body = await req.json();
    const validated = createSessionSchema.parse(body);

    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);

    if (endDate <= startDate) {
      throw AppError.badRequest(
        "End date must be after start date",
        "শিক্ষাবর্ষ সমাপ্তির তারিখ শুরুর তারিখের পরবর্তী হতে হবে।"
      );
    }

    // Check duplicate code
    const existing = await AcademicSession.findOne({ code: validated.code });
    if (existing) {
      throw AppError.conflict(
        "Session code already exists",
        `এই সেশন কোডটি (${validated.code}) ইতিমধ্যে বিদ্যমান রয়েছে।`
      );
    }

    const newSession = await AcademicSession.create({
      name: validated.name,
      code: validated.code,
      startDate,
      endDate,
      isCurrent: validated.isCurrent,
      status: validated.status,
      description: validated.description || "",
    });

    return apiCreated(newSession, "নতুন শিক্ষাবর্ষ সফলভাবে তৈরি করা হয়েছে।");
  },
  { requireDb: true }
);
