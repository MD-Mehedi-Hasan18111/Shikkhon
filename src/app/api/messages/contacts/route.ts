import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { getAuthenticatedUser } from "@/lib/rbac";
import { User } from "@/models/User";
import { Teacher } from "@/models/Teacher";
import { Student } from "@/models/Student";
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { SiteSettings } from "@/models/SiteSettings";

export const GET = createApiHandler(
  async (req: NextRequest) => {
    const session = await getAuthenticatedUser(req);
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";

    const userRole = session.role;
    const settings = await SiteSettings.findOne({ key: "main" }).lean();
    const allowTeacherStudent = settings?.allowTeacherStudentMessaging ?? true;

    let allowedUserIds: any[] = [];

    if (userRole === "super_admin" || userRole === "admin") {
      // Admins can message any active user
      const query: any = {
        _id: { $ne: session.userId },
        isActive: true,
      };

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      const users = await User.find(query)
        .select("fullName role avatarUrl phone")
        .sort({ role: 1, fullName: 1 })
        .limit(50)
        .lean();

      return apiSuccess(users, "অনুমোদিত ব্যবহারকারী তালিকা পাওয়া গেছে।");
    }

    if (userRole === "teacher") {
      // Teacher can message Super Admins, Admins, and Students
      const query: any = {
        _id: { $ne: session.userId },
        role: { $in: ["super_admin", "admin", "student", "guardian"] },
        isActive: true,
      };

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      const contacts = await User.find(query)
        .select("fullName role avatarUrl phone")
        .sort({ role: 1, fullName: 1 })
        .limit(50)
        .lean();

      return apiSuccess(contacts, "অনুমোদিত যোগাযোগ তালিকা পাওয়া গেছে।");
    }

    if (userRole === "student" || userRole === "guardian") {
      // Student can message Super Admins, Admins, and Teachers
      // Students can NEVER message other students
      const query: any = {
        _id: { $ne: session.userId },
        role: { $in: ["super_admin", "admin", "teacher"] },
        isActive: true,
      };

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      const contacts = await User.find(query)
        .select("fullName role avatarUrl phone")
        .sort({ role: 1, fullName: 1 })
        .limit(50)
        .lean();

      return apiSuccess(contacts, "অনুমোদিত শিক্ষক ও একাডেমি প্রশাসন তালিকা পাওয়া গেছে।");
    }

    return apiSuccess([], "কোনো যোগাযোগ পাওয়া যায়নি।");
  },
  { requireDb: true }
);
