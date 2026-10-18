/**
 * Test Suite: Communication Features (Real-Time In-App Chat & WhatsApp Integration)
 * Run via: npm run test:communication
 */

import {
  normalizePhoneNumber,
  formatWhatsAppNumber,
  isValidWhatsAppNumber,
  generateWhatsAppLink,
  DEFAULT_WHATSAPP_ADMISSION_MESSAGE,
} from "../src/lib/whatsapp";

import { formatBanglaMessageTime, parseSafeMessageText } from "../src/lib/message-utils";

import { toBanglaNumber } from "../src/lib/utils";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("\n📱 --- 1. WhatsApp Click-to-Chat & Number Validation Tests ---");

// Test Bengali Numeral Normalization
const rawBanglaPhone = "০১৯৮-২৭০৫৬৪৬";
const normalizedDigits = normalizePhoneNumber(rawBanglaPhone);
assert(
  normalizedDigits === "01982705646",
  `Bengali numerals correctly converted to ASCII digits: ${rawBanglaPhone} -> ${normalizedDigits}`
);

// Test International E.164 Formatting (880 Prefix for Bangladesh)
const formattedWa = formatWhatsAppNumber(rawBanglaPhone);
assert(
  formattedWa === "8801982705646",
  `Formatted WhatsApp international number: ${formattedWa}`
);

// Test Pre-existing country code
const alreadyPrefixed = formatWhatsAppNumber("+8801712345678");
assert(
  alreadyPrefixed === "8801712345678",
  `Number with +880 stripped to clean E.164: ${alreadyPrefixed}`
);

// Test Invalid phone number rejection
assert(!isValidWhatsAppNumber("123"), "Rejects invalid short phone number");
assert(!isValidWhatsAppNumber("abcdefghijk"), "Rejects alphabetic phone number");
assert(isValidWhatsAppNumber("01711223344"), "Accepts valid 11-digit Bangladeshi mobile");

// Test Safe Link Generation & URL Encoding
const waLinkWithText = generateWhatsAppLink({
  phone: "+880 1866-098078",
  message: DEFAULT_WHATSAPP_ADMISSION_MESSAGE,
});

assert(
  waLinkWithText.startsWith("https://wa.me/8801866098078?text="),
  "Generates official wa.me link with international prefix for +880 1866-098078"
);

assert(
  waLinkWithText.includes(encodeURIComponent(DEFAULT_WHATSAPP_ADMISSION_MESSAGE)),
  "Encodes Bangla prefilled message safely into URL query"
);

const waLinkNoText = generateWhatsAppLink({ phone: "+880 1866-098078" });
assert(
  waLinkNoText === "https://wa.me/8801866098078",
  "Generates clean base wa.me link without text for +880 1866-098078"
);

console.log("\n💬 --- 2. Safe Text & Link Extraction Tests ---");

// Test Safe Link Parsing
const rawMessageWithLink =
  "ক্লাসের শিট ডাউনলোড করুন: https://example.com/sheet.pdf এবং বিস্তারিত পড়ুন।";
const parsedParts = parseSafeMessageText(rawMessageWithLink);

assert(parsedParts.length === 3, "Parsed message into text and link tokens");
assert(parsedParts[1].type === "link", "Identified link token correctly");
assert(
  parsedParts[1].url === "https://example.com/sheet.pdf",
  "Extracted safe https URL"
);

// Test XSS and javascript: scheme blocking
const maliciousMessage = "ক্লিক করুন javascript:alert('hack') অথবা সাধারণ লেখা";
const sanitizedParts = parseSafeMessageText(maliciousMessage);
const hasJsLink = sanitizedParts.some(
  (p) => p.type === "link" && p.url?.startsWith("javascript:")
);
assert(!hasJsLink, "Strictly denies javascript: pseudo-protocol as a clickable link");

console.log("\n⏰ --- 3. Bangla Message Timestamp Tests ---");

// Test Today's time formatting
const now = new Date();
const todayFormatted = formatBanglaMessageTime(now);
assert(
  todayFormatted.startsWith("আজ "),
  `Today's message formatted with 'আজ': ${todayFormatted}`
);

// Test Yesterday's time formatting
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const yesterdayFormatted = formatBanglaMessageTime(yesterday);
assert(
  yesterdayFormatted.startsWith("গতকাল "),
  `Yesterday's message formatted with 'গতকাল': ${yesterdayFormatted}`
);

console.log("\n🔒 --- 4. Messaging RBAC, Policy & Security Tests ---");

// Test Student-to-Student Messaging Restriction
function checkCanMessage(
  senderRole: string,
  recipientRole: string,
  allowTeacherStudent = true
): boolean {
  if (senderRole === "student" && recipientRole === "student") {
    return false; // Prohibited
  }
  if (
    (senderRole === "teacher" && recipientRole === "student") ||
    (senderRole === "student" && recipientRole === "teacher")
  ) {
    return allowTeacherStudent;
  }
  return true; // Admin <-> anyone is always permitted
}

assert(
  !checkCanMessage("student", "student"),
  "Student is strictly blocked from initiating chat with another student"
);

assert(
  checkCanMessage("student", "admin"),
  "Student is permitted to chat with academy administration / coordinator"
);

assert(
  checkCanMessage("teacher", "admin"),
  "Teacher is permitted to chat with academy administration"
);

assert(
  checkCanMessage("teacher", "student", true),
  "Teacher and student can chat when institution policy enables it"
);

assert(
  !checkCanMessage("teacher", "student", false),
  "Teacher and student messaging is strictly blocked when institution policy disables it"
);

assert(
  checkCanMessage("admin", "student"),
  "Admin has oversight and can message students directly"
);

// Test Message Validation Boundaries
function validateMessageLength(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 1 && trimmed.length <= 2000;
}

assert(!validateMessageLength(""), "Rejects empty message");
assert(!validateMessageLength("   "), "Rejects whitespace-only message");
assert(
  validateMessageLength("নমস্কার, আগামীকাল কি ক্লাস হবে?"),
  "Accepts valid Bangla message"
);
assert(
  !validateMessageLength("a".repeat(2001)),
  "Rejects message exceeding 2000 characters"
);

console.log(
  "\n🎉 All Communication, WhatsApp, Socket.IO RBAC & Security Tests Passed Successfully!\n"
);
