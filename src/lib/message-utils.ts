import { toBanglaNumber } from "@/lib/utils";

const banglaMonthsShort = [
  "জানু",
  "ফেব্রু",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টে",
  "অক্টো",
  "নভে",
  "ডিসে",
];

/**
 * Format time of day in natural Bangladeshi style (সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত)
 */
export function formatBanglaTimeOfDay(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const minuteStr = toBanglaNumber(minutes.toString().padStart(2, "0"));

  let period = "রাত";
  let hour12 = hours % 12 || 12;

  if (hours >= 4 && hours < 6) {
    period = "ভোর";
  } else if (hours >= 6 && hours < 12) {
    period = "সকাল";
  } else if (hours >= 12 && hours < 15) {
    period = "দুপুর";
  } else if (hours >= 15 && hours < 18) {
    period = "বিকাল";
  } else if (hours >= 18 && hours < 20) {
    period = "সন্ধ্যা";
  } else {
    period = "রাত";
  }

  const hourStr = toBanglaNumber(hour12);
  return `${period} ${hourStr}:${minuteStr}`;
}

/**
 * Formats a message timestamp into user-friendly Bangla:
 * - "আজ বিকাল ৪:২০"
 * - "গতকাল রাত ৮:১৫"
 * - "১৭ অক্টো, সকাল ১০:০০"
 * - "১২ মার্চ ২০২৫, বিকাল ৩:৩০"
 */
export function formatBanglaMessageTime(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const timeStr = formatBanglaTimeOfDay(date);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `আজ ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `গতকাল ${timeStr}`;
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  const day = toBanglaNumber(date.getDate());
  const month = banglaMonthsShort[date.getMonth()];

  if (isSameYear) {
    return `${day} ${month}, ${timeStr}`;
  }

  const year = toBanglaNumber(date.getFullYear());
  return `${day} ${month} ${year}, ${timeStr}`;
}

/**
 * Escapes HTML characters to prevent XSS attacks while allowing safe text rendering
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface TextPart {
  type: "text" | "link";
  content: string;
  url?: string;
}

/**
 * Parses message text safely, extracting secure links (http/https only)
 * and avoiding injection of arbitrary HTML/JS.
 */
export function parseSafeMessageText(rawText: string): TextPart[] {
  if (!rawText) return [];

  // Match URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(rawText)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: rawText.substring(lastIndex, match.index),
      });
    }

    const matchedUrl = match[0];
    // Validate that it's strictly http or https
    try {
      const parsed = new URL(matchedUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        parts.push({
          type: "link",
          content: matchedUrl,
          url: matchedUrl,
        });
      } else {
        parts.push({
          type: "text",
          content: matchedUrl,
        });
      }
    } catch {
      parts.push({
        type: "text",
        content: matchedUrl,
      });
    }

    lastIndex = match.index + matchedUrl.length;
  }

  // Remaining text
  if (lastIndex < rawText.length) {
    parts.push({
      type: "text",
      content: rawText.substring(lastIndex),
    });
  }

  return parts;
}

/**
 * Format message time in 12-hour format with AM/PM (e.g., "০৩:৪৫ PM")
 */
export function formatMessageTime12h(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  const hourStr = toBanglaNumber(hour12.toString().padStart(2, "0"));
  const minStr = toBanglaNumber(minutes.toString().padStart(2, "0"));

  return `${hourStr}:${minStr} ${period}`;
}

/**
 * Format date group header for chat message history (like Facebook Messenger):
 * - "আজ" (Today)
 * - "গতকাল" (Yesterday)
 * - "১৮ অক্টোবর ২০২৬"
 */
export function formatDateGroupHeader(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "আজ";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "গতকাল";

  const banglaMonthsFull = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];

  const day = toBanglaNumber(date.getDate());
  const month = banglaMonthsFull[date.getMonth()];
  const year = toBanglaNumber(date.getFullYear());

  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${month}`;
  }

  return `${day} ${month} ${year}`;
}

/**
 * Check if message is within the 1-day (24 hours) edit window
 */
export function canEditMessage(createdAt: Date | string | number): boolean {
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return false;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Date.now() - date.getTime() <= oneDayMs;
}

