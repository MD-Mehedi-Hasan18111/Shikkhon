import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const banglaDigits: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

/**
 * Convert English number or string with digits to Bangla numerals
 */
export function toBanglaNumber(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/[0-9]/g, (digit) => banglaDigits[digit] || digit);
}

/**
 * Format currency in Bangladeshi Taka (BDT) with Bangla numerals
 */
export function formatBanglaCurrency(amount: number): string {
  const formattedNumber = new Intl.NumberFormat("en-IN").format(amount);
  return `৳ ${toBanglaNumber(formattedNumber)}`;
}

const banglaMonths = [
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

const banglaDays = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

/**
 * Format a date in standard Bangladeshi representation (e.g., ১৭ অক্টোবর, ২০২৬)
 */
export function formatBanglaDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const day = toBanglaNumber(date.getDate());
  const month = banglaMonths[date.getMonth()];
  const year = toBanglaNumber(date.getFullYear());

  return `${day} ${month}, ${year}`;
}

/**
 * Format full date with day of week (e.g., শনিবার, ১৭ অক্টোবর ২০২৬)
 */
export function formatBanglaDateFull(
  dateInput: Date | string | number = new Date()
): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const dayName = banglaDays[date.getDay()];
  const day = toBanglaNumber(date.getDate());
  const month = banglaMonths[date.getMonth()];
  const year = toBanglaNumber(date.getFullYear());

  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Format 11-digit phone number with Bangladeshi standard spacing (e.g., ০১৭১১-XXXXXX)
 */
export function formatBanglaPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    const formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return toBanglaNumber(formatted);
  }
  return toBanglaNumber(phone);
}

/**
 * Convert 24-hour (e.g. "16:00") or 12-hour (e.g. "4:00 PM") time string to standard 12-hour format with AM/PM (e.g. "04:00 PM")
 */
export function formatTo12h(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const trimmed = String(timeStr).trim().toUpperCase();

  // If already contains AM or PM (e.g. "04:00 PM", "4:30PM", "11:00 AM")
  if (trimmed.includes("AM") || trimmed.includes("PM")) {
    const parts = trimmed.split(/\s+/);
    const timePart = parts[0];
    const period = parts[1] || (trimmed.endsWith("PM") ? "PM" : "AM");
    const [h, m = "00"] = timePart.split(":");
    let hourNum = parseInt(h, 10);
    if (isNaN(hourNum)) return trimmed;
    if (hourNum === 0) hourNum = 12;
    if (hourNum > 12) hourNum = hourNum % 12 || 12;
    const hourStr = hourNum.toString().padStart(2, "0");
    const minStr = (parseInt(m, 10) || 0).toString().padStart(2, "0");
    return `${hourStr}:${minStr} ${period}`;
  }

  // If 24-hour format "HH:mm"
  if (trimmed.includes(":")) {
    const [h, m = "00"] = trimmed.split(":");
    const hourNum = parseInt(h, 10);
    const minNum = parseInt(m, 10) || 0;
    if (isNaN(hourNum)) return String(timeStr);

    const period = hourNum >= 12 ? "PM" : "AM";
    let hour12 = hourNum % 12;
    if (hour12 === 0) hour12 = 12;

    const hourStr = hour12.toString().padStart(2, "0");
    const minStr = minNum.toString().padStart(2, "0");
    return `${hourStr}:${minStr} ${period}`;
  }

  return String(timeStr);
}

