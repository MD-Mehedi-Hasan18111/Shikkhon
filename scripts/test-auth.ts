/**
 * Authentication and RBAC Authorization Test Suite
 */
import {
  signJwtToken,
  verifyJwtToken,
  signEdgeJwt,
  verifyEdgeJwt,
  checkAccountLockout,
  TokenPayload,
} from "../src/lib/auth";
import {
  requireRole,
  requireStudentOwnership,
  requireTeacherBatchAccess,
  verifyCsrfProtection,
} from "../src/lib/rbac";
import { checkRateLimit, resetRateLimit } from "../src/lib/rate-limiter";
import { AppError } from "../src/lib/api-error";
import { NextRequest } from "next/server";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runAuthTests() {
  console.log("\n🔒 Running Authentication & RBAC Authorization Tests...\n");

  // -------------------------------------------------------------
  // Test 1: JWT Signing and Verification (Node & Edge)
  // -------------------------------------------------------------
  const mockSuperAdminPayload: TokenPayload = {
    userId: "654321098765432109876543",
    phone: "01982705646",
    role: "super_admin",
    fullName: "প্রধান প্রশাসক",
  };

  const nodeToken = signJwtToken(mockSuperAdminPayload, "1h");
  const decodedNode = verifyJwtToken(nodeToken);
  assert(
    decodedNode.userId === mockSuperAdminPayload.userId &&
      decodedNode.role === "super_admin",
    "Node JWT signs and verifies payload with correct roles"
  );

  const edgeToken = await signEdgeJwt(mockSuperAdminPayload, "1h");
  const decodedEdge = await verifyEdgeJwt(edgeToken);
  assert(
    decodedEdge.userId === mockSuperAdminPayload.userId &&
      decodedEdge.role === "super_admin",
    "Jose Edge JWT signs and verifies payload in Edge runtime"
  );

  // -------------------------------------------------------------
  // Test 2: Role-Based Access Control (requireRole)
  // -------------------------------------------------------------
  const mockStudentPayload: TokenPayload = {
    userId: "654321098765432109876544",
    phone: "01711234567",
    role: "student",
    fullName: "মুহাম্মদ আব্দুল্লাহ",
    studentId: "507f1f77bcf86cd799439011",
  };

  const mockTeacherPayload: TokenPayload = {
    userId: "654321098765432109876545",
    phone: "01859787399",
    role: "teacher",
    fullName: "মাওলানা আব্দুর রহিম",
    teacherId: "507f1f77bcf86cd799439022",
  };

  // Student accessing admin route -> MUST THROW 403
  let studentBlocked = false;
  try {
    requireRole(mockStudentPayload, ["super_admin", "admin"]);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 403) {
      studentBlocked = true;
    }
  }
  assert(studentBlocked, "Student role is forbidden (403) from accessing admin routes");

  // Teacher accessing teacher route -> MUST PASS
  let teacherAllowed = false;
  try {
    requireRole(mockTeacherPayload, ["teacher", "admin"]);
    teacherAllowed = true;
  } catch {
    teacherAllowed = false;
  }
  assert(teacherAllowed, "Teacher role is allowed to access permitted teacher routes");

  // Super Admin accessing admin route -> MUST PASS
  let adminAllowed = false;
  try {
    requireRole(mockSuperAdminPayload, ["super_admin", "admin"]);
    adminAllowed = true;
  } catch {
    adminAllowed = false;
  }
  assert(adminAllowed, "Super Admin role is allowed to access admin routes");

  // -------------------------------------------------------------
  // Test 3: Cross-Student Record Access Prevention
  // -------------------------------------------------------------
  const studentAId = "507f1f77bcf86cd799439011";
  const studentBId = "507f1f77bcf86cd799439099";

  // Student A accessing Student B's record -> MUST THROW 403 Forbidden!
  let crossStudentBlocked = false;
  try {
    // Student A's payload has studentId: studentAId
    // Attempting to access studentBId:
    await requireStudentOwnership(mockStudentPayload, studentBId);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 403) {
      crossStudentBlocked = true;
    }
  }
  // Student A accessing Student A's own record -> MUST PASS
  let ownStudentPassed = false;
  try {
    await requireStudentOwnership(mockStudentPayload, studentAId);
    ownStudentPassed = true;
  } catch {
    ownStudentPassed = false;
  }
  assert(ownStudentPassed, "Student A is authorized to access own record");

  assert(
    crossStudentBlocked,
    "Student A is strictly blocked (403 Forbidden) from accessing Student B's records via URL ID"
  );

  // Super Admin accessing Student B's record -> MUST PASS
  let adminBypassPassed = false;
  try {
    await requireStudentOwnership(mockSuperAdminPayload, studentBId);
    adminBypassPassed = true;
  } catch {
    adminBypassPassed = false;
  }
  assert(adminBypassPassed, "Super Admin can access any student's records");

  // -------------------------------------------------------------
  // Test 4: Teacher Batch Modification Restrictions
  // -------------------------------------------------------------
  // Student trying to modify teacher batch records -> MUST THROW 403!
  let studentBatchBlocked = false;
  try {
    await requireTeacherBatchAccess(mockStudentPayload, "507f1f77bcf86cd799439088");
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 403) {
      studentBatchBlocked = true;
    }
  }
  assert(
    studentBatchBlocked,
    "Non-teachers/students are strictly blocked (403) from batch modification endpoints"
  );

  // Super Admin accessing batch -> MUST PASS
  let adminBatchBypass = false;
  try {
    await requireTeacherBatchAccess(mockSuperAdminPayload, "507f1f77bcf86cd799439088");
    adminBatchBypass = true;
  } catch {
    adminBatchBypass = false;
  }
  assert(adminBatchBypass, "Super Admin has global authorization for all batches");

  // -------------------------------------------------------------
  // Test 5: Rate Limiting & Account Lockout
  // -------------------------------------------------------------
  const testPhoneKey = "test:login:01799999999";
  resetRateLimit(testPhoneKey);

  // Attempt 1 to 5
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testPhoneKey, 5, 60000);
    assert(res.allowed === true, `Rate limit attempt ${i} of 5 is allowed`);
  }

  // Attempt 6 -> MUST BE BLOCKED
  const blockedAttempt = checkRateLimit(testPhoneKey, 5, 60000);
  assert(
    blockedAttempt.allowed === false && blockedAttempt.retryAfterSeconds > 0,
    "Rate limiter blocks the 6th consecutive attempt and provides retry-after window"
  );

  // Account Lockout helper check
  let lockoutTriggered = false;
  const lockedUserMock = {
    lockUntil: new Date(Date.now() + 10 * 60 * 1000), // locked for 10 mins
  } as unknown as import("../src/models/User").IUserDocument;
  try {
    checkAccountLockout(lockedUserMock);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 403) {
      lockoutTriggered = true;
    }
  }
  assert(
    lockoutTriggered,
    "Account lockout helper throws 403 Forbidden with Bangla wait time when user is locked"
  );

  // -------------------------------------------------------------
  // Test 6: CSRF Protection
  // -------------------------------------------------------------
  // Safe GET request -> allowed without CSRF headers
  const getReq = new NextRequest("http://localhost:3000/api/dashboard", {
    method: "GET",
  });
  let getPassed = false;
  try {
    verifyCsrfProtection(getReq);
    getPassed = true;
  } catch {
    getPassed = false;
  }
  assert(getPassed, "Safe GET requests bypass CSRF validation");

  // Unprotected POST without custom header or token -> MUST THROW 403
  const badPostReq = new NextRequest("http://localhost:3000/api/admin/users", {
    method: "POST",
  });
  let postBlocked = false;
  try {
    verifyCsrfProtection(badPostReq);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 403) {
      postBlocked = true;
    }
  }
  assert(
    postBlocked,
    "Cross-origin POST request without CSRF token or AJAX header is blocked (403)"
  );

  // Protected POST with x-requested-with header -> MUST PASS
  const validPostReq = new NextRequest("http://localhost:3000/api/admin/users", {
    method: "POST",
    headers: {
      "x-requested-with": "XMLHttpRequest",
    },
  });
  let validPostPassed = false;
  try {
    verifyCsrfProtection(validPostReq);
    validPostPassed = true;
  } catch {
    validPostPassed = false;
  }
  assert(
    validPostPassed,
    "AJAX request with x-requested-with header passes CSRF verification"
  );

  console.log(
    "\n🎉 All Authentication & RBAC Authorization Tests Passed Successfully!\n"
  );
}

runAuthTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
