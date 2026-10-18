"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  PieChart,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance");
      const json = await res.json();
      if (json.success && json.data) {
        setAttendanceData(json.data);
      }
    } catch {
      setError("হাজিরা তথ্য লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const summary = attendanceData?.summary || {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    countableClasses: 0,
    attendancePercentage: 100,
  };

  const records: any[] = attendanceData?.records || [];

  const statusConfig: Record<string, { label: string; badgeClass: string }> = {
    present: {
      label: "উপস্থিত",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    absent: {
      label: "অনুপস্থিত",
      badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    },
    late: {
      label: "বিলম্ব",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    },
    excused: {
      label: "ছুটি",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ক্লাস উপস্থিতি ও হাজিরা বিবরণী"
        subtitle="আপনার দৈনন্দিন ক্লাসে উপস্থিতির বিস্তারিত ইতিহাস ও পার্সেন্টেজ ট্র্যাকিং"
        breadcrumbs={[
          { label: "শিক্ষার্থী ড্যাশবোর্ড", href: "/dashboard/student" },
          { label: "হাজিরা রেকর্ড" },
        ]}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Percentage Card */}
            <Card className="border-slate-200 shadow-2xs bg-emerald-50/50">
              <CardContent className="p-5 text-center">
                <span className="text-xs font-semibold text-emerald-800 block mb-1">
                  গড় উপস্থিতির হার
                </span>
                <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                  %{toBanglaNumber(summary.attendancePercentage)}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">
                  {summary.attendancePercentage >= 80
                    ? "চমৎকার উপস্থিতি"
                    : "উন্নয়ন প্রয়োজন"}
                </span>
              </CardContent>
            </Card>

            {/* Present Card */}
            <Card className="border-slate-200 shadow-2xs">
              <CardContent className="p-5 text-center">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  মোট উপস্থিত ক্লাস
                </span>
                <span className="text-3xl font-bold text-slate-900 font-mono">
                  {toBanglaNumber(summary.present)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">দিন</span>
              </CardContent>
            </Card>

            {/* Late Card */}
            <Card className="border-slate-200 shadow-2xs">
              <CardContent className="p-5 text-center">
                <span className="text-xs font-semibold text-amber-700 block mb-1">
                  দেরিতে উপস্থিতি
                </span>
                <span className="text-3xl font-bold text-amber-800 font-mono">
                  {toBanglaNumber(summary.late)}
                </span>
                <span className="text-[11px] text-amber-600 block mt-1">দিন</span>
              </CardContent>
            </Card>

            {/* Absent Card */}
            <Card className="border-slate-200 shadow-2xs">
              <CardContent className="p-5 text-center">
                <span className="text-xs font-semibold text-rose-700 block mb-1">
                  অনুপস্থিত ক্লাস
                </span>
                <span className="text-3xl font-bold text-rose-800 font-mono">
                  {toBanglaNumber(summary.absent)}
                </span>
                <span className="text-[11px] text-rose-600 block mt-1">দিন</span>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar & Policy Info */}
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">
                  উপস্থিতি লক্ষ্যমাত্রা (ন্যূনতম ৮০%)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  %{toBanglaNumber(summary.attendancePercentage)}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.attendancePercentage >= 80
                      ? "bg-emerald-600"
                      : summary.attendancePercentage >= 60
                        ? "bg-amber-500"
                        : "bg-rose-600"
                  }`}
                  style={{ width: `${Math.min(100, summary.attendancePercentage)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                * নিয়ম অনুযায়ী পরীক্ষায় অংশগ্রহণের জন্য নূন্যতম ৮০% উপস্থিতি থাকা আবশ্যক।
                ছুটি আবেদন গৃহীত হলে তা অনুপস্থিত হিসেবে গণনা করা হয় না।
              </p>
            </CardContent>
          </Card>

          {/* Detailed Attendance Records Table */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>হাজিরা লগ রেকর্ডসমূহ ({toBanglaNumber(records.length)} টি)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CalendarCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">কোনো হাজিরা রেকর্ড পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ক্লাস অনুষ্ঠিত হওয়ার পর শিক্ষক হাজিরা গ্রহণ করলে এখানে তা প্রদর্শিত
                    হবে।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">তারিখ</th>
                        <th className="py-3 px-4">ব্যাচ ও শ্রেণি</th>
                        <th className="py-3 px-4 text-center">উপস্থিতি স্ট্যাটাস</th>
                        <th className="py-3 px-4">মন্তব্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((r) => {
                        const sConf = statusConfig[r.status] || statusConfig.present;
                        return (
                          <tr key={r._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {formatBanglaDate(r.classDate)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 block">
                                {r.batch?.name || "ব্যাচ"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {r.batch?.code}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-semibold ${sConf.badgeClass}`}
                              >
                                {sConf.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {r.remarks || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
