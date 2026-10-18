export type DayOfWeek =
  "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export interface IClassSchedule {
  day: DayOfWeek;
  startTime: string; // e.g., "16:00"
  endTime: string; // e.g., "17:30"
  roomNo?: string;
}

export interface IBatch {
  _id: string;
  name: string; // e.g. "HSC-26 ফিজিক্স স্পেশাল - ব্যাচ ১"
  code: string; // e.g. "PHY-26-A"
  courseId: string;
  assignedTeacherIds: string[];
  schedule: IClassSchedule[];
  maxCapacity: number;
  currentEnrolledCount: number;
  startDate: string;
  endDate?: string;
  monthlyFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
