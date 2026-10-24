"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  Sparkles,
  BookOpen,
  CheckCheck,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleMobileMenu } from "@/store/slices/uiSlice";
import { logout } from "@/store/slices/authSlice";
import { addNotification } from "@/store/slices/notificationSlice";
import { Badge } from "@/components/ui/Badge";
import { formatBanglaDateFull, toBanglaNumber, formatBanglaDate } from "@/lib/utils";
import { bn } from "@/config/bangla-strings";

export function AdminTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isTeacherPortal = pathname?.startsWith("/dashboard/teacher") ?? false;
  const isStudentPortal = pathname?.startsWith("/dashboard/student") ?? false;

  const isTeacher = user?.role === "teacher" || isTeacherPortal;
  const isStudent = user?.role === "student" || user?.role === "guardian" || isStudentPortal;
  const isAdmin = !isTeacher && !isStudent;

  const roleFallbackText = isTeacher
    ? "Teacher"
    : isStudent
    ? "Student"
    : "অ্যাডমিনিস্ট্রেটর";

  const headerDisplayName = user?.fullName || roleFallbackText;

  const profileHref = isTeacher
    ? "/dashboard/teacher/profile"
    : isStudent
    ? "/dashboard/student/profile"
    : "/admin/profile";

  const roleBadgeText = isTeacher
    ? "Teacher"
    : isStudent
    ? "Student"
    : user?.role
    ? bn.userRoles[user.role] || "অ্যাডমিনিস্ট্রেটর"
    : "অ্যাডমিনিস্ট্রেটর";

  // Notification Center for Teachers and Students
  const isTeacherOrStudent = isTeacher || isStudent;
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = useCallback(() => {
    if (!isTeacherOrStudent) return;
    setLoadingNotifications(true);
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setNotificationsList(json.data.notifications || []);
          setUnreadNotificationsCount(json.data.unreadCount || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingNotifications(false));
  }, [isTeacherOrStudent]);

  useEffect(() => {
    if (isTeacherOrStudent) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [isTeacherOrStudent, fetchNotifications]);

  const handleNotificationClick = async (item: any) => {
    setNotificationDropdownOpen(false);
    if (!item.isRead) {
      // Optimistic update
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));

      // Call API
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityId: item.entityId,
            entityType: item.type,
          }),
        });
      } catch {}
    }
    router.push(item.link);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notificationsList.filter((n) => !n.isRead).map((n) => n.entityId);
    if (unreadIds.length === 0) return;

    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotificationsCount(0);

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          all: true,
          entityIds: unreadIds,
        }),
      });
    } catch {}
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

        {/* Notifications Icon (For Teachers and Students) */}
        {isTeacherOrStudent && (
          <div className="relative">
            <button
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-hidden"
              aria-label="নোটিফিকেশন দেখুন"
              title="নোটিফিকেশন"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white shadow-2xs animate-in zoom-in-50">
                  {toBanglaNumber(unreadNotificationsCount)}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {notificationDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setNotificationDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-40 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-150">
                  {/* Header */}
                  <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">নোটিফিকেশন</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                          {toBanglaNumber(unreadNotificationsCount)} টি নতুন
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#00636b] hover:underline font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="h-3 w-3" />
                        <span>সব পঠিত করুন</span>
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {loadingNotifications ? (
                      <div className="p-6 text-center text-slate-400">
                        লোডিং হচ্ছে...
                      </div>
                    ) : notificationsList.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <Inbox className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
                        <p className="text-xs">কোনো নোটিফিকেশন নেই</p>
                      </div>
                    ) : (
                      notificationsList.map((item) => {
                        const isUnread = !item.isRead;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition select-none ${
                              isUnread ? "bg-teal-50/40" : ""
                            }`}
                          >
                            {/* Category Icon */}
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                                item.type === "notice"
                                  ? "bg-amber-100 text-amber-800"
                                  : item.type === "event"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-teal-100 text-[#00636b]"
                              }`}
                            >
                              {item.type === "notice" ? (
                                <Bell className="h-4 w-4" />
                              ) : item.type === "event" ? (
                                <Sparkles className="h-4 w-4" />
                              ) : (
                                <BookOpen className="h-4 w-4" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    item.type === "notice"
                                      ? "bg-amber-100 text-amber-800"
                                      : item.type === "event"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-teal-100 text-[#00636b]"
                                  }`}
                                >
                                  {item.typeName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {formatBanglaDate(item.createdAt)}
                                </span>
                              </div>
                              <h5
                                className={`text-xs leading-snug line-clamp-2 ${
                                  isUnread
                                    ? "font-bold text-slate-900"
                                    : "font-medium text-slate-600"
                                }`}
                              >
                                {item.title}
                              </h5>
                            </div>

                            {/* Unread Indicator */}
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-[#00636b] mt-1 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-lg hover:bg-slate-100 transition select-none"
            aria-expanded={userDropdownOpen}
          >
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 leading-tight block">
                {headerDisplayName}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#00636b] text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user?.fullName?.charAt(0) || (isTeacher ? "T" : isStudent ? "S" : "অ্যা")
              )}
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
                    {user?.fullName || roleFallbackText}
                  </p>
                  {user?.phone ? (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                      {user.phone}
                    </p>
                  ) : user?.email ? (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user.email}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <Badge variant="primary" size="sm">
                      {roleBadgeText}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href={profileHref}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>আমার প্রোফাইল</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      <span>সিস্টেম সেটিংস</span>
                    </Link>
                  )}
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
