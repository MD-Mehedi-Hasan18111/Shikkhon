"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Award,
  Calendar,
  BookOpen,
  Printer,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";
import {
  calculateGradeAndGpa,
  DEFAULT_BANGLADESH_GRADING_SCALE,
} from "@/config/grading-scale";

interface ExamItem {
  _id: string;
  title: string;
  subject: string;
  examDate: string;
  maximumMarks: number;
  passMarks?: number;
  examType: "weekly" | "monthly" | "model_test" | "term";
  publicationStatus: "draft" | "published" | "archived";
  batch: {
    _id: string;
    name: string;
    code: string;
    classLevel: string;
  };
}

interface StudentMarkRow {
  studentId: string;
  fullName: string;
  phone: string;
  rollNumber?: string;
  obtainedMarks: number;
  feedback?: string;
}

interface MeritResultItem {
  _id: string;
  student?: {
    _id: string;
    fullName: string;
    studentId?: string;
    phone?: string;
    rollNumber?: string;
  };
  obtainedMarks: number;
  grade?: string;
  highestMarksInBatch?: number;
  feedback?: string;
}

export default function ExamManagementPage() {
  const dispatch = useAppDispatch();

  // List States
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExams, setTotalExams] = useState(0);

  // Filters
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Supporting Batches
  const [batches, setBatches] = useState<
    Array<{ _id: string; name: string; code: string; classLevel: string }>
  >([]);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [marksDialogOpen, setMarksDialogOpen] = useState(false);
  const [meritDialogOpen, setMeritDialogOpen] = useState(false);
  const [printSheetOpen, setPrintSheetOpen] = useState(false);

  const [targetExam, setTargetExam] = useState<ExamItem | null>(null);

  // Form State for Creating Exam
  const [formData, setFormData] = useState({
    batch: "",
    subject: "পদার্থবিজ্ঞান",
    title: "",
    examDate: new Date().toISOString().split("T")[0],
    maximumMarks: 100,
    passMarks: 40,
    examType: "weekly",
  });
  const [submitting, setSubmitting] = useState(false);

  // Marks Entry States
  const [markRows, setMarkRows] = useState<StudentMarkRow[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksSaving, setMarksSaving] = useState(false);

  // Merit List State
  const [meritList, setMeritList] = useState<MeritResultItem[]>([]);
  const [meritLoading, setMeritLoading] = useState(false);

  // 1. Fetch Batches on mount
  useEffect(() => {
    fetch("/api/batches?status=active&limit=100", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setBatches(json.data);
          if (json.data.length > 0 && !formData.batch) {
            setFormData((prev) => ({ ...prev, batch: json.data[0]._id }));
          }
        }
      })
      .catch(() => {});
  }, [formData.batch]);

  // 2. Fetch Exams
  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (selectedBatchFilter) params.set("batch", selectedBatchFilter);
      if (statusFilter) params.set("publicationStatus", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/exams?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "পরীক্ষার তালিকা লোড করা যায়নি।");
      }
      setExams(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalExams(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page, selectedBatchFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // 3. Create Exam Handler
  const handleCreateExam = async () => {
    if (!formData.title.trim() || !formData.batch || !formData.subject.trim()) {
      dispatch(
        addNotification({
          type: "warning",
          title: "অসম্পূর্ণ তথ্য",
          message: "অনুগ্রহ করে পরীক্ষার শিরোনাম, ব্যাচ এবং বিষয় পূরণ করুন।",
        })
      );
      return;
    }

    if (formData.passMarks > formData.maximumMarks) {
      dispatch(
        addNotification({
          type: "error",
          title: "ভুল ইনপুট",
          message: "পাস নম্বর পূর্ণমানের চেয়ে বেশি হতে পারে না।",
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          maximumMarks: Number(formData.maximumMarks),
          passMarks: Number(formData.passMarks),
          publicationStatus: "draft",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "পরীক্ষা তৈরি করা যায়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: "নতুন পরীক্ষার শিডিউল সফলভাবে তৈরি হয়েছে।",
        })
      );

      setCreateDialogOpen(false);
      setFormData({
        batch: batches[0]?._id || "",
        subject: "পদার্থবিজ্ঞান",
        title: "",
        examDate: new Date().toISOString().split("T")[0],
        maximumMarks: 100,
        passMarks: 40,
        examType: "weekly",
      });
      fetchExams();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Open Marks Entry Dialog
  const openMarksDialog = async (exam: ExamItem) => {
    setTargetExam(exam);
    setMarksDialogOpen(true);
    setMarksLoading(true);

    try {
      // 1. Fetch active enrollments for this batch
      const enrRes = await fetch(
        `/api/enrollments?batch=${exam.batch._id}&status=active&limit=100`,
        { credentials: "include" }
      );
      const enrJson = await enrRes.json();
      const enrollments = enrJson.data || [];

      // 2. Fetch existing results
      const resRes = await fetch(`/api/exams/${exam._id}/results`, {
        credentials: "include",
      });
      const resJson = await resRes.json();
      const existingResults = resJson.data?.results || [];

      const resultMap = new Map<string, { marks: number; feedback?: string }>();
      for (const item of existingResults) {
        const sId = item.student?._id || item.student;
        resultMap.set(String(sId), {
          marks: item.obtainedMarks,
          feedback: item.feedback,
        });
      }

      const rows: StudentMarkRow[] = enrollments.map(
        (enr: {
          student: { _id: string; fullName: string; phone?: string };
          rollNumber?: string;
        }) => {
          const sId = enr.student._id;
          const ex = resultMap.get(String(sId));
          return {
            studentId: sId,
            fullName: enr.student.fullName,
            phone: enr.student.phone || "",
            rollNumber: enr.rollNumber,
            obtainedMarks: ex ? ex.marks : 0,
            feedback: ex?.feedback || "",
          };
        }
      );

      // Sort by roll number
      rows.sort((a, b) => (Number(a.rollNumber) || 999) - (Number(b.rollNumber) || 999));
      setMarkRows(rows);
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "নম্বর এন্ট্রি তালিকা প্রস্তুত করা যায়নি।",
        })
      );
    } finally {
      setMarksLoading(false);
    }
  };

  // 5. Save Marks (Draft or Publish)
  const handleSaveMarks = async (publishImmediately: boolean) => {
    if (!targetExam || markRows.length === 0) return;

    // Validate client-side limits
    for (const r of markRows) {
      if (r.obtainedMarks < 0 || r.obtainedMarks > targetExam.maximumMarks) {
        dispatch(
          addNotification({
            type: "error",
            title: "নম্বর সীমা লঙ্ঘন",
            message: `${r.fullName}-এর নম্বর ০ থেকে ${toBanglaNumber(targetExam.maximumMarks)}-এর মধ্যে হতে হবে।`,
          })
        );
        return;
      }
    }

    setMarksSaving(true);
    try {
      const res = await fetch(`/api/exams/${targetExam._id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          marks: markRows.map((r) => ({
            studentId: r.studentId,
            obtainedMarks: Number(r.obtainedMarks) || 0,
            feedback: r.feedback || undefined,
          })),
          publishImmediately,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "নম্বর সংরক্ষণ করতে সমস্যা হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সংরক্ষণ সফল",
          message: publishImmediately
            ? "নম্বর সংরক্ষণ এবং ফলাফল আনুষ্ঠানিকভাবে প্রকাশ করা হয়েছে!"
            : "পরীক্ষার নম্বর খসড়া হিসেবে সংরক্ষণ করা হয়েছে।",
        })
      );

      setMarksDialogOpen(false);
      fetchExams();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    } finally {
      setMarksSaving(false);
    }
  };

  // 6. Open Merit Ranking
  const openMeritDialog = async (exam: ExamItem) => {
    setTargetExam(exam);
    setMeritDialogOpen(true);
    setMeritLoading(true);
    try {
      const res = await fetch(`/api/exams/${exam._id}/results`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setMeritList(json.data.results || []);
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "মেধাতালিকা পাওয়া যায়নি।",
        })
      );
    } finally {
      setMeritLoading(false);
    }
  };

  // 7. Open Printable Result Sheet
  const openPrintSheet = async (exam: ExamItem) => {
    setTargetExam(exam);
    setPrintSheetOpen(true);
    setMeritLoading(true);
    try {
      const res = await fetch(`/api/exams/${exam._id}/results`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setMeritList(json.data.results || []);
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "মুদ্রণযোগ্য শিট লোড করা সম্ভব হয়নি।",
        })
      );
    } finally {
      setMeritLoading(false);
    }
  };

  // Summary statistics for targetExam merit list
  const totalSubmissions = meritList.length;
  const highestMarksInBatch = meritList.length > 0 ? meritList[0].obtainedMarks : 0;
  const passMarksLimit = targetExam?.passMarks || 40;
  const passedStudents = meritList.filter(
    (m) => m.obtainedMarks >= passMarksLimit
  ).length;
  const passPercentage =
    totalSubmissions > 0 ? Math.round((passedStudents / totalSubmissions) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="পরীক্ষা ও ফলাফল ব্যবস্থাপনা (Exams & Results)"
        subtitle="সাপ্তাহিক ও মডেল টেস্ট পরীক্ষা তৈরি, নম্বর ইনপুট, গ্রেডিং স্কেল এবং মেধা তালিকা প্রকাশ"
        breadcrumbs={[
          { label: "ড্যাশবোর্ড", href: "/admin" },
          { label: "পরীক্ষা ও ফলাফল" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchExams} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>রিফ্রেশ</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন পরীক্ষা তৈরি</span>
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="danger" title="ত্রুটি">
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="পরীক্ষার শিরোনাম বা বিষয় খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div>
              <Select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                options={[
                  { value: "", label: "সকল ব্যাচ (All Batches)" },
                  ...batches.map((b) => ({
                    value: b._id,
                    label: `${b.name} (${b.classLevel})`,
                  })),
                ]}
              />
            </div>

            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "", label: "সকল অবস্থা (All Status)" },
                  { value: "draft", label: "খসড়া (Draft)" },
                  { value: "published", label: "প্রকাশিত (Published)" },
                  { value: "archived", label: "আর্কাইভকৃত (Archived)" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto min-w-[750px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/75">
                <TableHead className="font-bold">পরীক্ষার শিরোনাম ও বিষয়</TableHead>
                <TableHead className="font-bold">ব্যাচ ও শ্রেণি</TableHead>
                <TableHead className="font-bold">তারিখ</TableHead>
                <TableHead className="font-bold text-center">পূর্ণমান (Pass)</TableHead>
                <TableHead className="font-bold text-center">ধরন</TableHead>
                <TableHead className="font-bold text-center">ফলাফল অবস্থা</TableHead>
                <TableHead className="text-right font-bold">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-4">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                    কোনো পরীক্ষার তথ্য পাওয়া যায়নি।
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam._id} className="hover:bg-slate-50/80 transition">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#00636b] flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {exam.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            বিষয়: {exam.subject}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-800 text-xs">
                        {exam.batch?.name}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {exam.batch?.classLevel} • {exam.batch?.code}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      {formatBanglaDate(exam.examDate)}
                    </TableCell>

                    <TableCell className="text-center font-bold text-slate-800 text-xs">
                      {toBanglaNumber(exam.maximumMarks)}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({toBanglaNumber(exam.passMarks || 40)})
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {exam.examType === "weekly"
                          ? "সাপ্তাহিক"
                          : exam.examType === "monthly"
                            ? "মাসিক"
                            : exam.examType === "model_test"
                              ? "মডেল টেস্ট"
                              : "টার্ম"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      {exam.publicationStatus === "published" ? (
                        <Badge variant="success" className="text-[11px] gap-1">
                          <Globe className="h-3 w-3" />
                          <span>প্রকাশিত</span>
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[11px] gap-1">
                          <Lock className="h-3 w-3" />
                          <span>খসড়া</span>
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMarksDialog(exam)}
                          className="h-7 text-xs text-[#00636b] hover:bg-[#eff8f9]"
                          title="নম্বর এন্ট্রি"
                        >
                          নম্বর এন্ট্রি
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMeritDialog(exam)}
                          className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                          title="মেধা তালিকা"
                        >
                          <Award className="h-3.5 w-3.5 mr-1" />
                          মেধা তালিকা
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPrintSheet(exam)}
                          className="h-7 text-xs text-slate-700 hover:bg-slate-100"
                          title="প্রিন্ট শিট"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              মোট পরীক্ষা: {toBanglaNumber(totalExams)} টি
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>

      {/* CREATE EXAM DIALOG */}
      <Dialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="নতুন পরীক্ষা শিডিউল তৈরি"
        description="সংশ্লিষ্ট ব্যাচের জন্য সাপ্তাহিক টেস্ট বা মডেল টেস্টের বিবরণ প্রদান করুন।"
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              বাতিল
            </Button>
            <Button variant="primary" isLoading={submitting} onClick={handleCreateExam}>
              পরীক্ষা তৈরি করুন
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ব্যাচ নির্বাচন
            </label>
            <Select
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              options={batches.map((b) => ({
                value: b._id,
                label: `${b.name} (${b.classLevel}) - ${b.code}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পরীক্ষার বিষয়
              </label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="যেমন: পদার্থবিজ্ঞান"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পরীক্ষার শিরোনাম
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="যেমন: অধ্যায়-০৩ সাপ্তাহিক পরীক্ষা"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                তারিখ
              </label>
              <Input
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পরীক্ষার ধরন
              </label>
              <Select
                value={formData.examType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    examType: e.target.value as
                      "weekly" | "monthly" | "model_test" | "term",
                  })
                }
                options={[
                  { value: "weekly", label: "সাপ্তাহিক টেস্ট (Weekly)" },
                  { value: "monthly", label: "মাসিক পরীক্ষা (Monthly)" },
                  { value: "model_test", label: "মডেল টেস্ট (Model Test)" },
                  { value: "term", label: "টার্ম পরীক্ষা (Term)" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পূর্ণমান (Max Marks)
              </label>
              <Input
                type="number"
                min={1}
                value={formData.maximumMarks}
                onChange={(e) =>
                  setFormData({ ...formData, maximumMarks: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পাস মার্ক (Pass Marks)
              </label>
              <Input
                type="number"
                min={0}
                value={formData.passMarks}
                onChange={(e) =>
                  setFormData({ ...formData, passMarks: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* MARKS ENTRY DIALOG */}
      <Dialog
        isOpen={marksDialogOpen}
        onClose={() => setMarksDialogOpen(false)}
        title={`নম্বর এন্ট্রি: ${targetExam?.title || ""}`}
        description={`বিষয়: ${targetExam?.subject} • ব্যাচ: ${targetExam?.batch?.name} • পূর্ণমান: ${targetExam?.maximumMarks}`}
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500 font-medium">
              মোট শিক্ষার্থী: {toBanglaNumber(markRows.length)} জন
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setMarksDialogOpen(false)}>
                বাতিল
              </Button>
              <Button
                variant="outline"
                isLoading={marksSaving}
                onClick={() => handleSaveMarks(false)}
              >
                খসড়া হিসেবে সংরক্ষণ
              </Button>
              <Button
                variant="primary"
                isLoading={marksSaving}
                onClick={() => handleSaveMarks(true)}
                className="gap-1.5"
              >
                <Globe className="h-4 w-4" />
                <span>সংরক্ষণ ও ফলাফল প্রকাশ করুন</span>
              </Button>
            </div>
          </div>
        }
      >
        {marksLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : markRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            এই ব্যাচে কোনো সক্রিয় শিক্ষার্থী ভর্তি নেই।
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <Alert variant="info" title="লাইভ গ্রেডিং ও সীমা ভ্যালিডেশন">
              প্রাপ্ত নম্বর ইনপুট করার সাথে সাথে স্বয়ংক্রিয়ভাবে গ্রেড গণনা করা হবে।
              প্রাপ্ত নম্বর অবশ্যই ০ থেকে{" "}
              {toBanglaNumber(targetExam?.maximumMarks || 100)}-এর মধ্যে সীমাবদ্ধ থাকবে।
            </Alert>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-2.5 w-14 text-center">রোল</th>
                  <th className="p-2.5">শিক্ষার্থীর নাম</th>
                  <th className="p-2.5 w-28 text-center">প্রাপ্ত নম্বর</th>
                  <th className="p-2.5 w-24 text-center">গ্রেড (Grade)</th>
                  <th className="p-2.5">শিক্ষকের মন্তব্য (Feedback)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {markRows.map((row) => {
                  const maxMarks = targetExam?.maximumMarks || 100;
                  const gradeInfo = calculateGradeAndGpa(row.obtainedMarks, maxMarks);
                  const isExceeding =
                    row.obtainedMarks > maxMarks || row.obtainedMarks < 0;

                  return (
                    <tr key={row.studentId} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-center font-bold text-slate-800">
                        {row.rollNumber ? toBanglaNumber(row.rollNumber) : "—"}
                      </td>
                      <td className="p-2.5">
                        <p className="font-semibold text-slate-900">{row.fullName}</p>
                        <p className="text-[10px] text-slate-400">
                          আইডি: {row.studentId}
                        </p>
                      </td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          min={0}
                          max={maxMarks}
                          value={row.obtainedMarks}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMarkRows((prev) =>
                              prev.map((r) =>
                                r.studentId === row.studentId
                                  ? { ...r, obtainedMarks: val }
                                  : r
                              )
                            );
                          }}
                          className={`h-8 text-center font-bold ${
                            isExceeding
                              ? "border-rose-500 text-rose-600 bg-rose-50 focus:ring-rose-500"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <Badge
                          variant={gradeInfo.badgeVariant}
                          className="font-bold text-xs"
                        >
                          {gradeInfo.grade} ({gradeInfo.gpa.toFixed(1)})
                        </Badge>
                      </td>
                      <td className="p-2.5">
                        <Input
                          placeholder="মন্তব্য..."
                          value={row.feedback || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMarkRows((prev) =>
                              prev.map((r) =>
                                r.studentId === row.studentId
                                  ? { ...r, feedback: val }
                                  : r
                              )
                            );
                          }}
                          className="h-8 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Dialog>

      {/* MERIT LIST DIALOG */}
      <Dialog
        isOpen={meritDialogOpen}
        onClose={() => setMeritDialogOpen(false)}
        title="পরীক্ষার মেধা তালিকা (Merit List)"
        description={`পরীক্ষা: ${targetExam?.title} • পূর্ণমান: ${targetExam?.maximumMarks} • পাস নম্বর: ${targetExam?.passMarks || 40}`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500 font-medium">
              উত্তীর্ণের হার: {toBanglaNumber(passPercentage)}% (
              {toBanglaNumber(passedStudents)}/{toBanglaNumber(totalSubmissions)})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMeritDialogOpen(false);
                  if (targetExam) openPrintSheet(targetExam);
                }}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>মুদ্রণযোগ্য শিট দেখুন</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMeritDialogOpen(false)}
              >
                বন্ধ করুন
              </Button>
            </div>
          </div>
        }
      >
        {meritLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : meritList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            এই পরীক্ষার কোনো ফলাফল এখনও জমা হয়নি।
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-2.5 bg-teal-50 border-teal-100 text-center">
                <span className="text-[11px] text-teal-800">মোট পরীক্ষার্থী</span>
                <p className="text-base font-bold text-[#00636b]">
                  {toBanglaNumber(totalSubmissions)} জন
                </p>
              </Card>
              <Card className="p-2.5 bg-amber-50 border-amber-100 text-center">
                <span className="text-[11px] text-amber-800">সর্বোচ্চ নম্বর</span>
                <p className="text-base font-bold text-amber-700">
                  {toBanglaNumber(highestMarksInBatch)}
                </p>
              </Card>
              <Card className="p-2.5 bg-emerald-50 border-emerald-100 text-center">
                <span className="text-[11px] text-emerald-800">উত্তীর্ণের হার</span>
                <p className="text-base font-bold text-emerald-700">
                  {toBanglaNumber(passPercentage)}%
                </p>
              </Card>
            </div>

            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {meritList.map((res, rank) => {
                const maxMarks = targetExam?.maximumMarks || 100;
                const gradeInfo = calculateGradeAndGpa(res.obtainedMarks, maxMarks);
                const isPassed = res.obtainedMarks >= (targetExam?.passMarks || 40);

                return (
                  <div
                    key={res._id}
                    className="p-3 flex items-center justify-between text-xs bg-white hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          rank === 0
                            ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300"
                            : rank === 1
                              ? "bg-slate-200 text-slate-800"
                              : rank === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {toBanglaNumber(rank + 1)}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {res.student?.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          আইডি: {res.student?.studentId}{" "}
                          {res.student?.rollNumber
                            ? `• রোল: ${toBanglaNumber(res.student.rollNumber)}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-[#00636b] text-sm">
                          {toBanglaNumber(res.obtainedMarks)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          /{toBanglaNumber(maxMarks)}
                        </span>
                      </div>
                      <Badge variant={gradeInfo.badgeVariant} className="font-bold">
                        {gradeInfo.grade}
                      </Badge>
                      <Badge
                        variant={isPassed ? "success" : "danger"}
                        className="text-[10px]"
                      >
                        {isPassed ? "পাস" : "ফেল"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Dialog>

      {/* PRINTABLE RESULT TABULATION SHEET MODAL */}
      <Dialog
        isOpen={printSheetOpen}
        onClose={() => setPrintSheetOpen(false)}
        title="মুদ্রণযোগ্য ফলাফল শিট (Printable Result Tabulation)"
        description="অফিসিয়াল মার্কশিট ও মেধা তালিকা প্রিন্ট করুন।"
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setPrintSheetOpen(false)}>
              বন্ধ করুন
            </Button>
            <Button variant="primary" onClick={() => window.print()} className="gap-1.5">
              <Printer className="h-4 w-4" />
              <span>প্রিন্ট করুন (Print Now)</span>
            </Button>
          </div>
        }
      >
        {targetExam && (
          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-6 printable-sheet">
            {/* Institution Letterhead Header */}
            <div className="text-center border-b pb-4 border-slate-300">
              <h2 className="text-xl font-extrabold text-[#00636b] tracking-tight">
                শিক্ষণ একাডেমিক কেয়ার (Shikkhon Academic Care)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                মানসম্মত শিক্ষা ও আধুনিক পাঠদানের নির্ভরযোগ্য প্রতিষ্ঠান
              </p>
              <div className="mt-3 inline-block bg-slate-100 px-4 py-1 rounded-full border border-slate-300">
                <h3 className="text-xs font-bold text-slate-800">
                  পরীক্ষার ফলাফল ও মেধা তালিকা বিবরণী (Tabulation Sheet)
                </h3>
              </div>
            </div>

            {/* Exam Meta Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">পরীক্ষা:</span>
                <p className="font-bold text-slate-800">{targetExam.title}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">বিষয়:</span>
                <p className="font-bold text-slate-800">{targetExam.subject}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">ব্যাচ ও শ্রেণি:</span>
                <p className="font-bold text-slate-800">
                  {targetExam.batch?.name} ({targetExam.batch?.classLevel})
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">তারিখ ও পূর্ণমান:</span>
                <p className="font-bold text-slate-800">
                  {formatBanglaDate(targetExam.examDate)} •{" "}
                  {toBanglaNumber(targetExam.maximumMarks)}
                </p>
              </div>
            </div>

            {/* Result Table */}
            <table className="w-full text-left text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                  <th className="p-2 border-r border-slate-300 text-center w-12">
                    মেধাক্রম
                  </th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">
                    রোল নং
                  </th>
                  <th className="p-2 border-r border-slate-300">শিক্ষার্থীর নাম</th>
                  <th className="p-2 border-r border-slate-300 text-center w-24">
                    প্রাপ্ত নম্বর
                  </th>
                  <th className="p-2 border-r border-slate-300 text-center w-20">
                    লেটার গ্রেড
                  </th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">
                    জিপিএ
                  </th>
                  <th className="p-2 text-center w-20">ফলাফল</th>
                </tr>
              </thead>
              <tbody>
                {meritList.map((item, idx) => {
                  const gradeInfo = calculateGradeAndGpa(
                    item.obtainedMarks,
                    targetExam.maximumMarks
                  );
                  const isPassed = item.obtainedMarks >= (targetExam.passMarks || 40);

                  return (
                    <tr key={item._id} className="border-b border-slate-200">
                      <td className="p-2 text-center border-r border-slate-200 font-bold">
                        {toBanglaNumber(idx + 1)}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-mono">
                        {item.student?.rollNumber
                          ? toBanglaNumber(item.student.rollNumber)
                          : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-semibold">
                        {item.student?.fullName}
                        <span className="block text-[10px] text-slate-400">
                          আইডি: {item.student?.studentId}
                        </span>
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-bold text-[#00636b]">
                        {toBanglaNumber(item.obtainedMarks)}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-bold">
                        {gradeInfo.grade}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-bold">
                        {toBanglaNumber(gradeInfo.gpa.toFixed(1))}
                      </td>
                      <td className="p-2 text-center font-bold">
                        <span className={isPassed ? "text-emerald-700" : "text-rose-700"}>
                          {isPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Grading Scale Legend Footer */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-700 block mb-1">
                গ্রেডিং স্কেল নির্দেশিকা (Grading Scale Reference):
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-[10px] text-center border p-2 rounded bg-slate-50 border-slate-200">
                {DEFAULT_BANGLADESH_GRADING_SCALE.map((tier) => (
                  <div
                    key={tier.grade}
                    className="p-1 rounded bg-white border border-slate-100"
                  >
                    <span className="font-bold text-slate-800">{tier.grade}</span>
                    <span className="block text-slate-500">
                      {toBanglaNumber(tier.minPercentage)}%+
                    </span>
                    <span className="block font-semibold text-[#00636b]">
                      {toBanglaNumber(tier.gpa.toFixed(1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Signature Blocks */}
            <div className="flex justify-between items-end pt-12 pb-4 text-xs text-slate-700">
              <div className="text-center">
                <div className="w-36 border-t border-slate-400 mb-1"></div>
                <span>শ্রেণি শিক্ষকের স্বাক্ষর</span>
              </div>
              <div className="text-center">
                <div className="w-36 border-t border-slate-400 mb-1"></div>
                <span>পরিচালক / অধ্যক্ষের স্বাক্ষর</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
