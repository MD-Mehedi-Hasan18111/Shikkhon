/**
 * Database utility helpers for normalization, indexing, and slug generation
 */

const banglaToEnglishDigitsMap: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

/**
 * Convert Bangla numeral characters to English digits (0-9)
 */
export function convertBanglaDigitsToEnglish(input: string): string {
  if (!input) return "";
  return input.replace(/[০-৯]/g, (digit) => banglaToEnglishDigitsMap[digit] || digit);
}

/**
 * Normalize Bangladeshi phone number to 11-digit format (e.g. 01711234567)
 * Converts Bangla digits, strips +88, 88, spaces, and hyphens.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = convertBanglaDigitsToEnglish(phone.trim());
  // Remove non-digit characters
  cleaned = cleaned.replace(/\D/g, "");

  // Strip international prefix 88 or +88
  if (cleaned.startsWith("880")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("88") && cleaned.length === 13) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Validates whether a phone number is an 11-digit valid Bangladeshi mobile number
 */
export function isValidBangladeshiPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^01[3-9]\d{8}$/.test(normalized);
}

/**
 * Normalize email to lowercase and trim
 */
export function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const cleaned = email.trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Normalize a date to midnight UTC (00:00:00.000) for attendance and daily indexing
 */
export function normalizeDateToStartOfDay(dateInput: Date | string | number): Date {
  const d = new Date(dateInput);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}

/**
 * Generate a URL-friendly slug from English or Bengali text
 */
export function generateSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "") // Allow Bengali unicode characters \u0980-\u09FF
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Common schema transformation options to remove internal fields (__v)
 */
export const defaultSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
};
