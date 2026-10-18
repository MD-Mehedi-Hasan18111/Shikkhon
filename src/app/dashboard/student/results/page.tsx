"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

export default function StudentResultsPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/results");
      const json = await res.json();
      if (json.success && json.data) {
        setResults(json.data);
      }
    } catch {
      setError("ফলাফল লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Calculate summaries
  const totalExams = results.length;
  let totalPctSum = 0;
  let highestMarks = 0;

  results.forEach((r) => {
    const max = r.exam?.maximumMarks || 100;
    const obtained = r.obtainedMarks || 0;
    if (obtained > highestMarks) highestMarks = obtained;
    totalPctSum += (obtained / max) * 100;
  });

  const avgPercentage = totalExams > 0 ? Math.round(totalPctSum / totalExams) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="পরীক্ষার প্রকাশিত ফলাফল ও গ্রেডশিট"
        subtitle="সাপ্তাহিক মূল্যায়ন ও মডেল টেস্টের প্রাপ্ত নম্বর, গ্রেড এবং শিক্ষকের মন্তব্য"
        breadcrumbs={[
          { label: "শিক্ষার্থী ড্যাশবোর্ড", href: "/dashboard/student" },
          { label: "পরীক্ষার ফলাফল" },
        ]}
        actions={
          results.length > 0 ? (
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-1.5 print:hidden"
            >
              <Printer className="h-4 w-4" />
              <span>রিপোর্ট প্রিন্ট করুন</span>
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : results.length === 0 ? (
        <Card className="border-slate-200 text-center py-16">
          <CardContent className="space-y-3">
            <Award className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              এখনও কোনো পরীক্ষার ফলাফল প্রকাশিত হয়নি
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              মডেল টেস্ট ও সাপ্তাহিক পরীক্ষার খাতা মূল্যায়নের পর শিক্ষক কর্তৃক ফলাফল
              অনুমোদন হলে তা এখানে প্রদর্শিত হবে।
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 shadow-2xs">
              <CardContent className="p-5 text-center">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  মোট প্রকাশিত পরীক্ষা
                </span>
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {toBanglaNumber(totalExams)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">টি পরীক্ষা</span>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs bg-amber-50/40">
              <CardContent className="p-5 text-center">
                <span className="text-xs font-semibold text-amber-800 block mb-1">
                  সর্বোচ্চ প্রাপ্ত নম্বর
                </span>
                <span className="text-3xl font-extrabold text-amber-700 font-mono">
                  {toBanglaNumber(highestMarks)}
                </span>
                <span className="text-[11px] text-amber-600 block mt-1">
                  পূর্ণমান থেকে
                </span>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-2xs bg-emerald-50/40">
              <CardContent className="p-5 text-center">
                <span className="text-xs font-semibold text-emerald-800 block mb-1">
                  গড় সাফল্যের হার
                </span>
                <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                  %{toBanglaNumber(avgPercentage)}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">
                  ওভারঅল স্কোর
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>পরীক্ষার ফলাফল তালিকা</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">তারিখ</th>
                      <th className="py-3 px-4">পরীক্ষার শিরোনাম</th>
                      <th className="py-3 px-4">বিষয় ও ব্যাচ</th>
                      <th className="py-3 px-4 text-center">পূর্ণমান</th>
                      <th className="py-3 px-4 text-center">প্রাপ্ত নম্বর</th>
                      <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                      <th className="py-3 px-4">শিক্ষকের মূল্যায়ন মন্তব্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r) => {
                      const max = r.exam?.maximumMarks || 100;
                      const pass = r.exam?.passMarks ?? 40;
                      const isPassed = !r.isAbsent && r.obtainedMarks >= pass;

                      return (
                        <tr key={r._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {formatBanglaDate(r.exam?.examDate || r.createdAt)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {r.exam?.title || "পরীক্ষা"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {r.exam?.subject}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {r.exam?.batch?.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {toBanglaNumber(max)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.isAbsent ? (
                              <span className="text-rose-600 font-bold text-xs">
                                অনুপস্থিত
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-base text-slate-900">
                                {toBanglaNumber(r.obtainedMarks)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {r.isAbsent ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-rose-50 text-rose-700 border-rose-200"
                              >
                                অনুপস্থিত
                              </Badge>
                            ) : isPassed ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200"
                              >
                                উত্তীর্ণ
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-rose-50 text-rose-800 border-rose-200"
                              >
                                অনুত্তীর্ণ
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 leading-relaxed">
                            {r.feedback ? (
                              <span className="italic">&quot;{r.feedback}&quot;</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
