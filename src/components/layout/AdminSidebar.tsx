"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  ClipboardList,
  UserCheck,
  MessageSquare,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  Bell,
  FileText,
  Sparkles,
  Globe,
  CreditCard,
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
  badge?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, mobileMenuOpen } = useAppSelector((state) => state.ui);
  const user = useAppSelector((state) => state.auth.user);

  const navGroups: NavGroup[] = [
    {
      groupName: "ওভারভিউ",
      items: [
        {
          href: "/admin",
          label: "ড্যাশবোর্ড ওভারভিউ",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupName: "শিক্ষার্থী ও ভর্তি",
      items: [
        {
          href: "/admin/students",
          label: "শিক্ষার্থী ব্যবস্থাপনা",
          icon: Users,
        },
        {
          href: "/admin/enrollments",
          label: "ভর্তি ও রূপান্তর",
          icon: GraduationCap,
        },
        {
          href: "/admin/payments",
          label: "মাসিক ফি ও কালেকশন",
          icon: CreditCard,
        },
      ],
    },
    {
      groupName: "অ্যাকাডেমিক ও ক্লাস",
      items: [
        {
          href: "/admin/teachers",
          label: "শিক্ষক ব্যবস্থাপনা",
          icon: UserCheck,
        },
        {
          href: "/admin/sessions",
          label: "শিক্ষাবর্ষ / সেশন",
          icon: Calendar,
        },
        {
          href: "/admin/batches",
          label: "ব্যাচ ও সময়সূচী",
          icon: BookOpen,
        },
        {
          href: "/admin/attendance",
          label: "ডিজিটাল হাজিরা",
          icon: CalendarCheck,
        },
        {
          href: "/admin/exams",
          label: "পরীক্ষা ও ফলাফল",
          icon: ClipboardList,
        },
      ],
    },
    {
      groupName: "কনটেন্ট ও যোগাযোগ",
      items: [
        {
          href: "/admin/notices",
          label: "নোটিশ বোর্ড",
          icon: Bell,
        },
        {
          href: "/admin/blog",
          label: "ব্লগ ও প্রবন্ধ",
          icon: FileText,
        },
        {
          href: "/admin/events",
          label: "ইভেন্ট ও অনুষ্ঠান",
          icon: Sparkles,
        },
        {
          href: "/admin/messages",
          label: "ইনবক্স ও মেসেজ",
          icon: MessageSquare,
        },
      ],
    },
    {
      groupName: "সিস্টেম",
      items: [
        {
          href: "/admin/profile",
          label: "আমার প্রোফাইল",
          icon: UserCheck,
        },
        {
          href: "/admin/settings",
          label: "সিস্টেম সেটিংস",
          icon: Settings,
        },
      ],
    },
  ];

  const handleLinkClick = () => {
    if (mobileMenuOpen) {
      dispatch(setMobileMenuOpen(false));
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header / Brand Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <Link
          href="/admin"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
            <Image
              src="/images/logo.png"
              alt={bn.institution.shortName}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-[#00636b] truncate leading-tight">
                {bn.institution.name}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                অ্যাডমিন প্যানেল
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={() => dispatch(setMobileMenuOpen(false))}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="সাইডবার বন্ধ করুন"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label={sidebarCollapsed ? "সাইডবার বড় করুন" : "সাইডবার ছোট করুন"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!sidebarCollapsed && (
              <h5 className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none mb-1">
                {group.groupName}
              </h5>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors select-none group relative",
                    isActive
                      ? "bg-[#eff8f9] text-[#00636b] font-bold"
                      : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                    sidebarCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-[#00636b]"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />

                  {!sidebarCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!sidebarCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#c27a29] text-white shrink-0">
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#00636b] rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / User Profile Summary */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <div
          className={cn(
            "flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs",
            sidebarCollapsed && "justify-center p-1.5"
          )}
        >
          <Link
            href="/admin/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition group"
            title="প্রোফাইল দেখুন"
          >
            <div className="h-8 w-8 rounded-full bg-[#00636b] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {user?.fullName?.charAt(0) || "শি"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate group-hover:text-[#00636b] transition-colors">
                  {user?.fullName || "অ্যাডমিনিস্ট্রেটর"}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {user?.phone || "০১৯৮২৭০৫৬৪৬"}
                </span>
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="p-1.5 text-slate-400 hover:text-[#00636b] hover:bg-teal-50 rounded-md transition"
                title="মূল ওয়েবসাইট দেখুন"
                aria-label="মূল ওয়েবসাইট"
              >
                <Globe className="h-4 w-4" />
              </Link>
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                  } catch {}
                  dispatch(logout());
                  window.location.href = "/";
                }}
                className="p-1.5 text-slate-400 hover:text-[#c22126] hover:bg-rose-50 rounded-md transition cursor-pointer"
                title={bn.auth.logout}
                aria-label={bn.auth.logout}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed left-0 top-0 bottom-0 z-30 transition-all duration-200 ease-in-out",
          sidebarCollapsed ? "w-18" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => dispatch(setMobileMenuOpen(false))}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[85vw] transition-transform duration-200 ease-in-out shadow-2xl",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
