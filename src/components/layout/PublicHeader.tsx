"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  PhoneCall,
  MapPin,
  LogIn,
  LogOut,
  Sparkles,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { bn } from "@/config/bangla-strings";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setCredentials, logout } from "@/store/slices/authSlice";
import { SocialMediaLinks } from "@/components/public/SocialMediaLinks";

interface PublicHeaderProps {
  settings?: any;
}

export function PublicHeader({ settings }: PublicHeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasTokenCookie, setHasTokenCookie] = useState(false);
  const [liveSettings, setLiveSettings] = useState(settings);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  // Sync when prop changes
  useEffect(() => {
    if (settings) {
      setLiveSettings(settings);
    }
  }, [settings]);

  // Sync on admin update event
  useEffect(() => {
    const fetchLatest = () => {
      fetch("/api/site-settings", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            setLiveSettings(json.data);
          }
        })
        .catch(() => {});
    };

    window.addEventListener("site-settings-updated", fetchLatest);
    return () => window.removeEventListener("site-settings-updated", fetchLatest);
  }, []);

  // Check auth session on mount to detect logged in user
  useEffect(() => {
    if (typeof document !== "undefined" && document.cookie.includes("auth_token=")) {
      setHasTokenCookie(true);
    }

    if (!auth.isAuthenticated || !auth.user) {
      fetch("/api/auth/me")
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data?.success && data?.data) {
            setHasTokenCookie(true);
            dispatch(
              setCredentials({
                user: {
                  id: data.data.id,
                  fullName: data.data.fullName,
                  phone: data.data.phone,
                  email: data.data.email,
                  role: data.data.role,
                  avatarUrl: data.data.avatarUrl,
                },
                token: "",
              })
            );
          } else {
            setHasTokenCookie(false);
          }
        })
        .catch(() => {
          setHasTokenCookie(false);
        });
    }
  }, [auth.isAuthenticated, auth.user, dispatch]);

  const activeSettings = liveSettings || settings;
  const institutionName = activeSettings?.institutionName || bn.institution.name;
  const institutionShortName = activeSettings?.shortName || activeSettings?.institutionName || "শিক্ষণ";
  const institutionLogoUrl = activeSettings?.logoUrl || "/images/logo.png";
  const institutionMotto = activeSettings?.motto || bn.institution.motto;
  const institutionAddress = activeSettings?.address || bn.institution.address;
  const contactPhone = activeSettings?.phones?.[0] || activeSettings?.contactPhone || bn.institution.phones[0];
  const socialLinks = activeSettings?.socialLinks || {};

  const currentUser = auth.user;
  const isLoggedIn = !!currentUser || hasTokenCookie;

  // Determine dashboard link based on role
  let dashboardHref = "/dashboard";
  let dashboardLabel = "ড্যাশবোর্ড";
  let roleBadgeLabel = "ব্যবহারকারী";

  if (currentUser?.role === "teacher") {
    dashboardHref = "/dashboard/teacher";
    dashboardLabel = "ড্যাশবোর্ড";
    roleBadgeLabel = "শিক্ষক";
  } else if (currentUser?.role === "student") {
    dashboardHref = "/dashboard/student";
    dashboardLabel = "ড্যাশবোর্ড";
    roleBadgeLabel = "শিক্ষার্থী";
  } else if (currentUser?.role === "guardian") {
    dashboardHref = "/dashboard/student";
    dashboardLabel = "ড্যাশবোর্ড";
    roleBadgeLabel = "অভিভাবক";
  } else if (
    currentUser?.role === "super_admin" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "staff"
  ) {
    dashboardHref = "/admin";
    dashboardLabel = "ড্যাশবোর্ড";
    roleBadgeLabel = "প্রশাসক";
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    dispatch(logout());
    setHasTokenCookie(false);
    window.location.href = "/";
  };

  // Top header menu with Notice, Events, and Blog
  const navLinks = [
    { href: "/", label: "হোম" },
    { href: "/about", label: "আমাদের সম্পর্কে" },
    { href: "/classes", label: "পাঠদান ও ব্যাচ" },
    { href: "/teachers", label: "শিক্ষকমণ্ডলী" },
    { href: "/notices", label: "নোটিশ" },
    { href: "/events", label: "ইভেন্ট" },
    { href: "/blog", label: "ব্লগ" },
    { href: "/admissions", label: "ভর্তি নির্দেশিকা" },
    { href: "/contact", label: "যোগাযোগ" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Banner Contact Bar */}
      <div className="bg-[#00383f] text-slate-200 text-xs py-2 px-3 sm:px-5 border-b border-[#002a2f]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Slogan & Address */}
          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-[#fde68a]">
              <Sparkles className="h-3 w-3 text-[#c27a29]" />
              {institutionMotto}
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <MapPin className="h-3 w-3 text-[#d7eef1]" />
              {institutionAddress}
            </span>
          </div>

          {/* Top Bar Right: Social Media Icons & Hotline Phone */}
          <div className="flex items-center gap-2 sm:gap-3">
            <SocialMediaLinks socialLinks={socialLinks} variant="topbar" />

            <a
              href={`tel:${contactPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-1 text-[#f7fee7] bg-[#65a30d]/85 hover:bg-[#65a30d] px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition shadow-2xs hover:shadow-xs"
              title={`হটলাইন: ${contactPhone}`}
            >
              <PhoneCall className="h-3 w-3" />
              <span>{contactPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2">
        {/* Logo and Name - Dynamic from Site Settings */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white border border-slate-200 p-1 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={institutionLogoUrl}
              alt={institutionShortName}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/images/logo.png";
              }}
            />
          </div>
          <span className="font-extrabold text-xl sm:text-2xl text-[#00636b] tracking-tight group-hover:text-[#004f56] transition leading-tight truncate max-w-[200px] sm:max-w-[280px]">
            {institutionShortName}
          </span>
        </Link>

        {/* Desktop Links (Optimized spacing for 9 items) */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-3 2xl:gap-4.5 text-[13px] xl:text-[13.5px] 2xl:text-sm font-semibold text-slate-700">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-1.5 py-1.5 transition-colors hover:text-[#00636b] relative select-none whitespace-nowrap",
                  isActive
                    ? "text-[#00636b] font-bold after:absolute after:bottom-0 after:left-1 after:right-1 after:h-0.5 after:bg-[#00636b] after:rounded-full"
                    : "text-slate-600"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons: Logged In vs Guest */}
        <div className="hidden sm:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link href={dashboardHref}>
                <Button
                  size="sm"
                  className="gap-2 bg-[#00636b] hover:bg-[#004f56] text-white font-semibold shadow-xs"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{dashboardLabel}</span>
                </Button>
              </Link>

              {currentUser && (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <span
                    className="text-xs font-semibold text-slate-700 max-w-[120px] truncate"
                    title={currentUser.fullName}
                  >
                    {currentUser.fullName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                    title="লগআউট"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1" />
                    <span>লগআউট</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-slate-300 font-semibold hover:border-[#00636b] hover:text-[#00636b]"
              >
                <LogIn className="h-4 w-4 text-[#00636b]" />
                <span>{bn.publicNav.login}</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle & Quick Button */}
        <div className="flex lg:hidden items-center gap-2">
          {isLoggedIn ? (
            <Link href={dashboardHref} className="sm:hidden">
              <Button
                size="sm"
                className="h-8 px-2.5 text-xs bg-[#00636b] text-white gap-1"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>ড্যাশবোর্ড</span>
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="sm:hidden">
              <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                {bn.publicNav.login}
              </Button>
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
            aria-label="মেনু খুলুন"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top duration-150">
          {/* User Profile bar in mobile menu if logged in */}
          {isLoggedIn && currentUser && (
            <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-950 truncate max-w-[160px]">
                    {currentUser.fullName}
                  </p>
                  <span className="text-[10px] text-teal-700 font-medium">
                    {roleBadgeLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-xs text-rose-600 font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-rose-50 border border-rose-200"
              >
                <LogOut className="h-3 w-3" />
                <span>লগআউট</span>
              </button>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-2.5 rounded-lg text-sm font-semibold transition",
                  pathname === link.href
                    ? "bg-[#eff8f9] text-[#00636b] font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isLoggedIn ? (
              <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center bg-[#00636b] hover:bg-[#004f56] text-white">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  <span>{dashboardLabel}</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  <LogIn className="h-4 w-4 mr-2 text-[#00636b]" />
                  {bn.publicNav.login}
                </Button>
              </Link>
            )}

            {socialLinks && Object.values(socialLinks).some(Boolean) && (
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] font-medium text-slate-500">সোশ্যাল মিডিয়া:</span>
                <SocialMediaLinks socialLinks={socialLinks} variant="topbar" className="text-slate-600" />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
