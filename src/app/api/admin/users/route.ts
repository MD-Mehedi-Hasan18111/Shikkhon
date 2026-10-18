import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { apiCreated, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole, verifyCsrfProtection } from "@/lib/rbac";
import { normalizePhoneNumber, isValidBangladeshiPhone } from "@/lib/db-utils";
import { User } from "@/models/User";

const createUserSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((v) => isValidBangladeshiPhone(v), {
      message: "সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: ০১৭১১XXXXXX)",
    }),
  fullName: z.string().trim().min(2, "পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(100),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
  email: z.string().email("সঠিক ইমেইল ঠিকানা দিন").optional().or(z.literal("")),
  role: z.enum(["super_admin", "admin", "teacher", "student", "guardian", "staff"]),
});

export const POST = createApiHandler(
  async (req: NextRequest) => {
    // 1. Verify CSRF
    verifyCsrfProtection(req);

    // 2. Authenticate User & Enforce Role
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    // 3. Validate Payload
    const body = await req.json();
    const validated = createUserSchema.parse(body);

    // 4. Strict Role Hierarchy & Escalation Prevention
    // Only a Super Admin can create another Super Admin or Admin account!
    if (
      ["super_admin", "admin"].includes(validated.role) &&
      session.role !== "super_admin"
    ) {
      throw AppError.forbidden(
        "Privilege escalation forbidden",
        "কেবলমাত্র প্রধান প্রশাসক (Super Admin) নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করতে পারেন।"
      );
    }

    const normalizedPhone = normalizePhoneNumber(validated.phone);

    // Check duplicate phone
    const existingUser = await User.findOne({ phone: normalizedPhone });
    if (existingUser) {
      throw AppError.conflict(
        "Phone already registered",
        "এই মোবাইল নম্বরে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।"
      );
    }

    // 5. Create User Safely (pre-save hook will hash password)
    const newUser = await User.create({
      phone: normalizedPhone,
      fullName: validated.fullName,
      password: validated.password,
      email: validated.email || undefined,
      role: validated.role,
      isActive: true,
    });

    const safeResponse = {
      id: newUser._id.toString(),
      phone: newUser.phone,
      fullName: newUser.fullName,
      role: newUser.role,
      email: newUser.email,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };

    return apiCreated(safeResponse, "নতুন ব্যবহারকারী অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।");
  },
  { requireDb: true }
);

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    requireRole(session, ["super_admin", "admin"]);

    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return apiSuccess(users, "ব্যবহারকারীদের তালিকা পাওয়া গেছে।");
  },
  { requireDb: true }
);
