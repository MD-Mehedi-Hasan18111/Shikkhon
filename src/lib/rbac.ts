import { NextRequest } from "next/server";
import { UserRole } from "@/types/database";
import { TokenPayload, verifyJwtToken, AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from "./auth";
import { AppError } from "./api-error";
import { User } from "@/models/User";
import { Student } from "@/models/Student";
import { Teacher } from "@/models/Teacher";
import { Batch } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";

/**
 * Extract and authenticate user from request cookie or Authorization header
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<TokenPayload> {
  let token: string | undefined;

  // 1. Try reading from secure HttpOnly cookie
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    token = cookie.value;
  }

  // 2. Try reading from Authorization Bearer header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    throw AppError.unauthorized(
      "Authentication required",
      "এই তথ্য দেখতে অনুগ্রহ করে প্রথমে লগইন করুন।"
    );
  }

  // Verify signature and expiration
  const payload = verifyJwtToken(token);

  // Verify user still exists and is active in database
  const user = await User.findById(payload.userId).select("+passwordChangedAt");
  if (!user || !user.isActive) {
    throw AppError.unauthorized(
      "User inactive or deleted",
      "আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় রয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।"
    );
  }

  // Token invalidation check on password change
  if (user.passwordChangedAt && payload.iat) {
    const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (changedTimestamp > payload.iat) {
      throw AppError.unauthorized(
        "Password changed. Please login again.",
        "পাসওয়ার্ড পরিবর্তিত হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।"
      );
    }
  }

  return payload;
}

/**
 * Enforce role-based access control (RBAC)
 */
export function requireRole(user: TokenPayload, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw AppError.forbidden(
      `Role '${user.role}' is not authorized`,
      "এই পেজ বা কার্যক্রমে প্রবেশের জন্য আপনার অ্যাকাউন্টের অনুমতি নেই।"
    );
  }
}

/**
 * Enforce student record ownership
 * Prevents students from accessing another student's record by modifying an ID
 */
export async function requireStudentOwnership(
  user: TokenPayload,
  targetStudentId: string
): Promise<void> {
  // Super Admin and Admin can access any student record
  if (user.role === "super_admin" || user.role === "admin") {
    return;
  }

  // If the user is a student, verify they own this record
  if (user.role === "student") {
    // 1. Fast path: Token has verified linked studentId
    if (user.studentId) {
      if (user.studentId !== targetStudentId) {
        throw AppError.forbidden(
          "Cross-student access forbidden",
          "অন্য কোনো শিক্ষার্থীর ব্যক্তিগত তথ্যে আপনার প্রবেশের অনুমতি নেই।"
        );
      }
      return;
    }

    // 2. Database lookup fallback if token doesn't have studentId embedded
    const student = await Student.findOne({
      _id: targetStudentId,
      userId: user.userId,
    });

    if (!student) {
      throw AppError.forbidden(
        "Cross-student access forbidden",
        "অন্য কোনো শিক্ষার্থীর ব্যক্তিগত তথ্যে আপনার প্রবেশের অনুমতি নেই।"
      );
    }
    return;
  }

  // If user is a teacher, verify they teach the student in at least one assigned batch
  if (user.role === "teacher") {
    const teacher = await Teacher.findOne({ userId: user.userId });
    if (!teacher) {
      throw AppError.forbidden(
        "Teacher profile not found",
        "শিক্ষক প্রোফাইল পাওয়া যায়নি।"
      );
    }

    // Find batches assigned to this teacher
    const batches = await Batch.find({ assignedTeachers: teacher._id }).select("_id");
    const batchIds = batches.map((b) => b._id);

    // Verify student is enrolled in at least one of these batches
    const isStudentEnrolled = await Enrollment.findOne({
      student: targetStudentId,
      batch: { $in: batchIds },
      status: "active",
    });

    if (!isStudentEnrolled) {
      throw AppError.forbidden(
        "Student not enrolled in teacher batches",
        "শিক্ষার্থী আপনার নির্ধারিত কোনো ব্যাচে অন্তর্ভুক্ত নয়।"
      );
    }

    return;
  }

  // Guardians can view their ward's record if guardian phone matches
  if (user.role === "guardian") {
    const isWard = await Student.findOne({
      _id: targetStudentId,
      "guardian.phone": user.phone,
    });

    if (!isWard) {
      throw AppError.forbidden(
        "Guardian not authorized for this student",
        "এই শিক্ষার্থীর তথ্য দেখার অভিভাবকীয় অনুমতি নেই।"
      );
    }
    return;
  }

  throw AppError.forbidden("Access denied", "আপনার এই তথ্যে প্রবেশের অনুমতি নেই।");
}

/**
 * Enforce teacher batch assignment
 * Prevents teachers from modifying batches or recording attendance for batches they do not teach
 */
export async function requireTeacherBatchAccess(
  user: TokenPayload,
  batchId: string
): Promise<void> {
  // Super Admin and Admin have institution-wide access
  if (user.role === "super_admin" || user.role === "admin") {
    return;
  }

  if (user.role !== "teacher") {
    throw AppError.forbidden(
      "Only teachers and admins can modify batch records",
      "কেবল অনুমোদিত শিক্ষক বা অ্যাডমিন ব্যাচের তথ্য পরিবর্তন করতে পারবেন।"
    );
  }

  const teacher = await Teacher.findOne({ userId: user.userId });
  if (!teacher) {
    throw AppError.forbidden("Teacher record not found", "শিক্ষক তথ্য পাওয়া যায়নি।");
  }

  const batch = await Batch.findOne({
    _id: batchId,
    assignedTeachers: teacher._id,
  });

  if (!batch) {
    throw AppError.forbidden(
      "Teacher not assigned to this batch",
      "আপনি এই নির্দিষ্ট ব্যাচটির জন্য অনুমোদিত শিক্ষক নন। কেবলমাত্র আপনার নির্ধারিত ব্যাচের কার্যক্রম পরিচালনা করতে পারবেন।"
    );
  }
}

/**
 * Verify CSRF protection for state-mutating requests (POST, PUT, PATCH, DELETE)
 */
export function verifyCsrfProtection(req: NextRequest): void {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return; // Safe idempotent methods
  }

  // 1. Allow if custom AJAX header is present (browsers prevent cross-origin scripts from setting custom headers)
  const requestedWith = req.headers.get("x-requested-with");
  if (requestedWith === "XMLHttpRequest") {
    return;
  }

  // 2. Validate double-submit cookie token if provided
  const csrfHeader = req.headers.get("x-csrf-token");
  const csrfCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (csrfHeader && csrfCookie && csrfHeader === csrfCookie) {
    return;
  }

  // 3. Check Origin / Referer matches host
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (origin && host) {
    const originHost = origin.replace(/^https?:\/\//, "");
    if (originHost === host) {
      return;
    }
  }

  throw AppError.forbidden(
    "CSRF validation failed",
    "নিরাপত্তা যাচাইকরণ (CSRF) ব্যর্থ হয়েছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।"
  );
}
