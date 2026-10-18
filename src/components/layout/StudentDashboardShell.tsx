"use client";

import React from "react";
import { StudentSidebar } from "./StudentSidebar";
import { AdminTopNav } from "./AdminTopNav";
import { useAppSelector } from "@/store";
import { cn } from "@/lib/utils";

export interface StudentDashboardShellProps {
  children: React.ReactNode;
}

export function StudentDashboardShell({ children }: StudentDashboardShellProps) {
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Student Sidebar */}
      <StudentSidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-200 ease-in-out",
          sidebarCollapsed ? "lg:pl-18" : "lg:pl-64"
        )}
      >
        {/* Top Navigation */}
        <AdminTopNav />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
