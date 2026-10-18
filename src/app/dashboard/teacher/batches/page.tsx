"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Clock,
  UserCheck,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toBanglaNumber } from "@/lib/utils";

export default function TeacherBatchesPage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/batches");
      const json = await res.json();
      if (json.success && json.data) {
        setBatches(json.data);
        if (json.data.length > 0) {
          setSelectedBatchId(json.data[0]._id);
        }
      }
    } catch {
      setError("ব্যাচ তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const fetchEnrolledStudents = useCallback(async (batchId: string) => {
    if (!batchId) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/enrollments?batch=${batchId}&status=active`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
      }
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchEnrolledStudents(selectedBatchId);
    }
  }, [selectedBatchId, fetchEnrolledStudents]);

  const currentBatch = batches.find((b) => b._id === selectedBatchId);

  const filteredStudents = students.filter((item) => {
    const sName = item.student?.fullName || "";
    const sCode = item.student?.studentId || "";
    const sRoll = item.rollNumber || "";
    const query = search.toLowerCase();
    return (
      sName.toLowerCase().includes(query) ||
      sCode.toLowerCase().includes(query) ||
      sRoll.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="আমার নির্ধারিত ব্যাচ ও শিক্ষার্থী তালিকা"
        subtitle="আপনার অধীনে থাকা ব্যাচসমূহের বিবরণ ও শিক্ষার্থীদের তালিকা পর্যবেক্ষণ করুন"
        breadcrumbs={[
          { label: "শিক্ষক ড্যাশবোর্ড", href: "/dashboard/teacher" },
          { label: "নির্ধারিত ব্যাচসমূহ" },
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
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : batches.length === 0 ? (
        <Card className="border-slate-200 text-center py-12">
          <CardContent className="space-y-3">
            <Users className="h-12 w-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              আপনাকে এখনও কোনো ব্যাচে দায়িত্ব প্রদান করা হয়নি
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              নতুন সেশন বা ব্যাচ শুরু হলে অ্যাডমিন কর্তৃক নির্ধারিত হওয়ার পর এখানে
              স্বয়ংক্রিয়ভাবে শিক্ষার্থীদের তালিকা দেখা যাবে।
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Batch Selector Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl">
            {batches.map((b) => (
              <button
                key={b._id}
                onClick={() => setSelectedBatchId(b._id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  selectedBatchId === b._id
                    ? "bg-[#00636b] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <span>{b.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    selectedBatchId === b._id
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {b.code}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Batch Details Bar */}
          {currentBatch && (
            <Card className="border-slate-200 shadow-2xs bg-white">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {currentBatch.name}
                    </h3>
                    <Badge variant="outline">{currentBatch.code}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {currentBatch.classLevel}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>
                      <strong>বিষয়:</strong> {currentBatch.subjects?.join(", ")}
                    </span>
                    <span>
                      <strong>সর্বোচ্চ আসন:</strong>{" "}
                      {toBanglaNumber(currentBatch.capacity)} জন
                    </span>
                    <span>
                      <strong>বর্তমান শিক্ষার্থী:</strong>{" "}
                      {toBanglaNumber(students.length)} জন
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/dashboard/teacher/attendance?batch=${currentBatch._id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs flex items-center gap-1.5"
                    >
                      <CalendarCheck className="h-4 w-4" />
                      <span>হাজিরা গ্রহণ</span>
                    </Button>
                  </Link>
                  <Link href={`/dashboard/teacher/exams?batch=${currentBatch._id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1.5"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span>নম্বর প্রদান</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Students Table */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[#00636b]" />
                  <span>
                    অন্তর্ভুক্ত শিক্ষার্থীদের তালিকা (
                    {toBanglaNumber(filteredStudents.length)} জন)
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  এই ব্যাচে নিয়মিত অধ্যয়নরত শিক্ষার্থীদের অ্যাকাডেমিক বিবরণ
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="p-8 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {search
                      ? "অনুসন্ধানের সাথে মিল পাওয়া যায়নি।"
                      : "এই ব্যাচে এখনও কোনো শিক্ষার্থী ভর্তি হয়নি।"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">আইডি</th>
                        <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                        <th className="py-3 px-4">রোল নম্বর</th>
                        <th className="py-3 px-4">স্কুল / কলেজ</th>
                        <th className="py-3 px-4">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((enroll) => (
                        <tr key={enroll._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4 font-mono font-medium text-[#00636b]">
                            {enroll.student?.studentId || "N/A"}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {enroll.student?.fullName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {enroll.rollNumber ? toBanglaNumber(enroll.rollNumber) : "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {enroll.student?.institutionName || "সাধারণ"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              অধ্যয়নরত
                            </span>
                          </td>
                        </tr>
                      ))}
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
