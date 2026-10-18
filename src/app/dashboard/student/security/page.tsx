"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

export default function StudentSecurityPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

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

    setSaving(true);
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
          title: "সফল!",
          message: "আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।",
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
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="অ্যাকাউন্ট ও নিরাপত্তা সেটিংস"
        subtitle="আপনার শিক্ষার্থী আইডির পাসওয়ার্ড পরিবর্তন ও সেশন সিকিউরিটি পরিচালনা"
        breadcrumbs={[
          { label: "শিক্ষার্থী ড্যাশবোর্ড", href: "/dashboard/student" },
          { label: "নিরাপত্তা ও পাসওয়ার্ড" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Security Overview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-800" />
                <span>অ্যাকাউন্ট বিবরণী</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>লগইন মোবাইল নম্বর:</span>
                <span className="font-mono font-bold text-slate-900">
                  {user?.phone ? toBanglaNumber(user.phone) : "-"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>অ্যাকাউন্ট রোল:</span>
                <span className="font-semibold text-primary-800">শিক্ষার্থী</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span>স্ট্যাটাস:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> সক্রিয়
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Safety Notice */}
          <div className="rounded-2xl bg-brand-card-dark bg-[#002e33] bg-gradient-to-br from-[#002e33] to-[#001e22] text-white p-6 border border-teal-800 shadow-md space-y-2">
            <h4 className="font-bold text-sm text-teal-200">নিরাপত্তা পরামর্শ</h4>
            <p className="text-xs text-teal-100 leading-relaxed">
              পাসওয়ার্ড অন্য কারো সাথে শেয়ার করবেন না। পাবলিক কম্পিউটার বা সাইবার ক্যাফে
              থেকে লগইন করলে কাজ শেষে অবশ্যই লগআউট করুন।
            </p>
          </div>
        </div>

        {/* Password Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                <span>পাসওয়ার্ড পরিবর্তন করুন</span>
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-800 focus:bg-white transition"
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
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-800 focus:bg-white transition"
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
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-800 focus:bg-white transition"
                    />
                  </div>
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
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    <span>পাসওয়ার্ড সংরক্ষণ করুন</span>
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
