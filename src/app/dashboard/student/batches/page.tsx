"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toBanglaNumber, formatTo12h } from "@/lib/utils";

const daysOfWeekBangla: Record<string, string> = {
  saturday: "শনিবার",
  sunday: "রবিবার",
  monday: "সোমবার",
  tuesday: "মঙ্গলবার",
  wednesday: "বুধবার",
  thursday: "বৃহস্পতিবার",
  friday: "শুক্রবার",
};

export default function StudentBatchesPage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/batches");
      const json = await res.json();
      if (json.success && json.data) {
        setBatches(json.data);
      }
    } catch {
      setError("ব্যাচ তালিকা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="আমার অন্তর্ভুক্ত ব্যাচ ও সময়সূচী"
        subtitle="অধ্যয়নরত ব্যাচসমূহের ক্লাস রুটিন, ক্লাসরুম ও নির্ধারিত শিক্ষক মণ্ডলী"
        breadcrumbs={[
          { label: "শিক্ষার্থী ড্যাশবোর্ড", href: "/dashboard/student" },
          { label: "আমার ব্যাচসমূহ" },
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
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : batches.length === 0 ? (
        <Card className="border-slate-200 text-center py-12">
          <CardContent className="space-y-3">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              আপনি বর্তমানে কোনো ব্যাচে অন্তর্ভুক্ত নন
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              নতুন শিক্ষাবর্ষের ব্যাচে ভর্তি হতে বা ব্যাচ পরিবর্তন করতে সরাসরি একাডেমি
              অফিসে যোগাযোগ করুন।
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {batches.map((batch) => (
            <Card key={batch._id} className="border-slate-200 shadow-2xs overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{batch.name}</h3>
                    <Badge variant="outline" className="font-mono">
                      {batch.code}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {batch.classLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    শিক্ষাবর্ষ:{" "}
                    <strong>{batch.academicSession?.name || "বর্তমান সেশন"}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    অধ্যয়নরত (সক্রিয়)
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-5 sm:p-6 space-y-6">
                {/* Subjects & Mentors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subjects */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-primary-700" />
                      <span>পাঠদানের বিষয়সমূহ</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {batch.subjects?.map((sub: string, sIdx: number) => (
                        <Badge key={sIdx} variant="secondary" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Mentors */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary-700" />
                      <span>নির্ধারিত শিক্ষক মণ্ডলী</span>
                    </h4>
                    {batch.assignedTeachers && batch.assignedTeachers.length > 0 ? (
                      <div className="space-y-1.5">
                        {batch.assignedTeachers.map((t: any) => (
                          <div
                            key={t._id}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-slate-800">{t.fullName}</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {t.teacherCode}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        শিক্ষক নির্ধারণ প্রক্রিয়াধীন
                      </p>
                    )}
                  </div>
                </div>

                {/* Class Routine / Timetable */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary-700" />
                    <span>সাপ্তাহিক ক্লাসের সময়সূচী</span>
                  </h4>

                  {batch.schedule && batch.schedule.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {batch.schedule.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {daysOfWeekBangla[item.day] || item.day}
                            </span>
                            <span className="text-primary-800 font-semibold font-mono">
                              {formatTo12h(item.startTime)} –{" "}
                              {formatTo12h(item.endTime)}
                            </span>
                          </div>
                          {item.roomNo && (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                              রুম: {item.roomNo}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      রুটিন শিডিউল শীঘ্রই যুক্ত হবে
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
