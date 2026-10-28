"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap,
  CalendarCheck,
  Award,
  BookOpen,
  Clock,
  Bell,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toBanglaNumber, formatBanglaDate, formatTo12h, formatBanglaCurrency } from "@/lib/utils";

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

export default function StudentOverviewDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentUser, setStudentUser] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, batchesRes, attRes, resultsRes, noticesRes, paymentsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/batches"),
        fetch("/api/attendance"),
        fetch("/api/results?limit=4"),
        fetch("/api/notices?limit=3"),
        fetch("/api/payments?limit=1"),
      ]);

      const [meJson, batchesJson, attJson, resultsJson, noticesJson, paymentsJson] = await Promise.all([
        meRes.json(),
        batchesRes.json(),
        attRes.json(),
        resultsRes.json(),
        noticesRes.json(),
        paymentsRes.json(),
      ]);

      if (meJson.success) {
        setStudentUser(meJson.data);
      }
      if (batchesJson.success) {
        setBatches(batchesJson.data || []);
      }
      if (attJson.success && attJson.data?.summary) {
        setAttendanceSummary(attJson.data.summary);
      }
      if (resultsJson.success) {
        setResults(resultsJson.data || []);
      }
      if (noticesJson.success) {
        setNotices(noticesJson.data || []);
      }
      if (paymentsJson.success && paymentsJson.data?.summary) {
        setPaymentSummary(paymentsJson.data.summary);
      }
    } catch {
      setError("ড্যাশবোর্ড তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  // Today's classes
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
        <Button onClick={fetchStudentData} variant="outline">
          পুনরায় চেষ্টা করুন
        </Button>
      </div>
    );
  }

  const studentProfile = studentUser?.profile;
  const attendancePct = attendanceSummary?.attendancePercentage ?? 100;
  const latestResult = results.length > 0 ? results[0] : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-banner bg-[#002e33] bg-gradient-to-r from-[#001e22] via-[#002e33] to-[#003e44] p-6 sm:p-8 text-white shadow-md border border-teal-800">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs text-teal-200 font-medium backdrop-blur-xs mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>শিক্ষার্থী পোর্টাল</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              স্বাগতম, {studentUser?.fullName || "শিক্ষার্থী"}!
            </h1>
            <p className="text-sm text-teal-100 max-w-xl">
              আজকে {daysOfWeekBangla[todayKey]}। নিয়মিত ক্লাসে উপস্থিতি বজায় রাখুন এবং
              পরীক্ষার প্রস্তুতিতে মনোনিবেশ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/student/results">
              <Button
                variant="secondary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center gap-1.5"
              >
                <Award className="h-4 w-4" />
                <span>ফলাফল দেখুন</span>
              </Button>
            </Link>
            <Link href="/dashboard/student/batches">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center gap-1.5"
              >
                <BookOpen className="h-4 w-4" />
                <span>আমার ব্যাচসূচী</span>
              </Button>
            </Link>
            <Link href="/dashboard/student/payments">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center gap-1.5"
              >
                <CreditCard className="h-4 w-4" />
                <span>ফি ও পেমেন্ট</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Due Fee Alert Banner (if any due exists) */}
      {paymentSummary && paymentSummary.totalDue > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-rose-900 block text-sm">
                আপনার ফি বকেয়া রয়েছে: {formatBanglaCurrency(paymentSummary.totalDue)}
              </span>
              <span className="text-rose-700 text-xs">
                কোচিং অফিসে অথবা নির্ধারিত মাধ্যমে দ্রুত ফি পরিশোধ করে ডিজিটাল মানি রসিদ সংগ্রহ করুন।
              </span>
            </div>
          </div>
          <Link href="/dashboard/student/payments" className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-rose-900 border-rose-300 hover:bg-rose-100 font-semibold"
            >
              পেমেন্ট হিস্ট্রি ও রসিদ
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attendance Percentage */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                উপস্থিতির গড় হার
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                %{toBanglaNumber(attendancePct)}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium block">
                {attendancePct >= 80 ? "সন্তোষজনক উপস্থিতি" : "উপস্থিতি বাড়ানো প্রয়োজন"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Enrolled Batches */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                অধ্যয়নরত ব্যাচ
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {toBanglaNumber(batches.length)}
              </span>
              <span className="text-[11px] text-slate-400 block">টি সক্রিয় ব্যাচ</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Latest Exam Result */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                সর্বশেষ পরীক্ষার ফলাফল
              </span>
              <span className="text-lg font-bold text-slate-900 truncate block">
                {latestResult
                  ? `${toBanglaNumber(latestResult.obtainedMarks)} / ${toBanglaNumber(
                      latestResult.exam?.maximumMarks || 100
                    )}`
                  : "কোনো পরীক্ষা নেই"}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {latestResult?.exam?.subject || "বিষয়"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Student ID Code */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                শিক্ষার্থী আইডি
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {studentProfile?.studentId || "ID-NEW"}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                {studentProfile?.classLevel || "শ্রেণি"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Today's Classes + Batches & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Schedule Card */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-700" />
                  <span>আজকের ক্লাস সূচী ({daysOfWeekBangla[todayKey]})</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  নির্ধারিত সময়ে ক্লাসে উপস্থিত থাকার জন্য অনুরোধ করা যাচ্ছে
                </p>
              </div>
              <Link href="/dashboard/student/batches">
                <Button variant="ghost" size="sm" className="text-xs text-primary-800">
                  পূর্ণাঙ্গ রুটিন
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {todayClasses.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CalendarCheck className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    আজ আপনার কোনো নির্ধারিত ক্লাস নেই
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    বাসায় বসে বিগত ক্লাসের রিভিশন ও অনুশীলনী সম্পন্ন করুন।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((cls, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 hover:border-primary-400 transition bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                            {formatTo12h(cls.startTime)} –{" "}
                            {formatTo12h(cls.endTime)}
                          </span>
                          {cls.roomNo && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              রুম: {cls.roomNo}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="text-xs self-start sm:self-auto"
                      >
                        {cls.subjects?.join(", ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Batches List */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-700" />
                  <span>আমার বর্তমান ব্যাচসমূহ</span>
                </CardTitle>
              </div>
              <Link href="/dashboard/student/batches">
                <Button variant="ghost" size="sm" className="text-xs text-primary-800">
                  বিস্তারিত দেখুন
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {batches.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    আপাতত কোনো সক্রিয় ব্যাচে এনরোলমেন্ট নেই
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ভর্তি সংক্রান্ত কোনো তথ্য জানতে অফিসে যোগাযোগ করুন।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {batches.map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary-400 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 truncate">
                          {b.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {b.code}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        বিষয়: {b.subjects?.join(", ")}
                      </div>
                      {b.assignedTeachers && b.assignedTeachers.length > 0 && (
                        <div className="text-[11px] text-primary-800 font-medium">
                          শিক্ষক:{" "}
                          {b.assignedTeachers.map((t: any) => t.fullName).join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Results & Notices (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Exam Results Card */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span>সর্বশেষ পরীক্ষার ফলাফল</span>
              </CardTitle>
              <Link href="/dashboard/student/results">
                <Button variant="ghost" size="sm" className="text-xs text-primary-800">
                  সব ফলাফল
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              {results.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Award className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold">কোনো ফলাফল প্রকাশিত হয়নি</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    মডেল টেস্ট অনুষ্ঠিত হলে ফলাফল এখানে প্রকাশ করা হবে।
                  </p>
                </div>
              ) : (
                results.map((res) => (
                  <div
                    key={res._id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-2"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {res.exam?.title}
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        {res.exam?.subject} • {formatBanglaDate(res.exam?.examDate)}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-emerald-700 block">
                        {toBanglaNumber(res.obtainedMarks)} /{" "}
                        {toBanglaNumber(res.exam?.maximumMarks)}
                      </span>
                      {res.feedback && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[100px] block">
                          {res.feedback}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Published Notices */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary-700" />
                <span>গুরুত্বপূর্ণ নোটিশ</span>
              </CardTitle>
              <Link href="/dashboard/student/notices">
                <Button variant="ghost" size="sm" className="text-xs text-primary-800">
                  সকল নোটিশ
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              {notices.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  বর্তমানে কোনো নোটিশ নেই
                </p>
              ) : (
                notices.map((n) => (
                  <div
                    key={n._id}
                    className="p-3 rounded-lg border border-slate-100 bg-white space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-primary-800">
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
        </div>
      </div>
    </div>
  );
}
