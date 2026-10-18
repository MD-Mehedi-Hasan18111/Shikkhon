"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  User,
  Phone,
  Mail,
  School,
  Calendar,
  ShieldCheck,
  Users,
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import Image from "next/image";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

export default function StudentProfilePage() {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, avatarUrl }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "প্রোফাইল আপডেট করা যায়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "আপডেট সফল!",
          message: "আপনার প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে।",
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
      setSaving(false);
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

  const student = profileData?.profile;
  const guardian = student?.guardian;

  return (
    <div className="space-y-6">
      <PageHeader
        title="শিক্ষার্থীর ব্যক্তিগত প্রোফাইল ও অভিভাবক তথ্য"
        subtitle="অ্যাকাডেমিক পরিচয়পত্র, প্রতিষ্ঠানের রেকর্ড ও যোগাযোগের বিস্তারিত তথ্য"
        breadcrumbs={[
          { label: "শিক্ষার্থী ড্যাশবোর্ড", href: "/dashboard/student" },
          { label: "আমার প্রোফাইল" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Identity Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-24 h-24 rounded-3xl bg-primary-800 text-white flex items-center justify-center font-bold text-3xl mx-auto shadow-sm overflow-hidden relative">
                {avatarUrl || student?.avatarUrl || profileData?.avatarUrl ? (
                  <Image
                    src={avatarUrl || student?.avatarUrl || profileData?.avatarUrl}
                    alt={profileData?.fullName || "Student"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  profileData?.fullName?.slice(0, 1) || "শি"
                )}
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-900 font-mono font-bold text-xs mb-1">
                  আইডি: {student?.studentId || "ID-NEW"}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {profileData?.fullName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {student?.institutionName || "শিক্ষার্থী"}
                </p>
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
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>শ্রেণি: {student?.classLevel || "নির্ধারিত নয়"}</span>
                </div>
                {student?.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>ভর্তির তারিখ: {formatBanglaDate(student.createdAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information Card */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-700" />
                <span>অভিভাবক সংক্রান্ত তথ্য</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs text-slate-700">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">অভিভাবকের নাম:</span>
                <span className="font-bold text-slate-900">
                  {guardian?.name || "রেকর্ড করা হয়নি"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">সম্পর্ক:</span>
                <span className="font-semibold">{guardian?.relation || "পিতা/মাতা"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">জরুরি মোবাইল নম্বর:</span>
                <span className="font-mono font-bold text-primary-800">
                  {guardian?.phone ? toBanglaNumber(guardian.phone) : "-"}
                </span>
              </div>
              {guardian?.occupation && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">পেশা:</span>
                  <span>{guardian.occupation}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Update Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary-700" />
                <span>যোগাযোগ ও প্রোফাইল সম্পাদন</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    folder="avatars"
                    aspectRatio="square"
                    rounded
                    label="শিক্ষার্থীর প্রোফাইল ছবি"
                    description="আইডি কার্ড ও প্রোফাইলের জন্য পাসপোর্ট সাইজ ছবি আপলোড করুন।"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    শিক্ষার্থীর পূর্ণ নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-700 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ইমেইল ঠিকানা (ঐচ্ছিক)
                  </label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-700 focus:bg-white transition"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>তথ্য সংরক্ষণ করুন</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Academic Instructions Box */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-3">
            <h4 className="font-bold text-sm text-slate-900">
              অভিভাবক বা মোবাইল নম্বর পরিবর্তন করতে চান?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              শিক্ষার্থী বা অভিভাবকের অফিসিয়াল মোবাইল নম্বর ও রোল পরিবর্তন প্রাতিষ্ঠানিক
              নিরাপত্তার জন্য অফিসিয়াল কাউন্টার থেকে সম্পন্ন করতে হয়। অনুগ্রহ করে মূল আইডি
              কার্ড প্রদর্শন করে অফিসে আবেদন করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
