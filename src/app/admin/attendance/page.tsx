"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  RefreshCw,
  Save,
  Users,
  Check,
  AlertCircle,
  Edit2,
  Printer,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

interface AcademicSessionItem {
  _id: string;
  name: string;
  isActive: boolean;
  status: string;
}

interface BatchItem {
  _id: string;
  name: string;
  code: string;
  capacity: number;
  classLevel: string;
  academicSession?: {
    _id: string;
    name: string;
  };
}

interface StudentRow {
  studentId: string;
  fullName: string;
  phone: string;
  rollNumber?: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

interface AttendanceRecord {
  _id: string;
  classDate: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
  student: {
    _id: string;
    fullName: string;
    studentId: string;
    phone?: string;
  };
  batch: {
    _id: string;
    name: string;
    code: string;
  };
  recordedBy?: {
    _id: string;
    fullName: string;
    role: string;
  };
  createdAt: string;
}

interface BatchStudentSummary {
  studentId: string;
  fullName: string;
  rollNumber?: string;
  phone?: string;
  totalClasses: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  countableClasses: number;
  effectiveAttendance: number;
  attendancePercentage: number;
}

export default function AttendanceManagementPage() {
  const dispatch = useAppDispatch();

  // Tab State
  const [activeTab, setActiveTab] = useState<"daily" | "summary" | "history">("daily");

  // Filter States: Academic Session, Batch, Date
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [classDate, setClassDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  // Tab 1: Daily Attendance Sheet States
  const [studentRows, setStudentRows] = useState<StudentRow[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetSaving, setSheetSaving] = useState(false);
  const [existingRecorded, setExistingRecorded] = useState(false);

  // Tab 2: Batch Attendance Summary States
  const [batchSummaries, setBatchSummaries] = useState<BatchStudentSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryStartDate, setSummaryStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split("T")[0];
  });
  const [summaryEndDate, setSummaryEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  // Tab 3: History & Correction States
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [editRecordModal, setEditRecordModal] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<"present" | "absent" | "late" | "excused">(
    "present"
  );
  const [editRemarks, setEditRemarks] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // 1. Initial Load: Academic Sessions & Active Batches
  useEffect(() => {
    fetch("/api/academic-sessions", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.length) {
          setSessions(json.data);
          const activeSess =
            json.data.find((s: AcademicSessionItem) => s.isActive) || json.data[0];
          setSelectedSessionId(activeSess._id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Batches when selectedSessionId changes
  useEffect(() => {
    const url = selectedSessionId
      ? `/api/batches?academicSession=${selectedSessionId}&status=active&limit=100`
      : `/api/batches?status=active&limit=100`;

    fetch(url, { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setBatches(json.data);
          if (json.data.length > 0) {
            setSelectedBatchId(json.data[0]._id);
          } else {
            setSelectedBatchId("");
          }
        }
      })
      .catch(() => {});
  }, [selectedSessionId]);

  // 3. Tab 1: Load Daily Attendance Sheet
  const loadDailySheet = useCallback(async () => {
    if (!selectedBatchId) {
      setStudentRows([]);
      return;
    }
    setSheetLoading(true);
    setExistingRecorded(false);

    try {
      // Step A: Fetch active enrolled students
      const enrRes = await fetch(
        `/api/enrollments?batch=${selectedBatchId}&status=active&limit=100`,
        { credentials: "include" }
      );
      const enrJson = await enrRes.json();
      const enrollments = enrJson.data || [];

      // Step B: Fetch existing attendance for this batch on selected classDate
      const attRes = await fetch(
        `/api/batches/${selectedBatchId}/attendance?date=${classDate}`,
        { credentials: "include" }
      );
      const attJson = await attRes.json();
      const existingAttendance = attJson.data || [];

      const existingMap = new Map<string, { status: string; remarks?: string }>();
      for (const item of existingAttendance) {
        const sId = typeof item.student === "object" ? item.student._id : item.student;
        existingMap.set(String(sId), {
          status: item.status,
          remarks: item.remarks,
        });
      }

      if (existingAttendance.length > 0) {
        setExistingRecorded(true);
      }

      // Step C: Map into rows
      const rows: StudentRow[] = enrollments.map(
        (enr: {
          student: { _id: string; fullName: string; phone?: string };
          rollNumber?: string;
        }) => {
          const sId = enr.student._id;
          const existing = existingMap.get(String(sId));
          return {
            studentId: sId,
            fullName: enr.student.fullName,
            phone: enr.student.phone || "",
            rollNumber: enr.rollNumber,
            status: (existing?.status as StudentRow["status"]) || "present",
            remarks: existing?.remarks || "",
          };
        }
      );

      setStudentRows(rows);
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "হাজিরা শিটের তথ্য লোড করা যায়নি।",
        })
      );
    } finally {
      setSheetLoading(false);
    }
  }, [selectedBatchId, classDate, dispatch]);

  useEffect(() => {
    if (activeTab === "daily" && selectedBatchId) {
      loadDailySheet();
    }
  }, [activeTab, selectedBatchId, classDate, loadDailySheet]);

  // Tab 1: Save Daily Attendance
  const handleSaveDailyAttendance = async () => {
    if (!selectedBatchId || studentRows.length === 0) return;

    setSheetSaving(true);
    try {
      const payload = {
        classDate,
        records: studentRows.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || undefined,
        })),
      };

