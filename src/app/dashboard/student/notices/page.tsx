"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Calendar,
  Pin,
  Search,
  AlertCircle,
  FileText,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBanglaDate, toBanglaNumber } from "@/lib/utils";

export default function StudentNoticesPage() {
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [noticesRes, eventsRes] = await Promise.all([
        fetch("/api/notices"),
        fetch("/api/events"),
      ]);

      const [noticesJson, eventsJson] = await Promise.all([
        noticesRes.json(),
        eventsRes.json(),
      ]);

      if (noticesJson.success) {
        setNotices(noticesJson.data || []);
      }
      if (eventsJson.success) {
        setEvents(eventsJson.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredNotices = notices.filter((n) => {
    const matchSearch =
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.content?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter ? n.priority === priorityFilter : true;
    return matchSearch && matchPriority;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="নোটিশ বোর্ড ও একাডেমি ইভেন্ট"
        subtitle="ক্লাস ছুটি, পরীক্ষার রুটিন ও প্রাতিষ্ঠানিক সকল অফিসিয়াল বিজ্ঞপ্তি"
        breadcrumbs={[
          { label: "শিক্ষার্থী ড্যাশবোর্ড", href: "/dashboard/student" },
          { label: "নোটিশ ও ইভেন্ট" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Notices Section (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  বিজ্ঞপ্তিসমূহ ({toBanglaNumber(filteredNotices.length)} টি)
                </CardTitle>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-700"
                >
                  <option value="">সকল গুরুত্ব</option>
                  <option value="urgent">জরুরি</option>
                  <option value="important">গুরুত্বপূর্ণ</option>
                  <option value="normal">সাধারণ</option>
                </select>

                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="খুঁজুন..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-700"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredNotices.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">কোনো নোটিশ পাওয়া যায়নি</p>
                </div>
              ) : (
                filteredNotices.map((n) => (
                  <div
                    key={n._id}
                    className={`p-4 rounded-xl border transition ${
                      n.isPinned
                        ? "border-primary-300 bg-primary-50/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {n.isPinned && (
                          <Badge className="bg-primary-900 text-white text-[10px] flex items-center gap-1">
                            <Pin className="h-3 w-3" />
                            <span>পিন করা</span>
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            n.priority === "urgent"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : n.priority === "important"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50 text-slate-700"
                          }`}
                        >
                          {n.priority === "urgent"
                            ? "জরুরি"
                            : n.priority === "important"
                              ? "গুরুত্বপূর্ণ"
                              : "সাধারণ"}
                        </Badge>
                      </div>

                      <span className="text-xs text-slate-400">
                        {formatBanglaDate(n.publishedAt || n.createdAt)}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 mb-1">{n.title}</h4>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span>আসন্ন একাডেমি ইভেন্ট</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {loading ? (
                <Skeleton className="h-28 w-full" />
              ) : events.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  বর্তমানে কোনো কর্মসূচি নেই
                </p>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt._id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5"
                  >
                    <span className="text-[10px] font-semibold text-primary-800 block">
                      {formatBanglaDate(evt.startDate)}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900">{evt.title}</h5>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
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
