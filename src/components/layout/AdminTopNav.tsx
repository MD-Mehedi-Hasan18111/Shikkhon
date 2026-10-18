"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Calendar,
  Globe,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleMobileMenu } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { addNotification } from "@/store/slices/notificationSlice";
import { Badge } from "@/components/ui/Badge";
import { formatBanglaDateFull } from "@/lib/utils";
import { bn } from "@/config/bangla-strings";

export function AdminTopNav() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleTestNotification = () => {
    dispatch(
      addNotification({
        type: "info",
        title: "নোটিফিকেশন সেন্টার",
        message: "সিস্টেমে কোনো নতুন নোটিশ নেই। সবকিছু স্বাভাবিকভাবে চলছে।",
      })
    );
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile menu button */}
        <button
          onClick={() => dispatch(toggleMobileMenu())}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="মেনু খুলুন"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="শিক্ষার্থী, রোল বা ব্যাচ অনুসন্ধান করুন..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#00636b] focus:outline-none focus:ring-1 focus:ring-[#00636b] transition-all"
          />
        </div>
      </div>

      {/* Right: Date, Notifications & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Today's Date in Bengali */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 select-none">
          <Calendar className="h-3.5 w-3.5 text-[#00636b]" />
          <span className="font-medium">{formatBanglaDateFull()}</span>
        </div>

        {/* Go to public website button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#00636b] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition"
          title="পাবলিক ওয়েবসাইটে যান"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">মূল ওয়েবসাইট</span>
        </Link>

        {/* Notifications Icon */}
        <button
          onClick={handleTestNotification}
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          aria-label="নোটিফিকেশন দেখুন"
          title="নোটিফিকেশন"
        >
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#c22126] ring-2 ring-white" />
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-lg hover:bg-slate-100 transition select-none"
            aria-expanded={userDropdownOpen}
          >
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 leading-tight block">
                {user?.fullName || "অ্যাডমিনিস্ট্রেটর"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#00636b] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.fullName?.charAt(0) || "শি"}
            </div>
          </button>

          {/* User Dropdown Overlay */}
          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-40 text-xs animate-in fade-in duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-800 truncate">
                    {user?.fullName || "অ্যাডমিনিস্ট্রেটর"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {user?.phone || "০১৯৮২৭০৫৬৪৬"}
                  </p>
                  <div className="mt-2">
                    <Badge variant="primary" size="sm">
                      {user?.role ? bn.userRoles[user.role] : "প্রধান প্রশাসক"}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>আমার প্রোফাইল</span>
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>সিস্টেম সেটিংস</span>
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-[#00636b] hover:bg-teal-50 transition font-medium"
                  >
                    <Globe className="h-3.5 w-3.5 text-[#00636b]" />
                    <span>মূল ওয়েবসাইটে যান</span>
                  </Link>
                  <Link
                    href="/#contact"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    <span>সহায়তা ও গাইড</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      try {
                        await fetch("/api/auth/logout", { method: "POST" });
                      } catch {}
                      dispatch(logout());
                      window.location.href = "/";
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-[#c22126] hover:bg-rose-50 transition text-left cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{bn.auth.logout}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
