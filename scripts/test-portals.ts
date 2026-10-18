import assert from "assert";
import { UserRole } from "../src/types/database";
import {
  requireRole,
  requireStudentOwnership,
  requireTeacherBatchAccess,
} from "../src/lib/rbac";
import { AppError } from "../src/lib/api-error";
import { TokenPayload } from "../src/lib/auth";

console.log("🔒 Running Dedicated Teacher & Student Portal RBAC & Isolation Tests...\n");

function assertThrowsAppError(
  fn: () => void | Promise<void>,
  expectedStatus: number,
  desc: string
) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      assert.fail(`Expected synchronous error for ${desc}`);
    }
    assert.fail(`Expected error for ${desc}`);
  } catch (error: any) {
    assert(error instanceof AppError, `Error should be AppError: ${desc}`);
    assert.strictEqual(
      error.statusCode,
      expectedStatus,
      `Status code should be ${expectedStatus}: ${desc}`
    );
    console.log(`✅ PASSED: ${desc}`);
  }
}

async function assertThrowsAppErrorAsync(
  fn: () => Promise<void>,
  expectedStatus: number,
  desc: string
) {
  try {
    await fn();
    assert.fail(`Expected error for ${desc}`);
  } catch (error: any) {
    assert(error instanceof AppError, `Error should be AppError: ${desc}`);
    assert.strictEqual(
      error.statusCode,
      expectedStatus,
      `Status code should be ${expectedStatus}: ${desc}`
    );
    console.log(`✅ PASSED: ${desc}`);
  }
}

// 1. Teacher Portal Access Guard
const studentUser: TokenPayload = {
  userId: "user-student-1",
  fullName: "তানভীর আহমেদ",
  phone: "01711111111",
  role: "student",
  studentId: "student-doc-1",
};

const teacherUser: TokenPayload = {
  userId: "user-teacher-1",
  fullName: "প্রকৌ. রফিকুল ইসলাম",
  phone: "01722222222",
  role: "teacher",
  teacherId: "teacher-doc-1",
};

const adminUser: TokenPayload = {
  userId: "user-admin-1",
  fullName: "অ্যাডমিন ইউজার",
  phone: "01733333333",
  role: "admin",
};

// Student blocked from Teacher Portal routes
assertThrowsAppError(
  () => requireRole(studentUser, ["super_admin", "admin", "teacher"]),
  403,
  "Student is strictly blocked (403 Forbidden) from accessing Teacher Portal"
);

// Teacher allowed into Teacher Portal
requireRole(teacherUser, ["super_admin", "admin", "teacher"]);
console.log("✅ PASSED: Teacher is authorized for Teacher Portal");

// Teacher blocked from Admin-only settings routes
assertThrowsAppError(
  () => requireRole(teacherUser, ["super_admin", "admin"]),
  403,
  "Teacher is strictly blocked (403 Forbidden) from accessing Admin-only settings"
);

// 2. Student Data Isolation Tests
const targetStudentId = "student-doc-1";
const differentStudentId = "student-doc-2";

// Student A accessing own record: Allowed
async function runStudentOwnershipTests() {
  await requireStudentOwnership(studentUser, targetStudentId);
  console.log("✅ PASSED: Student is permitted to access their own student records");

  // Student A accessing Student B record: Blocked
  await assertThrowsAppErrorAsync(
    () => requireStudentOwnership(studentUser, differentStudentId),
    403,
    "Student A is strictly blocked (403 Forbidden) from accessing Student B records"
  );

  // Admin accessing Student B record: Allowed
  await requireStudentOwnership(adminUser, differentStudentId);
  console.log("✅ PASSED: Admin has authorized oversight of student records");

  // Non-teacher role blocked from requireTeacherBatchAccess
  await assertThrowsAppErrorAsync(
    () => requireTeacherBatchAccess(studentUser, "batch-123"),
    403,
    "Student is strictly blocked (403 Forbidden) from teacher batch access check"
  );

  console.log(
    "\n🎉 All Dedicated Teacher & Student Portal Security & Isolation Checks Passed!\n"
  );
}

runStudentOwnershipTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
