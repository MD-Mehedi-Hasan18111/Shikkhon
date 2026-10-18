"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  CalendarCheck,
  Award,
  Bell,
  MessageSquare,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSidebar, setMobileMenuOpen } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { bn } from "@/config/bangla-strings";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function StudentSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, mobileMenuOpen } = useAppSelector((state) => state.ui);
  const user = useAppSelector((state) => state.auth.user);

  const navGroups: NavGroup[] = [
    {
      groupName: "ওভারভিউ",
      items: [
        {
          href: "/dashboard/student",
          label: "ড্যাশবোর্ড",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupName: "আমার পড়াশোনা",
      items: [
        {
          href: "/dashboard/student/profile",
          label: "আমার প্রোফাইল ও অভিভাবক",
          icon: UserCheck,
        },
        {
          href: "/dashboard/student/batches",
          label: "আমার ব্যাচ ও শিক্ষক",
          icon: BookOpen,
        },
        {
          href: "/dashboard/student/attendance",
          label: "হাজিরা ও উপস্থিতি",
          icon: CalendarCheck,
        },
        {
          href: "/dashboard/student/results",
          label: "পরীক্ষার ফলাফল",
          icon: Award,
        },
      ],
    },
    {
      groupName: "একাডেমি ও যোগাযোগ",
      items: [
        {
          href: "/dashboard/student/notices",
          label: "বিজ্ঞপ্তি ও কর্মসূচি",
          icon: Bell,
        },
        {
          href: "/dashboard/student/messages",
          label: "বার্তা ও শিক্ষক সহায়তা",
          icon: MessageSquare,
        },
      ],
    },
    {
      groupName: "অ্যাকাউন্ট",
      items: [
        {
          href: "/dashboard/student/security",
          label: "পাসওয়ার্ড ও নিরাপত্তা",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors
    }
    dispatch(logout());
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => dispatch(setMobileMenuOpen(false))}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ease-in-out",
          sidebarCollapsed ? "w-18" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white">
          <Link
            href="/dashboard/student"
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="h-9 w-9 rounded-xl bg-primary-800 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              <GraduationCap className="h-5 w-5 text-primary-200" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm text-primary-900 tracking-tight truncate leading-tight">
                  {bn.institution.name}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  শিক্ষার্থী পোর্টাল
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {group.groupName}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => dispatch(setMobileMenuOpen(false))}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition select-none group",
                      isActive
                        ? "bg-primary-800 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      sidebarCollapsed && "justify-center px-0"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer: User Info & Collapse Toggle */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.fullName?.slice(0, 1) || "শি"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user?.fullName || "শিক্ষার্থী"}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono">
                  {user?.phone}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="লগআউট"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="লগআউট"
              className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