      const res = await fetch(`/api/batches/${selectedBatchId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সংরক্ষণ সম্পন্ন",
          message: "ডিজিটাল ক্লাসের হাজিরা সফলভাবে ডাটাবেজে রেকর্ড করা হয়েছে।",
        })
      );
      setExistingRecorded(true);
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSheetSaving(false);
    }
  };

  // Bulk actions
  const markAllStatus = (status: "present" | "absent" | "excused") => {
    setStudentRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const updateIndividualStatus = (
    studentId: string,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    setStudentRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const updateIndividualRemarks = (studentId: string, remarks: string) => {
    setStudentRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r))
    );
  };

  // Tab 2: Load Batch Attendance Summary
  const loadBatchSummary = useCallback(async () => {
    if (!selectedBatchId) return;
    setSummaryLoading(true);

    try {
      // 1. Fetch active students in batch
      const enrRes = await fetch(
        `/api/enrollments?batch=${selectedBatchId}&status=active&limit=100`,
        { credentials: "include" }
      );
      const enrJson = await enrRes.json();
      const enrollments = enrJson.data || [];

      // 2. Fetch all attendance records for this batch in date range
      const params = new URLSearchParams({
        batch: selectedBatchId,
        startDate: summaryStartDate,
        endDate: summaryEndDate,
        limit: "1000",
      });

      const attRes = await fetch(`/api/attendance?${params.toString()}`, {
        credentials: "include",
      });
      const attJson = await attRes.json();
      const records: AttendanceRecord[] = attJson.data?.records || [];

      // Group attendance counts by studentId
      const studentMap = new Map<
        string,
        { present: number; late: number; absent: number; excused: number; total: number }
      >();

      for (const rec of records) {
        const sId = String(rec.student?._id || rec.student);
        if (!studentMap.has(sId)) {
          studentMap.set(sId, { present: 0, late: 0, absent: 0, excused: 0, total: 0 });
        }
        const item = studentMap.get(sId)!;
        item.total += 1;
        if (rec.status === "present") item.present += 1;
        else if (rec.status === "late") item.late += 1;
        else if (rec.status === "absent") item.absent += 1;
        else if (rec.status === "excused") item.excused += 1;
      }

      // Calculate percentage using documented rule
      const list: BatchStudentSummary[] = enrollments.map(
        (enr: {
          student: { _id: string; fullName: string; phone?: string };
          rollNumber?: string;
        }) => {
          const sId = enr.student._id;
          const counts = studentMap.get(String(sId)) || {
            present: 0,
            late: 0,
            absent: 0,
            excused: 0,
            total: 0,
          };

          const countable = counts.present + counts.late + counts.absent;
          const effective = counts.present + counts.late;
          const percentage =
            countable > 0 ? Math.round((effective / countable) * 100) : 100;

          return {
            studentId: sId,
            fullName: enr.student.fullName,
            rollNumber: enr.rollNumber,
            phone: enr.student.phone,
            totalClasses: counts.total,
            present: counts.present,
            late: counts.late,
            absent: counts.absent,
            excused: counts.excused,
            countableClasses: countable,
            effectiveAttendance: effective,
            attendancePercentage: percentage,
          };
        }
      );

      // Sort by roll number or name
      list.sort((a, b) => (Number(a.rollNumber) || 999) - (Number(b.rollNumber) || 999));
      setBatchSummaries(list);
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "হাজিরা পরিসংখ্যান তৈরি করা সম্ভব হয়নি।",
        })
      );
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedBatchId, summaryStartDate, summaryEndDate, dispatch]);

  useEffect(() => {
    if (activeTab === "summary" && selectedBatchId) {
      loadBatchSummary();
    }
  }, [activeTab, selectedBatchId, loadBatchSummary]);

  // Tab 3: Load Attendance History Records
  const loadHistoryRecords = useCallback(async () => {
    if (!selectedBatchId) return;
    setHistoryLoading(true);

    try {
      const params = new URLSearchParams({
        batch: selectedBatchId,
        limit: "100",
      });
      if (historySearch.trim()) {
        params.set("search", historySearch.trim());
      }

      const res = await fetch(`/api/attendance?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setHistoryRecords(json.data?.records || []);
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "হাজিরা ইতিহাস লোড করা যায়নি।",
        })
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedBatchId, historySearch, dispatch]);

  useEffect(() => {
    if (activeTab === "history" && selectedBatchId) {
      loadHistoryRecords();
    }
  }, [activeTab, selectedBatchId, loadHistoryRecords]);

  // Tab 3: Open Correction Modal
  const openCorrectionModal = (record: AttendanceRecord) => {
    setEditRecordModal(record);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || "");
  };

  // Tab 3: Save Individual Correction
  const handleSaveCorrection = async () => {
    if (!editRecordModal) return;
    setEditSaving(true);

    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          attendanceId: editRecordModal._id,
          status: editStatus,
          remarks: editRemarks,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "হাজিরা সংশোধন করা যায়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সংশোধন সফল",
          message: "হাজিরার স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।",
        })
      );

      setEditRecordModal(null);
      loadHistoryRecords();
      if (activeTab === "daily") loadDailySheet();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    } finally {
      setEditSaving(false);
    }
  };

  // Metrics for Tab 1
  const presentCount = studentRows.filter((r) => r.status === "present").length;
  const lateCount = studentRows.filter((r) => r.status === "late").length;
  const absentCount = studentRows.filter((r) => r.status === "absent").length;
  const excusedCount = studentRows.filter((r) => r.status === "excused").length;
  const totalStudents = studentRows.length;
  const dailyCountable = presentCount + lateCount + absentCount;
  const dailyRate =
    dailyCountable > 0
      ? Math.round(((presentCount + lateCount) / dailyCountable) * 100)
      : 100;

  const currentBatch = batches.find((b) => b._id === selectedBatchId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="উপস্থিতি ব্যবস্থাপনা (Attendance Register)"
        subtitle="একাডেমিক সেশন ও ব্যাচভিত্তিক ডিজিটাল দৈনিক হাজিরা, পরিসংখ্যান ও রেকর্ড সংশোধন"
        breadcrumbs={[
          { label: "ড্যাশবোর্ড", href: "/admin" },
          { label: "হাজিরা ব্যবস্থাপনা" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeTab === "daily") loadDailySheet();
                else if (activeTab === "summary") loadBatchSummary();
                else loadHistoryRecords();
              }}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>রিফ্রেশ</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>প্রিন্ট শিট</span>
            </Button>
          </div>
        }
      />

      {/* Primary Selection Controls: Session, Batch, Date */}
      <Card className="border-slate-200">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* Academic Session */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                শিক্ষাবর্ষ / সেশন নির্বাচন
              </label>
              <Select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                options={
                  sessions.length > 0
                    ? sessions.map((s) => ({
                        value: s._id,
                        label: `${s.name} ${s.isActive ? " (সক্রিয়)" : ""}`,
                      }))
                    : [{ value: "", label: "সেশন লোড হচ্ছে..." }]
                }
              />
            </div>

            {/* Batch Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ব্যাচ নির্বাচন
              </label>
              <Select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                options={
                  batches.length > 0
                    ? batches.map((b) => ({
                        value: b._id,
                        label: `${b.name} (${b.classLevel}) - ${b.code}`,
                      }))
                    : [{ value: "", label: "কোনো সক্রিয় ব্যাচ পাওয়া যায়নি" }]
                }
              />
            </div>

            {/* Class Date Picker (For Daily Tab) */}
            {activeTab === "daily" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ক্লাসের তারিখ (Class Date)
                </label>
                <Input
                  type="date"
                  value={classDate}
                  onChange={(e) => setClassDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    শুরুর তারিখ
                  </label>
                  <Input
                    type="date"
                    value={summaryStartDate}
                    onChange={(e) => setSummaryStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    শেষ তারিখ
                  </label>
                  <Input
                    type="date"
                    value={summaryEndDate}
                    onChange={(e) => setSummaryEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("daily")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
            activeTab === "daily"
              ? "border-[#00636b] text-[#00636b]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>দৈনিক ডিজিটাল হাজিরা ইনপুট</span>
        </button>

        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
            activeTab === "summary"
              ? "border-[#00636b] text-[#00636b]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>ব্যাচ হাজিরা বিবরণী ও সামারি</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition cursor-pointer ${
            activeTab === "history"
              ? "border-[#00636b] text-[#00636b]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>রেকর্ড ইতিহাস ও একক সংশোধন</span>
        </button>
      </div>

      {/* TAB 1: DAILY ATTENDANCE REGISTER */}
      {activeTab === "daily" && (
        <div className="space-y-5">
          {existingRecorded && (
            <Alert variant="info" title="পূর্বনির্ধারিত হাজিরা রক্ষিত আছে" dismissible>
              এই ব্যাচে {formatBanglaDate(classDate)} তারিখের ক্লাসের হাজিরা ইতোমধ্যে
              ডাটাবেজে রেকর্ড করা হয়েছে। যেকোনো পরিবর্তন করে নিচে &quot;হাজিরা সংরক্ষণ
              করুন&quot; বোতামে চাপলে তা স্বয়ংক্রিয়ভাবে আপডেট হবে।
            </Alert>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="p-3 bg-emerald-50/50 border-emerald-100">
              <span className="text-xs text-emerald-800 font-medium">
                উপস্থিত (Present)
              </span>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {toBanglaNumber(presentCount)} জন
              </p>
            </Card>
            <Card className="p-3 bg-amber-50/50 border-amber-100">
              <span className="text-xs text-amber-800 font-medium">বিলম্ব (Late)</span>
              <p className="text-xl font-bold text-amber-700 mt-1">
                {toBanglaNumber(lateCount)} জন
              </p>
            </Card>
            <Card className="p-3 bg-rose-50/50 border-rose-100">
              <span className="text-xs text-rose-800 font-medium">
                অনুপস্থিত (Absent)
              </span>
              <p className="text-xl font-bold text-rose-700 mt-1">
                {toBanglaNumber(absentCount)} জন
              </p>
            </Card>
            <Card className="p-3 bg-slate-50 border-slate-200">
              <span className="text-xs text-slate-600 font-medium">ছুটি (Excused)</span>
              <p className="text-xl font-bold text-slate-700 mt-1">
                {toBanglaNumber(excusedCount)} জন
              </p>
            </Card>
            <Card className="p-3 bg-[#eff8f9] border-[#d7eef1] col-span-2 sm:col-span-1">
              <span className="text-xs text-[#00636b] font-medium">উপস্থিতির হার</span>
              <p className="text-xl font-bold text-[#00636b] mt-1">
                {toBanglaNumber(dailyRate)}%
              </p>
            </Card>
          </div>

          {/* Bulk Actions Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">
                দ্রুত চিহ্নিতকরণ (Bulk Actions):
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllStatus("present")}
                className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                সবাই উপস্থিত
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllStatus("absent")}
                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                সবাই অনুপস্থিত
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllStatus("excused")}
                className="text-xs text-slate-700 border-slate-300 hover:bg-slate-100"
              >
                সবাই ছুটি
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              isLoading={sheetSaving}
              onClick={handleSaveDailyAttendance}
              className="gap-1.5 w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              <span>হাজিরা সংরক্ষণ করুন</span>
            </Button>
          </div>

          {/* Table Container */}
          <Card className="overflow-hidden border-slate-200">
            <div className="overflow-x-auto min-w-[750px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3 w-16 text-center">রোল নং</th>
                    <th className="p-3">শিক্ষার্থীর নাম</th>
                    <th className="p-3">মোবাইল নম্বর</th>
                    <th className="p-3 text-center">উপস্থিতি স্ট্যাটাস (Status)</th>
                    <th className="p-3 w-56">মন্তব্য (Remarks)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheetLoading ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ) : studentRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {selectedBatchId
                          ? "এই ব্যাচে কোনো সক্রিয় ভর্তি পাওয়া যায়নি।"
                          : "অনুগ্রহ করে একটি ব্যাচ নির্বাচন করুন।"}
                      </td>
                    </tr>
                  ) : (
                    studentRows.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-bold text-slate-800">
                          {row.rollNumber ? toBanglaNumber(row.rollNumber) : "—"}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">{row.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            আইডি: {row.studentId}
                          </p>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">
                          {row.phone ? toBanglaNumber(row.phone) : "—"}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateIndividualStatus(row.studentId, "present")
                              }
                              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                                row.status === "present"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              উপস্থিত
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateIndividualStatus(row.studentId, "late")
                              }
                              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                                row.status === "late"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              বিলম্ব
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateIndividualStatus(row.studentId, "absent")
                              }
                              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                                row.status === "absent"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              অনুপস্থিত
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateIndividualStatus(row.studentId, "excused")
                              }
                              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                                row.status === "excused"
                                  ? "bg-slate-700 text-white shadow-xs"
                                  : "text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              ছুটি
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <Input
                            placeholder="প্রয়োজনীয় মন্তব্য..."
                            value={row.remarks || ""}
                            onChange={(e) =>
                              updateIndividualRemarks(row.studentId, e.target.value)
                            }
                            className="h-8 text-xs"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {studentRows.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  মোট সক্রিয় শিক্ষার্থী: {toBanglaNumber(totalStudents)} জন
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={sheetSaving}
                  onClick={handleSaveDailyAttendance}
                  className="gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>হাজিরা সংরক্ষণ করুন</span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: BATCH ATTENDANCE SUMMARY & PERCENTAGES */}
      {activeTab === "summary" && (
        <div className="space-y-4">
          <Alert
            variant="info"
            title="উপস্থিতির শতকরা হার গণনা নীতি (Documented Formula)"
          >
            <p className="mt-1 leading-relaxed">
              <strong>গণনা সূত্র:</strong> উপস্থিতির হার (%) = (উপস্থিত + বিলম্ব) ÷ মোট
              গণনাযোগ্য ক্লাস (উপস্থিত + বিলম্ব + অনুপস্থিত) × ১০০।
              <br />
              <em>
                * অনুমোদিত ছুটি (Excused)-কে অনুপস্থিতি হিসেবে গণনা করে শিক্ষার্থীর
                উপস্থিতির হার কমানো হয় না।
              </em>
            </p>
          </Alert>

          <Card className="overflow-hidden border-slate-200">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  ব্যাচ হাজিরা বিবরণী: {currentBatch?.name}
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  সময়কাল: {formatBanglaDate(summaryStartDate)} থেকে{" "}
                  {formatBanglaDate(summaryEndDate)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadBatchSummary}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>রিপোর্ট রিফ্রেশ</span>
              </Button>
            </CardHeader>

            <div className="overflow-x-auto min-w-[800px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3 w-16 text-center">রোল</th>
                    <th className="p-3">শিক্ষার্থীর নাম</th>
                    <th className="p-3 text-center">মোট ক্লাস</th>
                    <th className="p-3 text-center text-emerald-700">উপস্থিত</th>
                    <th className="p-3 text-center text-amber-700">বিলম্ব</th>
                    <th className="p-3 text-center text-rose-700">অনুপস্থিত</th>
                    <th className="p-3 text-center text-slate-600">ছুটি</th>
                    <th className="p-3 text-center">উপস্থিতির শতকরা হার</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryLoading ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ) : batchSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        নির্বাচিত সময়কালের মধ্যে কোনো হাজিরার রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    batchSummaries.map((item) => (
                      <tr key={item.studentId} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center font-bold text-slate-800">
                          {item.rollNumber ? toBanglaNumber(item.rollNumber) : "—"}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">{item.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            আইডি: {item.studentId}
                          </p>
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-800">
                          {toBanglaNumber(item.totalClasses)}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                          {toBanglaNumber(item.present)}
                        </td>
                        <td className="p-3 text-center font-bold text-amber-600 bg-amber-50/30">
                          {toBanglaNumber(item.late)}
                        </td>
                        <td className="p-3 text-center font-bold text-rose-600 bg-rose-50/30">
                          {toBanglaNumber(item.absent)}
                        </td>
                        <td className="p-3 text-center font-medium text-slate-600">
                          {toBanglaNumber(item.excused)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              item.attendancePercentage >= 80
                                ? "success"
                                : item.attendancePercentage >= 65
                                  ? "gold"
                                  : "danger"
                            }
                            className="font-bold text-xs"
                          >
                            {toBanglaNumber(item.attendancePercentage)}%
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: HISTORY & INDIVIDUAL CORRECTION */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="শিক্ষার্থীর নাম বা আইডি দিয়ে খুঁজুন..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistoryRecords}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>রিফ্রেশ</span>
            </Button>
          </div>

          <Card className="overflow-hidden border-slate-200">
            <div className="overflow-x-auto min-w-[800px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3">তারিখ</th>
                    <th className="p-3">শিক্ষার্থী</th>
                    <th className="p-3">ব্যাচ</th>
                    <th className="p-3 text-center">হাজিরা স্ট্যাটাস</th>
                    <th className="p-3">লিপিবদ্ধকারী (Recorded By)</th>
                    <th className="p-3">মন্তব্য</th>
                    <th className="p-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ) : historyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        কোনো অতীত হাজিরার রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    historyRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          {formatBanglaDate(rec.classDate)}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">
                            {rec.student?.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            আইডি: {rec.student?.studentId}
                          </p>
                        </td>
                        <td className="p-3 text-slate-600">{rec.batch?.name}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              rec.status === "present"
                                ? "success"
                                : rec.status === "late"
                                  ? "gold"
                                  : rec.status === "absent"
                                    ? "danger"
                                    : "default"
                            }
                          >
                            {rec.status === "present"
                              ? "উপস্থিত"
                              : rec.status === "late"
                                ? "বিলম্ব"
                                : rec.status === "absent"
                                  ? "অনুপস্থিত"
                                  : "ছুটি"}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600">
                          {rec.recordedBy?.fullName ? (
                            <>
                              <span className="font-medium text-slate-800">
                                {rec.recordedBy.fullName}
                              </span>
                              <span className="block text-[10px] text-slate-400 capitalize">
                                ({rec.recordedBy.role})
                              </span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-3 text-slate-500">{rec.remarks || "—"}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCorrectionModal(rec)}
                            className="gap-1 text-xs"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>সংশোধন</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* INDIVIDUAL CORRECTION DIALOG */}
      <Dialog
        isOpen={Boolean(editRecordModal)}
        onClose={() => setEditRecordModal(null)}
        title="হাজিরা রেকর্ড সংশোধন (Edit Attendance Record)"
        description="পূর্বের গৃহীত হাজিরার ভুল সংশোধন করুন। এই পরিবর্তনের সাথে আপনার তথ্য লিপিবদ্ধ থাকবে।"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditRecordModal(null)}>
              বাতিল
            </Button>
            <Button
              variant="primary"
              isLoading={editSaving}
              onClick={handleSaveCorrection}
            >
              সংরক্ষণ করুন
            </Button>
          </>
        }
      >
        {editRecordModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <p>
                <strong>শিক্ষার্থী:</strong> {editRecordModal.student?.fullName} (আইডি:{" "}
                {editRecordModal.student?.studentId})
              </p>
              <p>
                <strong>তারিখ:</strong> {formatBanglaDate(editRecordModal.classDate)}
              </p>
              <p>
                <strong>ব্যাচ:</strong> {editRecordModal.batch?.name}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                সংশোধিত স্ট্যাটাস
              </label>
              <Select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(
                    e.target.value as "present" | "absent" | "late" | "excused"
                  )
                }
                options={[
                  { value: "present", label: "উপস্থিত (Present)" },
                  { value: "late", label: "বিলম্ব (Late)" },
                  { value: "absent", label: "অনুপস্থিত (Absent)" },
                  { value: "excused", label: "ছুটি (Excused)" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                সংশোধনের কারণ / মন্তব্য (Remarks)
              </label>
              <Input
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="যেমন: ভুলবশত অনুপস্থিত দাগানো হয়েছিল..."
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
