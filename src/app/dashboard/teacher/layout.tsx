import React from "react";
import { TeacherDashboardShell } from "@/components/layout/TeacherDashboardShell";

export const metadata = {
  title: "শিক্ষক পোর্টাল | শিক্ষণ একাডেমিক কেয়ার",
  description: "কোচিং সেন্টারের সম্মানিত শিক্ষক ও মেন্টরদের ড্যাশবোর্ড",
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <TeacherDashboardShell>{children}</TeacherDashboardShell>;
}
