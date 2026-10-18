import React from "react";
import { StudentDashboardShell } from "@/components/layout/StudentDashboardShell";

export const metadata = {
  title: "শিক্ষার্থী পোর্টাল | শিক্ষণ একাডেমিক কেয়ার",
  description: "শিক্ষার্থীর ব্যক্তিগত প্রোফাইল, ফলাফল, রুটিন ও হাজিরা ট্র্যাকিং",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentDashboardShell>{children}</StudentDashboardShell>;
}
