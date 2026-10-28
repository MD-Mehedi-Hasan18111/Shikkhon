"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Users,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toBanglaNumber, formatTo12h } from "@/lib/utils";

const daysList = [
  { key: "saturday", label: "শনিবার" },
  { key: "sunday", label: "রবিবার" },
  { key: "monday", label: "সোমবার" },
  { key: "tuesday", label: "মঙ্গলবার" },
  { key: "wednesday", label: "বুধবার" },
  { key: "thursday", label: "বৃহস্পতিবার" },
  { key: "friday", label: "শুক্রবার" },
];

const dayIndexToDayKey: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export default function TeacherTimetablePage() {
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
      setError("রুটিন ডাটা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const currentDayKey = dayIndexToDayKey[new Date().getDay()];

  // Group schedules by day
  const scheduleByDay: Record<string, any[]> = {
    saturday: [],
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };

  batches.forEach((b) => {
    b.schedule?.forEach((item: any) => {
      if (scheduleByDay[item.day]) {
        scheduleByDay[item.day].push({
          batchName: b.name,
          batchCode: b.code,
          classLevel: b.classLevel,
          subjects: b.subjects,
          startTime: item.startTime,
          endTime: item.endTime,
          roomNo: item.roomNo,
          batchId: b._id,
        });
      }
    });
  });

  // Sort each day by startTime
  Object.keys(scheduleByDay).forEach((day) => {
    scheduleByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="সাপ্তাহিক পাঠদান রুটিন ও ক্লাস সূচী"
        subtitle="সপ্তাহের ৭ দিনের বিষয়ভিত্তিক সময়সূচী ও ক্লাসরুম বণ্টন"
        breadcrumbs={[
          { label: "শিক্ষক ড্যাশবোর্ড", href: "/dashboard/teacher" },
          { label: "সাপ্তাহিক রুটিন" },
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
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {daysList.map((d) => {
            const isToday = d.key === currentDayKey;
            const items = scheduleByDay[d.key] || [];

            return (
              <Card
                key={d.key}
                className={`border transition shadow-2xs ${
                  isToday
                    ? "border-[#00636b] ring-1 ring-[#00636b]/30 bg-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {d.label}
                    </CardTitle>
                    {isToday && (
                      <Badge className="bg-[#00636b] text-white text-[10px]">
                        আজকের দিন
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {toBanglaNumber(items.length)} টি ক্লাস
                  </span>
                </CardHeader>
                <CardContent className="p-4">
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2 text-center">
                      এই বারে আপনার কোনো নির্ধারিত ক্লাস নেই
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((slot, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#00636b] transition space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-sm text-slate-800 truncate">
                              {slot.batchName}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {slot.batchCode}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[#00636b] font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {formatTo12h(slot.startTime)} –{" "}
                              {formatTo12h(slot.endTime)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>{slot.classLevel}</span>
                            {slot.roomNo && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {slot.roomNo}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
