"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarCheck,
  Calendar,
  Save,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface StudentRecord {
  studentId: string;
  name: string;
  rollNumber: string;
  studentCode: string;
  status: AttendanceStatus;
  remarks: string;
}

export default function TeacherAttendancePage() {
  const dispatch = useAppDispatch();

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch Teacher's assigned batches
  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
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
      setError("ব্যাচ তালিকা লোড করা যায়নি।");
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Load students and existing attendance for selected batch and date
  const loadBatchAttendance = useCallback(async () => {
    if (!selectedBatchId) return;
    setLoadingStudents(true);
    setError(null);
    try {
      // 1. Fetch active enrollments
      const enrollRes = await fetch(
        `/api/enrollments?batch=${selectedBatchId}&status=active`
      );
      const enrollJson = await enrollRes.json();

      if (!enrollJson.success || !enrollJson.data) {
        setRecords([]);
        return;
      }

      const enrolledList: any[] = enrollJson.data;

      // 2. Fetch existing attendance records for this date
      const attRes = await fetch(
        `/api/attendance?batch=${selectedBatchId}&startDate=${selectedDate}&endDate=${selectedDate}`
      );
      const attJson = await attRes.json();
      const existingMap: Record<string, { status: AttendanceStatus; remarks?: string }> =
        {};

      if (attJson.success && attJson.data?.records) {
        attJson.data.records.forEach((r: any) => {
          const sId = r.student?._id || r.student;
          existingMap[String(sId)] = {
            status: r.status,
            remarks: r.remarks || "",
          };
        });
      }

      // Map to local state
      const initialRecords: StudentRecord[] = enrolledList.map((e) => {
        const sId = String(e.student?._id || e.student);
        const existing = existingMap[sId];
        return {
          studentId: sId,
          name: e.student?.fullName || "শিক্ষার্থী",
          rollNumber: e.rollNumber ? String(e.rollNumber) : "",
          studentCode: e.student?.studentId || "N/A",
          status: existing ? existing.status : "present", // default to present for quick marking
          remarks: existing?.remarks || "",
        };
      });

      setRecords(initialRecords);
    } catch {
      setError("শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedBatchId, selectedDate]);

  useEffect(() => {
    loadBatchAttendance();
  }, [loadBatchAttendance]);

  const setStatusForStudent = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const markAllAs = (status: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatchId || records.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        classDate: selectedDate,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || undefined,
        })),
      };

      const res = await fetch(`/api/batches/${selectedBatchId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "হাজিরা সংরক্ষণ ব্যর্থ হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সংরক্ষণ সফল!",
          message: "হাজিরা সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে।",
        })
      );
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const currentBatch = batches.find((b) => b._id === selectedBatchId);

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const excusedCount = records.filter((r) => r.status === "excused").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="দৈনিক হাজিরা গ্রহণ ও রেজিস্টার"
        subtitle="নির্ধারিত ব্যাচের শিক্ষার্থীদের আজকের ক্লাসের উপস্থিতি চিহ্নিত ও সংরক্ষণ করুন"
        breadcrumbs={[
          { label: "শিক্ষক ড্যাশবোর্ড", href: "/dashboard/teacher" },
          { label: "হাজিরা গ্রহণ" },
        ]}
        actions={
          <Button
            onClick={handleSaveAttendance}
            disabled={saving || records.length === 0}
            variant="primary"
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : "হাজিরা সংরক্ষণ করুন"}</span>
          </Button>
        }
      />

      {/* Control Bar: Select Batch and Date */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ব্যাচ নির্বাচন করুন
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                disabled={loadingBatches || batches.length === 0}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
              >
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code}) - {b.classLevel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ক্লাসের তারিখ
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b] focus:bg-white transition"
              />
            </div>

            <div className="flex items-end">
              <div className="flex flex-wrap items-center gap-1.5 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllAs("present")}
                  className="text-[11px] py-1 px-2.5 h-8 bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                >
                  সবাই উপস্থিত
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllAs("absent")}
                  className="text-[11px] py-1 px-2.5 h-8 bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                >
                  সবাই অনুপস্থিত
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Chips */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[11px] text-emerald-700 font-medium block">
              উপস্থিত
            </span>
            <span className="text-xl font-bold text-emerald-900 font-mono">
              {toBanglaNumber(presentCount)}
            </span>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <span className="text-[11px] text-rose-700 font-medium block">অনুপস্থিত</span>
            <span className="text-xl font-bold text-rose-900 font-mono">
              {toBanglaNumber(absentCount)}
            </span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-[11px] text-amber-700 font-medium block">বিলম্ব</span>
            <span className="text-xl font-bold text-amber-900 font-mono">
              {toBanglaNumber(lateCount)}
            </span>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-[11px] text-blue-700 font-medium block">ছুটি</span>
            <span className="text-xl font-bold text-blue-900 font-mono">
              {toBanglaNumber(excusedCount)}
            </span>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-[#00636b]" />
              <span>শিক্ষার্থী তালিকা ({toBanglaNumber(records.length)} জন)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingStudents ? (
            <div className="p-8 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 mt-0.5">
                এই ব্যাচে এখনও কোনো সক্রিয় শিক্ষার্থী নেই।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">রোল</th>
                    <th className="py-3 px-4">আইডি</th>
                    <th className="py-3 px-4">শিক্ষার্থীর নাম</th>
                    <th className="py-3 px-4 text-center">উপস্থিতি চিহ্নিত করুন</th>
                    <th className="py-3 px-4">মন্তব্য (ঐচ্ছিক)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((student) => (
                    <tr
                      key={student.studentId}
                      className={`transition ${
                        student.status === "absent"
                          ? "bg-rose-50/30"
                          : student.status === "late"
                            ? "bg-amber-50/30"
                            : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {student.rollNumber ? toBanglaNumber(student.rollNumber) : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#00636b]">
                        {student.studentCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setStatusForStudent(student.studentId, "present")
                            }
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                              student.status === "present"
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-emerald-700"
                            }`}
                          >
                            উপস্থিত
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStatusForStudent(student.studentId, "absent")
                            }
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                              student.status === "absent"
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-rose-700"
                            }`}
                          >
                            অনুপস্থিত
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(student.studentId, "late")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                              student.status === "late"
                                ? "bg-amber-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-amber-700"
                            }`}
                          >
                            বিলম্ব
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStatusForStudent(student.studentId, "excused")
                            }
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                              student.status === "excused"
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-blue-700"
                            }`}
                          >
                            ছুটি
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="যেমন: অসুস্থতা..."
                          value={student.remarks}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRecords((prev) =>
                              prev.map((r) =>
                                r.studentId === student.studentId
                                  ? { ...r, remarks: val }
                                  : r
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                        />
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
  );
}
