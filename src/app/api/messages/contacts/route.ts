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
        .limit(30)
        .lean();

      return apiSuccess(users, "অনুমোদিত ব্যবহারকারী তালিকা পাওয়া গেছে।");
    }

    if (userRole === "teacher") {
      // 1. All admins
      const admins = await User.find({
        role: { $in: ["super_admin", "admin"] },
        isActive: true,
      })
        .select("_id fullName role avatarUrl phone")
        .lean();

      allowedUserIds = admins.map((a) => a._id);

      // 2. If teacher-student messaging is allowed, find students in teacher's assigned batches
      if (allowTeacherStudent) {
        const teacherDoc = await Teacher.findOne({ user: session.userId });
        if (teacherDoc) {
          const batches = await Batch.find({
            teachers: teacherDoc._id,
            status: "active",
          }).select("_id");
          const batchIds = batches.map((b) => b._id);

          const enrollments = await Enrollment.find({
            batch: { $in: batchIds },
            status: "active",
          }).populate("student", "user");

          const studentUserIds = enrollments
            .map((e: any) => e.student?.user)
            .filter(Boolean);

          allowedUserIds.push(...studentUserIds);
        }
      }
    } else if (userRole === "student" || userRole === "guardian") {
      // 1. All admins
      const admins = await User.find({
        role: { $in: ["super_admin", "admin"] },
        isActive: true,
      })
        .select("_id fullName role avatarUrl phone")
        .lean();

      allowedUserIds = admins.map((a) => a._id);

      // 2. If teacher-student messaging is allowed, find teachers of enrolled batches
      if (allowTeacherStudent) {
        const studentDoc = await Student.findOne({ user: session.userId });
        if (studentDoc) {
          const enrollments = await Enrollment.find({
            student: studentDoc._id,
            status: "active",
          }).select("batch");

          const batchIds = enrollments.map((e) => e.batch);
          const batches = await Batch.find({ _id: { $in: batchIds } }).populate(
            "teachers",
            "user"
          );

          const teacherUserIds = batches.flatMap((b: any) =>
            (b.teachers || []).map((t: any) => t.user).filter(Boolean)
          );

          allowedUserIds.push(...teacherUserIds);
        }
      }
    }

    // Query and return the filtered users
    const query: any = {
      _id: { $in: allowedUserIds },
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
      .limit(30)
      .lean();

    return apiSuccess(contacts, "অনুমোদিত যোগাযোগ তালিকা পাওয়া গেছে।");
  },
  { requireDb: true }
);
