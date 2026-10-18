"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  ClipboardList,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Bell,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

const daysOfWeekBangla: Record<string, string> = {
  saturday: "শনিবার",
  sunday: "রবিবার",
  monday: "সোমবার",
  tuesday: "মঙ্গলবার",
  wednesday: "বুধবার",
  thursday: "বৃহস্পতিবার",
  friday: "শুক্রবার",
};

const dayIndexToDayKey: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export default function TeacherOverviewDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teacherData, setTeacherData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, batchesRes, noticesRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/batches"),
        fetch("/api/notices?limit=4"),
      ]);

      const [meJson, batchesJson, noticesJson] = await Promise.all([
        meRes.json(),
        batchesRes.json(),
        noticesRes.json(),
      ]);

      if (meJson.success) {
        setTeacherData(meJson.data);
      }
      if (batchesJson.success) {
        setBatches(batchesJson.data || []);
      }
      if (noticesJson.success) {
        setNotices(noticesJson.data || []);
      }
    } catch (err: any) {
      setError("ড্যাশবোর্ড তথ্য লোড করতে সমস্যা হয়েছে। সংযোগ পরীক্ষা করুন।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Determine today's classes
  const todayKey = dayIndexToDayKey[new Date().getDay()];
  const todayClasses: any[] = [];
  batches.forEach((batch) => {
    batch.schedule?.forEach((item: any) => {
      if (item.day === todayKey) {
        todayClasses.push({
          batchName: batch.name,
          batchCode: batch.code,
          classLevel: batch.classLevel,
          subjects: batch.subjects,
          startTime: item.startTime,
          endTime: item.endTime,
          roomNo: item.roomNo,
          batchId: batch._id,
        });
      }
    });
  });

  todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">{error}</h3>
        <Button onClick={fetchDashboardData} variant="outline">
          পুনরায় চেষ্টা করুন
        </Button>
      </div>
    );
  }

  const teacherProfile = teacherData?.profile;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#004f55] via-[#00636b] to-[#007a85] p-6 sm:p-8 text-white shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs text-[#fde68a] font-medium backdrop-blur-xs mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>সম্মানিত শিক্ষক প্যানেল</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              স্বাগতম, {teacherData?.fullName || "শিক্ষক"}!
            </h1>
            <p className="text-sm text-primary-100 max-w-xl">
              আজকে {daysOfWeekBangla[todayKey]}। আপনার পাঠদান সূচী ও নির্ধারিত ব্যাচের
              শিক্ষার্থীদের উপস্থিতি ও ফলাফল পর্যবেক্ষণ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/teacher/attendance">
              <Button
                variant="secondary"
                size="sm"
                className="bg-[#65a30d] hover:bg-[#52840a] text-white border-none flex items-center gap-1.5"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>আজকের হাজিরা গ্রহণ</span>
              </Button>
            </Link>
            <Link href="/dashboard/teacher/exams">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center gap-1.5"
              >
                <ClipboardList className="h-4 w-4" />
                <span>নম্বর এন্ট্রি</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Batches */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-100 text-[#00636b] flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                নির্ধারিত ব্যাচ
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {toBanglaNumber(batches.length)}
              </span>
              <span className="text-[11px] text-slate-400 block">টি সক্রিয় ব্যাচ</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Classes */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                আজকের নির্ধারিত ক্লাস
              </span>
              <span className="text-2xl font-bold text-emerald-700 font-mono">
                {toBanglaNumber(todayClasses.length)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {daysOfWeekBangla[todayKey]}র শিডিউল
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Subjects Taught */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                পাঠদানের বিষয়সমূহ
              </span>
              <span className="text-base font-bold text-slate-900 truncate block">
                {teacherProfile?.subjects && teacherProfile.subjects.length > 0
                  ? teacherProfile.subjects.join(", ")
                  : "বিষয়ভিত্তিক শিক্ষক"}
              </span>
              <span className="text-[11px] text-slate-400 block">বিশেষায়িত মেন্টরিং</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Teacher Code */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                শিক্ষক কোড / আইডি
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {teacherProfile?.teacherCode || "TC-ACTIVE"}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium block">
                স্ট্যাটাস: সক্রিয়
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Today's Classes + Assigned Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#00636b]" />
                  <span>আজকের ক্লাস সূচী ({daysOfWeekBangla[todayKey]})</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  নির্ধারিত সময়ে ক্লাসে উপস্থিত হয়ে শিক্ষার্থীদের নিয়মিত হাজিরা নথিভুক্ত
                  করুন
                </p>
              </div>
              <Link href="/dashboard/teacher/timetable">
                <Button variant="ghost" size="sm" className="text-xs text-[#00636b]">
                  পূর্ণাঙ্গ রুটিন
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {todayClasses.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    আজ আপনার কোনো নির্ধারিত ক্লাস নেই
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    অন্যান্য দিনের সময়সূচী দেখতে &quot;পূর্ণাঙ্গ রুটিন&quot; দেখুন।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((cls, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 hover:border-[#00636b] transition bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {cls.batchName}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {cls.batchCode}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-primary-800">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {toBanglaNumber(cls.startTime)} -{" "}
                            {toBanglaNumber(cls.endTime)}
                          </span>
                          {cls.roomNo && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              রুম: {cls.roomNo}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/dashboard/teacher/attendance?batch=${cls.batchId}`}>
                          <Button size="sm" variant="primary" className="text-xs">
                            হাজিরা গ্রহণ
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Batches Summary */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#00636b]" />
                  <span>আমার তত্ত্বাবধানের ব্যাচসমূহ</span>
                </CardTitle>
              </div>
              <Link href="/dashboard/teacher/batches">
                <Button variant="ghost" size="sm" className="text-xs text-[#00636b]">
                  সকল ব্যাচ দেখুন
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {batches.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Users className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    আপাতত কোনো সক্রিয় ব্যাচ এসাইন করা নেই
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    অ্যাডমিন কর্তৃক ব্যাচে শিক্ষক হিসেবে নিযুক্ত করা মাত্রই এখানে
                    প্রদর্শিত হবে।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {batches.slice(0, 4).map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#00636b] transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 truncate">
                          {b.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {b.code}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500">
                        বিষয়: {b.subjects?.join(", ")}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono">
                          আসন: {toBanglaNumber(b.capacity)}
                        </span>
                        <Link
                          href={`/dashboard/teacher/batches`}
                          className="text-[#00636b] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          শিক্ষার্থী তালিকা <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notices & Quick Shortcuts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Institutional Notices */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#c27a29]" />
                <span>সাম্প্রতিক নোটিশ ও বিজ্ঞপ্তি</span>
              </CardTitle>
              <Link href="/dashboard/teacher/notices">
                <Button variant="ghost" size="sm" className="text-xs text-[#00636b]">
                  সব নোটিশ
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              {notices.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">
                  বর্তমানে কোনো নোটিশ নেই
                </p>
              ) : (
                notices.map((n) => (
                  <div
                    key={n._id}
                    className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          n.priority === "urgent"
                            ? "bg-red-50 text-red-700"
                            : n.priority === "important"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {n.priority === "urgent"
                          ? "জরুরি"
                          : n.priority === "important"
                            ? "গুরুত্বপূর্ণ"
                            : "বিজ্ঞপ্তি"}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {formatBanglaDate(n.publishedAt || n.createdAt)}
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-slate-800 line-clamp-1">
                      {n.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {n.summary || n.content}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Teacher Guide Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-base text-[#fde68a]">
              শিক্ষক নির্দেশিকা ও নিয়মাবলী
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              প্রতিটি ক্লাসের শুরুতে ডিজিটাল হাজিরা নিশ্চিত করুন। মডেল টেস্ট ও সাপ্তাহিক
              পরীক্ষার খাতা মূল্যায়নের পর অনতিবিলম্বে পোর্টালে নম্বর এন্ট্রি সম্পন্ন করুন।
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/dashboard/teacher/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  প্রোফাইল ও পাসওয়ার্ড পরিবর্তন
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
