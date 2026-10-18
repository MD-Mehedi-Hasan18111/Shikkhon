"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  Save,
  Lock,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import Image from "next/image";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

export default function TeacherProfilePage() {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileData, setProfileData] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [biography, setBiography] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success && json.data) {
        setProfileData(json.data);
        setFullName(json.data.fullName || "");
        setEmail(json.data.email || "");
        setAvatarUrl(json.data.avatarUrl || json.data.profile?.avatarUrl || "");
        setBiography(json.data.profile?.biography || "");
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, avatarUrl, biography }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "প্রোফাইল আপডেট ব্যর্থ হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "আপডেট সফল!",
          message: "আপনার প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।",
        })
      );
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "সংরক্ষণ করতে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      dispatch(
        addNotification({
          type: "error",
          title: "দুর্বল পাসওয়ার্ড",
          message: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
        })
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatch(
        addNotification({
          type: "error",
          title: "পাসওয়ার্ড মিলছে না",
          message: "নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড একই হতে হবে।",
        })
      );
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "পাসওয়ার্ড পরিবর্তিত!",
          message: "আপনার লগইন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।",
        })
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const teacher = profileData?.profile;

  return (
    <div className="space-y-6">
      <PageHeader
        title="শিক্ষক প্রোফাইল ও নিরাপত্তা সেটিংস"
        subtitle="ব্যক্তিগত তথ্য, শিক্ষাগত যোগ্যতা ও অ্যাকাউন্টের পাসওয়ার্ড পরিচালনা"
        breadcrumbs={[
          { label: "শিক্ষক ড্যাশবোর্ড", href: "/dashboard/teacher" },
          { label: "প্রোফাইল ও নিরাপত্তা" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card & Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-24 h-24 rounded-3xl bg-[#00636b] text-white flex items-center justify-center font-bold text-3xl mx-auto shadow-sm overflow-hidden relative">
                {avatarUrl || teacher?.avatarUrl || profileData?.avatarUrl ? (
                  <Image
                    src={avatarUrl || teacher?.avatarUrl || profileData?.avatarUrl}
                    alt={profileData?.fullName || "Teacher"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  profileData?.fullName?.slice(0, 1) || "শি"
                )}
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00636b]/10 text-[#00636b] font-mono font-semibold text-xs mb-1">
                  আইডি: {teacher?.teacherCode || "TC-ACTIVE"}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {profileData?.fullName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">সম্মানিত শিক্ষক ও মেন্টর</p>
              </div>

              <div className="pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{toBanglaNumber(profileData?.phone)}</span>
                </div>
                {profileData?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{profileData?.email}</span>
                  </div>
                )}
                {teacher?.joiningDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>যোগদান: {formatBanglaDate(teacher.joiningDate)}</span>
                  </div>
                )}
              </div>

              {teacher?.subjects && teacher.subjects.length > 0 && (
                <div className="pt-4 border-t border-slate-100 text-left">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    পাঠদানের বিষয়সমূহ:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects.map((sub: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {teacher?.qualifications && teacher.qualifications.length > 0 && (
                <div className="pt-3 border-t border-slate-100 text-left">
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    শিক্ষাগত যোগ্যতা:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {teacher.qualifications.map((q: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Update Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Profile Edit Form */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#00636b]" />
                <span>প্রোফাইল তথ্য হালনাগাদ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    folder="avatars"
                    aspectRatio="square"
                    rounded
                    label="শিক্ষকের প্রোফাইল ছবি"
                    description="ওয়েবসাইট ও ড্যাশবোর্ডে প্রদর্শনের জন্য আপনার ছবি আপলোড করুন।"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পূর্ণ নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইমেইল ঠিকানা
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংক্ষিপ্ত পরিচিতি ও দর্শন
                  </label>
                  <textarea
                    rows={3}
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>প্রোফাইল সংরক্ষণ</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Change Form */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-5 w-5 text-[#c27a29]" />
                <span>পাসওয়ার্ড পরিবর্তন</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বর্তমান পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      নতুন পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      নতুন পাসওয়ার্ড নিশ্চিত করুন *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    {savingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
