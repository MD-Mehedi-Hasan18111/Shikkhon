export const USER_ROLES = [
  "super_admin",
  "admin",
  "teacher",
  "student",
  "guardian",
  "staff",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS_BN: Record<UserRole, string> = {
  super_admin: "প্রধান প্রশাসক (Super Admin)",
  admin: "অ্যাডমিন (Admin)",
  teacher: "শিক্ষক (Teacher)",
  student: "শিক্ষার্থী (Student)",
  guardian: "অভিভাবক (Guardian)",
  staff: "কর্মকর্তা (Staff)",
};

export const ATTENDANCE_STATUS = ["present", "absent", "late", "excused"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const ATTENDANCE_LABELS_BN: Record<AttendanceStatus, string> = {
  present: "উপস্থিত",
  absent: "অনুপস্থিত",
  late: "দেরিতে উপস্থিত",
  excused: "ছুটি মঞ্জুর",
};

export const PAYMENT_METHODS = [
  "cash",
  "bkash",
  "nagad",
  "rocket",
  "bank_transfer",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS_BN: Record<PaymentMethod, string> = {
  cash: "নগদ (Cash)",
  bkash: "বিকাশ (bKash)",
  nagad: "নগদ (Nagad)",
  rocket: "রকেট (Rocket)",
  bank_transfer: "ব্যাংক ট্রান্সফার",
};

export const PAYMENT_STATUS = ["paid", "partial", "unpaid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_STATUS_LABELS_BN: Record<PaymentStatus, string> = {
  paid: "পরিশোধিত",
  partial: "আংশিক পরিশোধিত",
  unpaid: "বকেয়া",
  refunded: "ফেরতকৃত",
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
