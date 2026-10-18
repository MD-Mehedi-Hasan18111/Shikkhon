"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  User,
  Save,
  Lock,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Shield,
  Layers,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { updateUserProfile } from "@/store/slices/authSlice";
import Image from "next/image";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";
import { bn } from "@/config/bangla-strings";

export default function AdminProfilePage() {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileData, setProfileData] = useState<any>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [biography, setBiography] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success && json.data) {
        setProfileData(json.data);
        setFullName(json.data.fullName || "");
        setEmail(json.data.email || "");
        setAvatarUrl(json.data.avatarUrl || "");
        setBiography(json.data.biography || json.data.profile?.biography || "");
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "তথ্য লোড ব্যর্থ",
          message: "প্রোফাইল তথ্য লোড করা সম্ভব হয়নি। সংযোগ পরীক্ষা করুন।",
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      dispatch(
        addNotification({
          type: "warning",
          title: "অপূর্ণ তথ্য",
          message: "অনুগ্রহ করে পূর্ণ নাম দিন।",
        })
      );
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          avatarUrl: avatarUrl.trim(),
          biography: biography.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        dispatch(
          addNotification({
            type: "success",
            title: "সফল",
            message: "প্রশাসক প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে।",
          })
        );
        dispatch(
          updateUserProfile({
            fullName: fullName.trim(),
            email: email.trim(),
          })
        );
        fetchProfile();
      } else {
        throw new Error(json.message || "তথ্য আপডেট করা যায়নি।");
      }
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      dispatch(
        addNotification({
          type: "warning",
          title: "বর্তমান পাসওয়ার্ড প্রয়োজন",
          message: "পাসওয়ার্ড পরিবর্তনের জন্য বর্তমান পাসওয়ার্ড দিন।",
        })
      );
      return;
    }

    if (newPassword.length < 6) {
      dispatch(
        addNotification({
          type: "warning",
          title: "দুর্বল পাসওয়ার্ড",
          message: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
        })
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      dispatch(
        addNotification({
          type: "warning",
          title: "পাসওয়ার্ড অমিল",
          message: "নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।",
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
      if (json.success) {
        dispatch(
          addNotification({
            type: "success",
            title: "পাসওয়ার্ড পরিবর্তিত",
            message: "আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।",
          })
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordFields(false);
      } else {
        throw new Error(json.message || "পাসওয়ার্ড পরিবর্তন করা যায়নি।");
      }
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err.message || "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="প্রশাসক প্রোফাইল ও নিরাপত্তা"
          subtitle="আপনার ব্যক্তিগত তথ্য ও নিরাপত্তা সেটিংস পরিচালনা করুন"
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const roleLabel =
    profileData?.role === "super_admin"
      ? "প্রধান প্রশাসক (Super Admin)"
      : profileData?.role === "admin"
        ? "প্রশাসক (Admin)"
        : "স্টাফ সদস্য";

  return (
    <div className="space-y-6">
      <PageHeader
        title="প্রশাসক প্রোফাইল ও নিরাপত্তা"
        subtitle="অ্যাকাউন্টের ব্যক্তিগত তথ্য, লগইন সিকিউরিটি ও পাসওয়ার্ড নিয়ন্ত্রণ"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Admin Identity & System Privileges Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-[#004f56] to-[#00636b] relative" />
            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="flex flex-col items-center -mt-12 text-center">
                <div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center font-bold text-3xl text-[#00636b] bg-slate-50 overflow-hidden relative">
                  {avatarUrl || profileData?.avatarUrl ? (
                    <Image
                      src={avatarUrl || profileData?.avatarUrl}
                      alt={profileData?.fullName || "Admin"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    profileData?.fullName?.charAt(0) || "অ্যা"
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-3">
                  {profileData?.fullName || "অ্যাডমিনিস্ট্রেটর"}
                </h3>
                <div className="mt-1">
                  <Badge variant="primary" size="md" className="gap-1 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{roleLabel}</span>
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-2">
                  {profileData?.phone || "০১৯৮২৭০৫৬৪৬"}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>মোবাইল নম্বর</span>
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {profileData?.phone}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>ইমেইল</span>
                  </span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {profileData?.email || "যুক্ত করা হয়নি"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>সর্বশেষ লগইন</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {profileData?.lastLoginAt
                      ? formatBanglaDate(profileData.lastLoginAt)
                      : "আজকে"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    <span>স্ট্যাটাস</span>
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    সক্রিয় ও সুরক্ষিত
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Privileges Badge Card */}
          <Card className="border-slate-200 shadow-2xs bg-slate-50/60">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="h-4 w-4 text-[#00636b]" />
                <span>প্রশাসনিক দায়িত্ব ও অধিকার</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>শিক্ষার্থী ও শিক্ষক তথ্য নিয়ন্ত্রণ ও নতুন ভর্তি অনুমোদন</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>সেশন, ব্যাচ সময়সূচী ও শিক্ষক অ্যাসাইনমেন্ট</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>ডিজিটাল ক্লাসরুম হাজিরা ও পরীক্ষার রেজাল্ট প্রকাশ</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>বিজ্ঞপ্তি, ব্লগ, ইভেন্ট ও প্রাতিষ্ঠানিক সেটিংস কনফিগারেশন</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms for Profile & Security */}
        <div className="lg:col-span-8 space-y-6">
          {/* Form 1: Personal Details */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-[#00636b]" />
                <span>ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Avatar Upload */}
                <div className="pb-3 border-b border-slate-100">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    folder="avatars"
                    aspectRatio="square"
                    rounded
                    label="প্রোফাইল ছবি (Avatar)"
                    description="আপনার প্রোফাইল ছবি যুক্ত করতে এখানে ক্লিক করুন বা ছবি টেনে আনুন (JPG, PNG, WebP সর্বোচ্চ ৫MB)।"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      পূর্ণ নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="যেমন: প্রধান প্রশাসক"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00636b] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      মোবাইল নম্বর (লগইন ইউজারনেম)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profileData?.phone || ""}
                      className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      * মোবাইল নম্বর নিরাপত্তা আইডি হিসেবে অপরিবর্তনযোগ্য
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      অফিসিয়াল ইমেইল
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@coaching.edu.bd"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00636b] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      পদবি / প্রাতিষ্ঠানিক ভূমিকা
                    </label>
                    <input
                      type="text"
                      disabled
                      value={roleLabel}
                      className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    পরিচিতি / নোট (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={3}
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    placeholder="কোচিং পরিচালনা ও অ্যাকাডেমিক দায়িত্ব সংক্রান্ত সংক্ষিপ্ত বিবরণ..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00636b] transition"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="gap-2 bg-[#00636b] hover:bg-[#004f56] text-white"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>তথ্য সংরক্ষণ করুন</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Form 2: Password & Account Security */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                <span>পাসওয়ার্ড ও অ্যাকাউন্ট নিরাপত্তা</span>
              </CardTitle>
              {!showPasswordFields && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordFields(true)}
                  className="text-xs gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-5">
              {!showPasswordFields ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">
                      অ্যাকাউন্ট সুরক্ষিত রয়েছে
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      পাসওয়ার্ড পরিবর্তন করতে উপরের &quot;পাসওয়ার্ড পরিবর্তন করুন&quot;
                      বাটনে ক্লিক করুন।
                    </p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-emerald-500 shrink-0" />
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      নিরাপত্তার স্বার্থে পাসওয়ার্ড পরিবর্তনের জন্য আপনার বর্তমান
                      পাসওয়ার্ড প্রয়োজন হবে।
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      বর্তমান পাসওয়ার্ড <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="বর্তমান গোপন পাসওয়ার্ড দিন"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00636b] transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        নতুন পাসওয়ার্ড <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00636b] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        নতুন পাসওয়ার্ড নিশ্চিত করুন{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00636b] transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordFields(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-xs"
                    >
                      বাতিল
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingPassword}
                      className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {savingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>আপডেট হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>নতুন পাসওয়ার্ড সেট করুন</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
