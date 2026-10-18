/**
 * Model and Database Architecture Verification Test Script
 */
import {
  normalizePhoneNumber,
  isValidBangladeshiPhone,
  normalizeEmail,
  normalizeDateToStartOfDay,
  generateSlug,
} from "../src/lib/db-utils";

import {
  User,
  Student,
  Teacher,
  AcademicSession,
  Batch,
  Enrollment,
  Attendance,
  Exam,
  Result,
  Notice,
  BlogPost,
  Event,
  SiteSettings,
  Conversation,
  Message,
} from "../src/models";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

interface IndexSpec {
  student?: number;
  batch?: number;
  academicSession?: number;
  classDate?: number;
  exam?: number;
  [key: string]: number | string | undefined;
}

interface IndexOpt {
  unique?: boolean;
  [key: string]: unknown;
}

type MongooseIndexTuple = [IndexSpec, IndexOpt | undefined];

async function runModelVerification() {
  console.log("\n🧪 Running Mongoose Models & Architecture Verification...\n");

  // 1. Phone number normalization & Bangla numeral conversion tests
  assert(
    normalizePhoneNumber("০১৯৮-২৭০৫৬৪৬") === "01982705646",
    "Converts Bengali digits and removes hyphens to 11-digit ASCII"
  );
  assert(
    normalizePhoneNumber("+8801711234567") === "01711234567",
    "Strips +880 international prefix correctly"
  );
  assert(
    normalizePhoneNumber("8801859787399") === "01859787399",
    "Strips 880 prefix correctly"
  );
  assert(
    isValidBangladeshiPhone("০১৯৮২-৭০৫৬৪৬") === true,
    "Validates authentic Bangladeshi operator numbers with Bengali digits"
  );
  assert(
    isValidBangladeshiPhone("01234567890") === false,
    "Rejects invalid operator prefix 012"
  );

  // 2. Email normalization tests
  assert(
    normalizeEmail("  Info@Shikkhon.Edu.BD ") === "info@shikkhon.edu.bd",
    "Normalizes email to trimmed lowercase"
  );

  // 3. Date normalization tests (Midnight UTC)
  const normalizedDate1 = normalizeDateToStartOfDay("2026-10-17T15:30:45.123Z");
  const normalizedDate2 = normalizeDateToStartOfDay("2026-10-17T08:12:00.000Z");
  assert(
    normalizedDate1.getTime() === normalizedDate2.getTime(),
    "Normalizes distinct times on the same date to identical start-of-day timestamps"
  );

  // 4. Slug generator tests
  const banglaSlug = generateSlug("২০২৬ শিক্ষাবর্ষের ভর্তি কার্যক্রম শুরু");
  assert(
    banglaSlug.includes("২০২৬") && banglaSlug.includes("ভর্তি"),
    "Generates clean URL slug preserving Bengali characters and hyphens"
  );

  // 5. Model schema registration assertions
  const registeredModels = [
    { name: "User", model: User },
    { name: "Student", model: Student },
    { name: "Teacher", model: Teacher },
    { name: "AcademicSession", model: AcademicSession },
    { name: "Batch", model: Batch },
    { name: "Enrollment", model: Enrollment },
    { name: "Attendance", model: Attendance },
    { name: "Exam", model: Exam },
    { name: "Result", model: Result },
    { name: "Notice", model: Notice },
    { name: "BlogPost", model: BlogPost },
    { name: "Event", model: Event },
    { name: "SiteSettings", model: SiteSettings },
    { name: "Conversation", model: Conversation },
    { name: "Message", model: Message },
  ];

  for (const item of registeredModels) {
    assert(
      item.model && item.model.modelName === item.name,
      `Model '${item.name}' is registered and compiled with Mongoose`
    );
  }

  // 6. Compound Index Assertions
  const enrollmentIndexes =
    Enrollment.schema.indexes() as unknown as MongooseIndexTuple[];
  const hasEnrollmentUniqueCompound = enrollmentIndexes.some(
    ([fields, options]) =>
      fields.student === 1 &&
      fields.batch === 1 &&
      fields.academicSession === 1 &&
      options?.unique === true
  );
  assert(
    hasEnrollmentUniqueCompound,
    "Enrollment schema enforces compound unique index { student, batch, academicSession }"
  );

  const attendanceIndexes =
    Attendance.schema.indexes() as unknown as MongooseIndexTuple[];
  const hasAttendanceUniqueCompound = attendanceIndexes.some(
    ([fields, options]) =>
      fields.student === 1 &&
      fields.batch === 1 &&
      fields.classDate === 1 &&
      options?.unique === true
  );
  assert(
    hasAttendanceUniqueCompound,
    "Attendance schema enforces compound unique index { student, batch, classDate }"
  );

  const resultIndexes = Result.schema.indexes() as unknown as MongooseIndexTuple[];
  const hasResultUniqueCompound = resultIndexes.some(
    ([fields, options]) =>
      fields.exam === 1 && fields.student === 1 && options?.unique === true
  );
  assert(
    hasResultUniqueCompound,
    "Result schema enforces compound unique index { exam, student }"
  );

  // 7. Security verification: User password schema options
  const userPasswordPath = User.schema.path("password") as {
    options?: { select?: boolean };
  };
  assert(
    userPasswordPath && userPasswordPath.options?.select === false,
    "User password field has select: false to prevent accidental exposure"
  );

  console.log("\n🎉 All 14 Mongoose Model Architecture and Index Checks Passed!\n");
}

runModelVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
