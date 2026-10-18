import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { getAuthenticatedUser, requireRole } from "@/lib/rbac";
import { normalizeDateToStartOfDay } from "@/lib/db-utils";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { Attendance } from "@/models/Attendance";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { Notice } from "@/models/Notice";

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

    const todayStart = normalizeDateToStartOfDay(new Date());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // 1. Super Admin and Admin Dashboard
    if (
      session.role === "super_admin" ||
      session.role === "admin" ||
      session.role === "staff"
    ) {
      const [
        totalStudents,
        totalTeachers,
        totalBatches,
        totalActiveEnrollments,
        todayAttendanceAgg,
        recentStudents,
        upcomingExams,
        recentNotices,
      ] = await Promise.all([
        Student.countDocuments({ status: "active" }),
        Teacher.countDocuments({ isActive: true }),
        Batch.countDocuments({ status: "active" }),
        Enrollment.countDocuments({ status: "active" }),
        Attendance.aggregate([
          { $match: { classDate: { $gte: todayStart, $lt: tomorrowStart } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Student.find({ status: "active" })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("fullName studentId phone classLevel institutionName createdAt")
          .lean(),
        Exam.find({
          publicationStatus: { $ne: "archived" },
          examDate: { $gte: todayStart },
        })
          .populate("batch", "name code classLevel")
          .sort({ examDate: 1 })
          .limit(5)
          .lean(),
        Notice.find({ status: "published" })
          .sort({ isPinned: -1, publishedAt: -1 })
          .limit(5)
          .select("title priority isPinned publishedAt visibility")
          .lean(),
      ]);

      const attendanceCounts: Record<string, number> = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };

      for (const item of todayAttendanceAgg) {
        if (item._id in attendanceCounts) {
          attendanceCounts[item._id] = item.count;
          attendanceCounts.total += item.count;
        }
      }

      const todayAttendanceRate =
        attendanceCounts.total > 0
          ? Math.round(
              ((attendanceCounts.present + attendanceCounts.late) /
                attendanceCounts.total) *
                100
            )
          : 0;

      return apiSuccess(
        {
          role: session.role,
          counts: {
            students: totalStudents,
            teachers: totalTeachers,
            batches: totalBatches,
            activeEnrollments: totalActiveEnrollments,
          },
          todayAttendance: {
            ...attendanceCounts,
            rate: todayAttendanceRate,
          },
          recentStudents,
          upcomingExams,
          recentNotices,
        },
        "ড্যাশবোর্ড পরিসংখ্যান পাওয়া গেছে।"
      );
    }

    // 2. Teacher Dashboard
    if (session.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: session.userId });
      if (!teacher) {
        throw AppError.notFound(
          "Teacher profile not found",
          "শিক্ষকের প্রোফাইল পাওয়া যায়নি।"
        );
      }

      const assignedBatches = await Batch.find({
        assignedTeachers: teacher._id,
        status: "active",
      })
        .select("_id name code classLevel capacity schedule")
        .lean();

      const batchIds = assignedBatches.map((b) => b._id);

      const [totalStudents, todayAttendanceAgg, upcomingExams] = await Promise.all([
        Enrollment.countDocuments({ batch: { $in: batchIds }, status: "active" }),
        Attendance.aggregate([
          {
            $match: {
              batch: { $in: batchIds },
              classDate: { $gte: todayStart, $lt: tomorrowStart },
            },
          },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Exam.find({ batch: { $in: batchIds }, examDate: { $gte: todayStart } })
          .populate("batch", "name code")
          .sort({ examDate: 1 })
          .limit(5)
          .lean(),
      ]);

      const attendanceCounts: Record<string, number> = {
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
      };
      for (const item of todayAttendanceAgg) {
        if (item._id in attendanceCounts) {
          attendanceCounts[item._id] = item.count;
          attendanceCounts.total += item.count;
        }
      }

      return apiSuccess(
        {
          role: "teacher",
          teacher: {
            fullName: teacher.fullName,
            teacherCode: teacher.teacherCode,
            subjects: teacher.subjects,
          },
          counts: {
            batches: assignedBatches.length,
            students: totalStudents,
          },
          assignedBatches,
          todayAttendance: attendanceCounts,
          upcomingExams,
        },
        "শিক্ষক ড্যাশবোর্ড তথ্য পাওয়া গেছে।"
      );
    }

    // 3. Student / Guardian Dashboard
    let studentId: string | undefined;
    if (session.role === "student") {
      const student = await Student.findOne({ userId: session.userId });
      if (!student) {
        throw AppError.notFound("Student not found", "শিক্ষার্থী পাওয়া যায়নি।");
      }
      studentId = String(student._id);
    } else {
      // Guardian
      const qStudentId = req.nextUrl.searchParams.get("studentId");
      if (qStudentId) {
        studentId = qStudentId;
      } else {
        const ward = await Student.findOne({ "guardian.phone": session.phone });
        if (ward) studentId = String(ward._id);
      }
    }

    if (!studentId) {
      throw AppError.badRequest(
        "Student ID required",
        "শিক্ষার্থীর তথ্য সনাক্ত করা যায়নি।"
      );
    }

    const [enrollments, attendanceStats, recentResults, notices] = await Promise.all([
      Enrollment.find({ student: studentId, status: "active" })
        .populate("batch", "name code classLevel schedule")
        .populate("academicSession", "name code")
        .lean(),
      Attendance.aggregate([
        { $match: { student: studentId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Result.find({ student: studentId, publicationStatus: "published" })
        .populate("exam", "title subject maximumMarks examDate")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Notice.find({
        status: "published",
        visibility: { $in: ["public", "students", "all"] },
      })
        .sort({ isPinned: -1, publishedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const attCounts = { present: 0, absent: 0, late: 0, total: 0 };
    for (const item of attendanceStats) {
      if (item._id in attCounts) {
        attCounts[item._id as "present" | "absent" | "late"] = item.count;
        attCounts.total += item.count;
      }
    }
    const studentAttendanceRate =
      attCounts.total > 0
        ? Math.round(((attCounts.present + attCounts.late) / attCounts.total) * 100)
        : 100;

    return apiSuccess(
      {
        role: session.role,
        enrollments,
        attendance: {
          ...attCounts,
          rate: studentAttendanceRate,
        },
        recentResults,
        notices,
      },
      "শিক্ষার্থী ড্যাশবোর্ড তথ্য পাওয়া গেছে।"
    );
  },
  { requireDb: true }
);
