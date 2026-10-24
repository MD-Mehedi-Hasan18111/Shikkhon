import { Types } from "mongoose";

// ==========================================
// 1. User & Auth Types
// ==========================================
export type UserRole =
  "super_admin" | "admin" | "teacher" | "student" | "guardian" | "staff";

export interface IUser {
  _id: Types.ObjectId | string;
  phone: string;
  email?: string;
  password?: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 2. Student Types
// ==========================================
export type AcademicClassLevel =
  | "class_6"
  | "class_7"
  | "class_8"
  | "class_9"
  | "class_10"
  | "hsc_1st"
  | "hsc_2nd"
  | "alim_1st"
  | "alim_2nd"
  | "admission";

export type AcademicGroup = "science" | "humanities" | "business_studies" | "general";
export type StudentStatus = "active" | "inactive" | "graduated" | "suspended";

export interface IStudentGuardian {
  name: string;
  phone: string;
  relation: string;
  occupation?: string;
}

export interface IStudentAddress {
  present: string;
  permanent?: string;
}

export interface IStudent {
  _id: Types.ObjectId | string;
  studentId: string; // e.g. "S-2026-0001"
  userId?: Types.ObjectId | string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  institutionName: string;
  classLevel: AcademicClassLevel;
  academicGroup: AcademicGroup;
  bloodGroup?: string;
  dateOfBirth?: Date;
  gender: "male" | "female" | "other";
  guardian: IStudentGuardian;
  address: IStudentAddress;
  enrollmentDate: Date;
  status: StudentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 3. Teacher Types
// ==========================================
export interface ITeacher {
  _id: Types.ObjectId | string;
  teacherCode: string; // e.g. "T-101"
  userId?: Types.ObjectId | string;
  fullName: string;
  phone: string;
  email?: string;
  qualifications: string[];
  subjects: string[];
  biography?: string;
  joiningDate: Date;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 4. AcademicSession Types
// ==========================================
export type SessionStatus = "upcoming" | "active" | "completed" | "archived";

export interface IAcademicSession {
  _id: Types.ObjectId | string;
  name: string; // e.g. "২০২৬ শিক্ষাবর্ষ"
  code: string; // e.g. "SESSION-2026"
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: SessionStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 5. Batch Types
// ==========================================
export type BatchStatus = "upcoming" | "active" | "completed" | "cancelled" | "archived";
export type DayOfWeek =
  "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export interface IClassScheduleItem {
  day: DayOfWeek;
  startTime: string; // "16:00"
  endTime: string; // "17:30"
  roomNo?: string;
}

export interface IBatch {
  _id: Types.ObjectId | string;
  name: string;
  code: string; // e.g. "SSC-26-MATH"
  classLevel: AcademicClassLevel;
  academicSession: Types.ObjectId | string;
  assignedTeachers: (Types.ObjectId | string)[];
  subjects: string[];
  schedule: IClassScheduleItem[];
  roomOrOnlineDetails?: string;
  capacity: number;
  monthlyFee: number;
  status: BatchStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 6. Enrollment Types
// ==========================================
export type EnrollmentStatus = "active" | "completed" | "cancelled" | "transferred";

export interface IEnrollment {
  _id: Types.ObjectId | string;
  student: Types.ObjectId | string;
  batch: Types.ObjectId | string;
  academicSession: Types.ObjectId | string;
  enrollmentDate: Date;
  rollNumber?: string;
  feeDiscountPercent: number;
  status: EnrollmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 7. Attendance Types
// ==========================================
export type AttendanceRecordStatus = "present" | "absent" | "late" | "excused";

export interface IAttendance {
  _id: Types.ObjectId | string;
  student: Types.ObjectId | string;
  batch: Types.ObjectId | string;
  classDate: Date; // normalized to start of day UTC
  status: AttendanceRecordStatus;
  remarks?: string;
  recordedBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 8. Exam Types
// ==========================================
export type ExamType = "weekly" | "monthly" | "model_test" | "term";
export type ExamPublicationStatus = "draft" | "published" | "archived";

export interface IExam {
  _id: Types.ObjectId | string;
  batch: Types.ObjectId | string;
  subject: string;
  title: string;
  examDate: Date;
  maximumMarks: number;
  passMarks?: number;
  examType: ExamType;
  publicationStatus: ExamPublicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 9. Result Types
// ==========================================
export interface IResult {
  _id: Types.ObjectId | string;
  exam: Types.ObjectId | string;
  student: Types.ObjectId | string;
  obtainedMarks: number;
  highestMarksInBatch?: number;
  grade?: string;
  feedback?: string;
  publicationStatus: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 10. Notice Types
// ==========================================
export type NoticeVisibility = "public" | "students" | "teachers" | "all";
export type NoticePriority = "normal" | "important" | "urgent";

export interface INotice {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  content: string; // Bangla HTML / Markdown
  summary?: string;
  publishedAt: Date;
  expiresAt?: Date;
  visibility: NoticeVisibility;
  priority: NoticePriority;
  isPinned: boolean;
  author: Types.ObjectId | string;
  status: "draft" | "published" | "archived";
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 11. BlogPost Types
// ==========================================
export interface IBlogPost {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  summary: string;
  content: string; // Bangla HTML / Markdown
  coverImage?: string;
  images?: string[];
  author: Types.ObjectId | string;
  tags: string[];
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 12. Event Types
// ==========================================
export type EventStatus = "draft" | "published" | "completed" | "cancelled";

export interface IEvent {
  _id: Types.ObjectId | string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  startDate: Date;
  endDate?: Date;
  coverImage?: string;
  images?: string[];
  status: EventStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 13. SiteSettings Types
// ==========================================
export interface ISiteSettings {
  _id: Types.ObjectId | string;
  key: string; // Singleton "main"
  institutionName: string;
  shortName: string;
  motto: string;
  logoUrl?: string;
  bannerUrl?: string;
  phones: string[];
  email: string;
  address: string;
  socialLinks: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
  whatsAppNumber?: string;
  whatsAppPrefillMessage?: string;
  isWhatsAppEnabled?: boolean;
  allowTeacherStudentMessaging?: boolean;
  admissionNotice?: string;
  isAdmissionOpen: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  aboutTitle?: string;
  aboutText?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 13.1. Admission Inquiry Types
// ==========================================
export type InquiryStatus = "pending" | "contacted" | "enrolled" | "cancelled";

export interface IInquiry {
  _id: Types.ObjectId | string;
  fullName: string;
  phone: string;
  guardianPhone?: string;
  classLevel: AcademicClassLevel;
  previousSchool?: string;
  message?: string;
  status: InquiryStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 14. Conversation & Message Types
// ==========================================
export type ConversationType = "direct" | "batch_group";

export interface IConversation {
  _id: Types.ObjectId | string;
  participants: (Types.ObjectId | string)[];
  type: ConversationType;
  batch?: Types.ObjectId | string;
  title?: string;
  lastMessage?: {
    text: string;
    sender: Types.ObjectId | string;
    sentAt: Date;
  };
  status: "active" | "archived";
  deletedFor?: (Types.ObjectId | string)[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageAttachment {
  url: string;
  fileName: string;
  fileType: string;
  sizeBytes?: number;
}

export interface IMessage {
  _id: Types.ObjectId | string;
  conversation: Types.ObjectId | string;
  sender: Types.ObjectId | string;
  text: string;
  imageUrl?: string;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  attachments?: IMessageAttachment[];
  readBy: (Types.ObjectId | string)[];
  status: "sent" | "delivered" | "read";
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 15. Student Monthly Payment & Fee Types
// ==========================================
export type PaymentStatus = "paid" | "partial" | "due";
export type PaymentMethod = "cash" | "bkash" | "nagad" | "rocket" | "bank" | "other";

export interface IPayment {
  _id: Types.ObjectId | string;
  student: Types.ObjectId | string;
  batch: Types.ObjectId | string;
  academicSession?: Types.ObjectId | string;
  classLevel: AcademicClassLevel;
  month: number; // 1 to 12 (January = 1, December = 12)
  year: number; // e.g. 2026
  feeAmount: number;
  discountAmount: number;
  payableAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  receiptNumber?: string;
  paidAt?: Date;
  recordedBy?: Types.ObjectId | string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
