import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const metadata = {
  title: "ড্যাশবোর্ড | শিক্ষণ",
  description: "শিক্ষণ অ্যাডমিনিস্ট্রেটিভ ড্যাশবোর্ড",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
