"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  UserCheck,
  ClipboardList,
  Bell,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { toBanglaNumber, formatBanglaDateFull } from "@/lib/utils";

interface DashboardStatsData {
  counts: {
    students: number;
    teachers: number;
    batches: number;
    activeEnrollments: number;
  };
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    rate: number;
  };
  recentStudents: Array<{
    _id: string;
    studentId: string;
    fullName: string;
    phone: string;
    classLevel: string;
    institutionName: string;
    createdAt: string;
  }>;
  upcomingExams: Array<{
    _id: string;
    title: string;
    subject: string;
    examDate: string;
    maximumMarks: number;
    batch?: {
      name: string;
      code: string;
    };
  }>;
  recentNotices: Array<{
    _id: string;
    title: string;
    priority: "normal" | "important" | "urgent";
    isPinned: boolean;
    publishedAt: string;
    visibility: string;
  }>;
}

interface BatchScheduleItem {
  _id: string;
  name: string;
  code: string;
  classLevel: string;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    roomNo?: string;
  }>;
  assignedTeachers?: Array<{
    fullName: string;
  }>;
}

const dayNamesBangla: Record<string, string> = {
  saturday: "শনিবার",
  sunday: "রবিবার",
  monday: "সোমবার",
  tuesday: "মঙ্গলবার",
  wednesday: "বুধবার",
  thursday: "বৃহস্পতিবার",
  friday: "শুক্রবার",
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardStatsData | null>(null);
  const [activeBatches, setActiveBatches] = useState<BatchScheduleItem[]>([]);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [statsRes, batchesRes] = await Promise.all([
        fetch("/api/dashboard/stats", { credentials: "include" }),
        fetch("/api/batches?status=active&limit=100", { credentials: "include" }),
      ]);

      if (!statsRes.ok) {
        throw new Error("ড্যাশবোর্ড পরিসংখ্যান লোড করা সম্ভব হয়নি।");
      }

      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setData(statsJson.data);
      }

      if (batchesRes.ok) {
        const batchesJson = await batchesRes.json();
        if (batchesJson.success) {
          setActiveBatches(batchesJson.data || []);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Determine today's day of week
  const daysMap = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDayOfWeek = daysMap[new Date().getDay()];

  // Filter today's classes
  const todayClasses = activeBatches.flatMap((batch) => {
    const todaySchedules = (batch.schedule || []).filter(
      (s) => s.day === currentDayOfWeek
    );
    return todaySchedules.map((s) => ({
      batchName: batch.name,
      batchCode: batch.code,
      classLevel: batch.classLevel,
      teacher:
        batch.assignedTeachers?.map((t) => t.fullName).join(", ") || "নির্ধারিত নেই",
      startTime: s.startTime,
      endTime: s.endTime,
      roomNo: s.roomNo || "কক্ষ-০১",
    }));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="অ্যাডমিন ড্যাশবোর্ড ওভারভিউ"
        subtitle={`স্বাগতম! আজকের তারিখ: ${formatBanglaDateFull(new Date())}`}
        breadcrumbs={[{ label: "হোম", href: "/" }, { label: "অ্যাডমিন ওভারভিউ" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 bg-white text-slate-700 hover:text-[#00636b]"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "রিফ্রেশ হচ্ছে..." : "রিফ্রেশ"}</span>
          </Button>
        }
      />

      {/* Error alert if fetch failed */}
      {error && (
        <Alert
          variant="danger"
          title="ত্রুটি"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
          <div className="mt-2">
            <Button size="xs" variant="outline" onClick={() => fetchDashboardData()}>
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        </Alert>
      )}

      {/* 1. Core Institutions Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Active Students */}
        <Card className="border-l-4 border-l-[#00636b] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  সক্রিয় শিক্ষার্থী
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    {toBanglaNumber(data?.counts.students ?? 0)}
                  </h3>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  মোট ভর্তি: {toBanglaNumber(data?.counts.activeEnrollments ?? 0)} জন
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-[#00636b]">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/students"
                className="text-[#00636b] font-medium hover:underline flex items-center gap-1"
              >
                <span>শিক্ষার্থী তালিকা</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Total Teachers */}
        <Card className="border-l-4 border-l-[#c27a29] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  কর্মরত শিক্ষক
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    {toBanglaNumber(data?.counts.teachers ?? 0)}
                  </h3>
                )}
                <p className="text-[11px] text-slate-500 mt-1">সকল বিষয়ে পাঠদানরত</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#c27a29]">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/teachers"
                className="text-[#c27a29] font-medium hover:underline flex items-center gap-1"
              >
                <span>শিক্ষক তালিকা</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Total Active Batches */}
        <Card className="border-l-4 border-l-[#65a30d] shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  চলমান ব্যাচ
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    {toBanglaNumber(data?.counts.batches ?? 0)}
                  </h3>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  ৬ষ্ঠ থেকে দ্বাদশ ও আলিয়া
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-lime-50 flex items-center justify-center text-[#65a30d]">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/batches"
                className="text-[#65a30d] font-medium hover:underline flex items-center gap-1"
              >
                <span>ব্যাচ ব্যবস্থাপনা</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance Rate */}
        <Card className="border-l-4 border-l-blue-600 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  আজকের উপস্থিতি হার
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    {toBanglaNumber(data?.todayAttendance.rate ?? 0)}%
                  </h3>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  উপস্থিত: {toBanglaNumber(data?.todayAttendance.present ?? 0)} জন
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <CalendarCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/attendance"
                className="text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                <span>হাজিরা রেজিস্টার</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Today's Attendance Summary & Scheduled Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Breakdown Card */}
        <Card className="lg:col-span-1 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-[#00636b]" />
              <span>আজকের ডিজিটাল হাজিরা সারাংশ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">
                      উপস্থিত শিক্ষার্থী
                    </span>
                  </div>
                  <span className="text-base font-bold text-emerald-700">
                    {toBanglaNumber(data?.todayAttendance.present ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">
                      বিলম্বে উপস্থিত
                    </span>
                  </div>
                  <span className="text-base font-bold text-amber-700">
                    {toBanglaNumber(data?.todayAttendance.late ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <XCircle className="h-5 w-5 text-rose-600" />
                    <span className="text-sm font-medium text-rose-900">
                      অনুপস্থিত শিক্ষার্থী
                    </span>
                  </div>
                  <span className="text-base font-bold text-rose-700">
                    {toBanglaNumber(data?.todayAttendance.absent ?? 0)}
                  </span>
                </div>

                <div className="pt-2">
                  <Link href="/admin/attendance" className="block w-full">
                    <Button variant="outline" className="w-full text-xs">
                      আজকের ক্লাসের হাজিরা গ্রহণ করুন
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Scheduled Classes */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#00636b]" />
              <span>
                আজকের ক্লাসের সময়সূচী ({dayNamesBangla[currentDayOfWeek] || "আজ"})
              </span>
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {toBanglaNumber(todayClasses.length)} টি ক্লাস
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                আজকের দিনে কোনো নির্ধারিত ক্লাস সূচী পাওয়া যায়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {todayClasses.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition"
                  >
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">
                        {item.batchName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        শিক্ষক: {item.teacher} • কক্ষ: {item.roomNo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {item.startTime} - {item.endTime}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Upcoming Exams, Recent Notices & Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Exams */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-purple-600" />
              <span>আসন্ন পরীক্ষা</span>
            </CardTitle>
            <Link
              href="/admin/exams"
              className="text-xs text-[#00636b] hover:underline font-medium"
            >
              সব দেখুন
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.upcomingExams?.length ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                কোনো আসন্ন পরীক্ষা তালিকাভুক্ত নেই।
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.upcomingExams.map((exam) => (
                  <div key={exam._id} className="p-3 px-4 hover:bg-slate-50">
                    <p className="text-xs font-semibold text-slate-900">{exam.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>{exam.subject}</span>
                      <span>{new Date(exam.examDate).toLocaleDateString("bn-BD")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Admissions */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-teal-600" />
              <span>নতুন শিক্ষার্থী ভর্তি</span>
            </CardTitle>
            <Link
              href="/admin/students"
              className="text-xs text-[#00636b] hover:underline font-medium"
            >
              সব দেখুন
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.recentStudents?.length ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                কোনো নতুন ভর্তি রেকর্ড পাওয়া যায়নি।
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentStudents.map((student) => (
                  <div key={student._id} className="p-3 px-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900">
                        {student.fullName}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {student.studentId}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {student.institutionName} • {student.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Published Notices */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#c27a29]" />
              <span>সাম্প্রতিক নোটিশসমূহ</span>
            </CardTitle>
            <Link
              href="/admin/notices"
              className="text-xs text-[#00636b] hover:underline font-medium"
            >
              সব দেখুন
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.recentNotices?.length ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                কোনো নোটিশ প্রকাশিত নেই।
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentNotices.map((notice) => (
                  <div key={notice._id} className="p-3 px-4 hover:bg-slate-50">
                    <div className="flex items-center gap-1.5">
                      {notice.priority === "urgent" && (
                        <Badge variant="danger" className="text-[9px] px-1 py-0">
                          জরুরি
                        </Badge>
                      )}
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {notice.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      প্রকাশ: {new Date(notice.publishedAt).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
