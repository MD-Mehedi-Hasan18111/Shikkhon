import { UserRole, BloodGroup } from "@/config/constants";

export interface IUser {
  _id: string;
  phone: string;
  fullName: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentProfile {
  _id: string;
  userId: string | IUser;
  studentIdNumber: string; // e.g. CMS-2026-001
  institutionName: string; // School or College name
  academicClass: string; // e.g., Class 10, HSC 1st Year, HSC Examinee
  academicGroup?: "science" | "humanities" | "business_studies" | "general";
  bloodGroup?: BloodGroup;
  dateOfBirth?: string;
  gender: "male" | "female" | "other";
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string; // পিতা, মাতা, অভিভাবক
  presentAddress: string;
  permanentAddress?: string;
  enrolledBatchIds: string[];
  monthlyTuitionFee: number;
  discountPercentage?: number;
  notes?: string;
}
