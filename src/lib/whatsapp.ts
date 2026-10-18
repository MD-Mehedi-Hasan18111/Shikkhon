/**
 * WhatsApp Helper Utilities
 * Provides international click-to-chat formatting (https://wa.me/...)
 * with Bangla digit normalization, validation, and safe URL encoding.
 */

const banglaToAsciiDigits: Record<string, string> = {
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
 * Normalizes phone number strings by replacing Bengali numerals and stripping non-digit characters.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  const converted = rawPhone.replace(/[০-৯]/g, (ch) => banglaToAsciiDigits[ch] || ch);
  return converted.replace(/\D/g, "");
}

/**
 * Formats a phone number for WhatsApp international standard (E.164 without leading plus).
 * For Bangladeshi numbers (013-019), transforms '01XXXXXXXXX' to '8801XXXXXXXXX'.
 */
export function formatWhatsAppNumber(phone: string): string {
  const digits = normalizePhoneNumber(phone);
  if (!digits) return "";

  // Bangladeshi 11-digit local format: 01XXXXXXXXX -> 8801XXXXXXXXX
  if (digits.length === 11 && digits.startsWith("01")) {
    return `88${digits}`;
  }

  // Already prefixed with Bangladesh country code: 8801XXXXXXXXX (13 digits)
  if (digits.length === 13 && digits.startsWith("8801")) {
    return digits;
  }

  // International number (10 to 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return "";
}

/**
 * Validates whether a phone number can generate a working WhatsApp click-to-chat link.
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const formatted = formatWhatsAppNumber(phone);
  return Boolean(formatted && formatted.length >= 10 && formatted.length <= 15);
}

export interface WhatsAppLinkOptions {
  phone: string;
  message?: string;
}

export const DEFAULT_WHATSAPP_ADMISSION_MESSAGE =
  "আসসালামু আলাইকুম, আমি কোচিং এ ভর্তির ব্যাপারে তথ্য জানতে চাচ্ছি।";

export const DEFAULT_WHATSAPP_GENERAL_MESSAGE =
  "আসসালামু আলাইকুম, আমি শিক্ষণ একাডেমিক কেয়ার সম্পর্কে জানতে আগ্রহী।";

/**
 * Generates an official wa.me click-to-chat URL.
 * Never claims a message was sent; purely facilitates launching WhatsApp securely.
 */
export function generateWhatsAppLink({ phone, message }: WhatsAppLinkOptions): string {
  const formattedNumber = formatWhatsAppNumber(phone);
  if (!formattedNumber) {
    return "";
  }

  const base = `https://wa.me/${formattedNumber}`;
  if (message && message.trim()) {
    const encoded = encodeURIComponent(message.trim());
    return `${base}?text=${encoded}`;
  }

  return base;
}
