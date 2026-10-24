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
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { toBanglaNumber, formatBanglaDateFull } from "@/lib/utils";
import { FinancialChart } from "@/components/admin/FinancialChart";

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
  financials?: {
    currentMonth: {
      year: number;
      month: number;
      monthName: string;
      collection: number;
      due: number;
      payable: number;
      paidCount: number;
      partialCount: number;
      dueCount: number;
      collectionRate: number;
    };
    currentYear: {
      year: number;
      collection: number;
      due: number;
      payable: number;
      collectionRate: number;
    };
    yearlyMonthlyTrend: Array<{
      month: number;
      monthName: string;
      collection: number;
      due: number;
      payable: number;
    }>;
    recentPayments: Array<{
      _id: string;
      student?: {
        fullName: string;
        studentId: string;
        phone: string;
        classLevel: string;
      };
      batch?: {
        name: string;
        code: string;
      };
      month: number;
      year: number;
      feeAmount: number;
      discountAmount: number;
      payableAmount: number;
      paidAmount: number;
      dueAmount: number;
      status: "paid" | "partial" | "due";
      paymentMethod: string;
      receiptNumber?: string;
      paidAt?: string;
      createdAt: string;
    }>;
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

      {/* 0. Financial Highlights (Monthly & Yearly Collection / Due) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Monthly Collection */}
        <Card className="border-l-4 border-l-[#00636b] shadow-xs bg-gradient-to-br from-white to-teal-50/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  চলতি মাসের মোট আদায় ({data?.financials?.currentMonth?.monthName || "চলতি মাস"})
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-900 mt-1">
                    ৳{toBanglaNumber((data?.financials?.currentMonth?.collection ?? 0).toLocaleString("bn-BD"))}
                  </h3>
                )}
                <p className="text-[11px] text-teal-700 font-medium mt-1">
                  আদায় হার: {toBanglaNumber(data?.financials?.currentMonth?.collectionRate ?? 0)}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-[#00636b] shadow-xs">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/payments"
                className="text-[#00636b] font-medium hover:underline flex items-center gap-1"
              >
                <span>ফি কালেকশন ব্যবস্থাপনা</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Outstanding Due */}
        <Card className="border-l-4 border-l-rose-500 shadow-xs bg-gradient-to-br from-white to-rose-50/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  চলতি মাসের বকেয়া ({data?.financials?.currentMonth?.monthName || "চলতি মাস"})
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                    ৳{toBanglaNumber((data?.financials?.currentMonth?.due ?? 0).toLocaleString("bn-BD"))}
                  </h3>
                )}
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  বকেয়া শিক্ষার্থী: {toBanglaNumber((data?.financials?.currentMonth?.dueCount ?? 0) + (data?.financials?.currentMonth?.partialCount ?? 0))} জন
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-xs">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/payments?status=due"
                className="text-rose-600 font-medium hover:underline flex items-center gap-1"
              >
                <span>বকেয়া তালিকা দেখুন</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Collection */}
        <Card className="border-l-4 border-l-[#c27a29] shadow-xs bg-gradient-to-br from-white to-amber-50/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  বার্ষিক মোট আদায় ({toBanglaNumber(data?.financials?.currentYear?.year ?? 2026)})
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
                    ৳{toBanglaNumber((data?.financials?.currentYear?.collection ?? 0).toLocaleString("bn-BD"))}
                  </h3>
                )}
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  বার্ষিক আদায় হার: {toBanglaNumber(data?.financials?.currentYear?.collectionRate ?? 0)}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#c27a29] shadow-xs">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/payments"
                className="text-[#c27a29] font-medium hover:underline flex items-center gap-1"
              >
                <span>বার্ষিক রিপোর্ট</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Due */}
        <Card className="border-l-4 border-l-purple-600 shadow-xs bg-gradient-to-br from-white to-purple-50/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  বার্ষিক মোট বকেয়া ({toBanglaNumber(data?.financials?.currentYear?.year ?? 2026)})
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-900 mt-1">
                    ৳{toBanglaNumber((data?.financials?.currentYear?.due ?? 0).toLocaleString("bn-BD"))}
                  </h3>
                )}
                <p className="text-[11px] text-purple-700 font-medium mt-1">
                  মোট ডিমান্ড: ৳{toBanglaNumber((data?.financials?.currentYear?.payable ?? 0).toLocaleString("bn-BD"))}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-xs">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/payments"
                className="text-purple-600 font-medium hover:underline flex items-center gap-1"
              >
                <span>আর্থিক হিসাব বিবরণী</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Analytics Chart & Recent Payment Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 Cols) */}
        <Card className="lg:col-span-2 shadow-xs bg-white border border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#00636b]" />
              <span>কোচিংয়ের বার্ষিক ফি আদায় ও বকেয়ার তুলনামূলক গ্রাফ</span>
            </CardTitle>
            <Link
              href="/admin/payments"
              className="text-xs text-[#00636b] hover:underline font-medium flex items-center gap-1"
            >
              <span>বিস্তারিত রিপোর্ট</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-60 w-full rounded-xl" />
            ) : (
              <FinancialChart
                data={data?.financials?.yearlyMonthlyTrend || []}
                year={data?.financials?.currentYear?.year || 2026}
                totalYearlyCollection={data?.financials?.currentYear?.collection || 0}
                totalYearlyDue={data?.financials?.currentYear?.due || 0}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Payments Column (1 Col) */}
        <Card className="lg:col-span-1 shadow-xs bg-white border border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00636b]" />
              <span>সাম্প্রতিক পেমেন্ট লেনদেন</span>
            </CardTitle>
            <Link
              href="/admin/payments"
              className="text-xs text-[#00636b] hover:underline font-medium"
            >
              সকল দেখুন
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : !data?.financials?.recentPayments || data.financials.recentPayments.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CreditCard className="h-8 w-8 mx-auto opacity-30 mb-2" />
                <p className="text-xs font-medium">এখনো কোনো পেমেন্ট রেকর্ড নেই</p>
                <Link
                  href="/admin/payments"
                  className="mt-2 inline-block text-xs font-bold text-[#00636b] hover:underline"
                >
                  পেমেন্ট এন্ট্রি করুন
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.financials.recentPayments.map((pm) => (
                  <div
                    key={pm._id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {pm.student?.fullName || "শিক্ষার্থী"}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{pm.batch?.name || "ব্যাচ"}</span>
                        <span>•</span>
                        <span>{pm.student?.phone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-800 text-xs">
                        ৳{toBanglaNumber((pm.paidAmount ?? 0).toLocaleString("bn-BD"))}
                      </div>
                      <div className="mt-0.5">
                        {pm.status === "paid" ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                            পরিশোধিত
                          </span>
                        ) : pm.status === "partial" ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                            আংশিক
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                            বকেয়া ৳{toBanglaNumber(pm.dueAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
