"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Save,
  CheckCircle2,
  Calendar,
  Award,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

interface StudentMarkRow {
  studentId: string;
  name: string;
  rollNumber: string;
  studentCode: string;
  obtainedMarks: number | string;
  feedback: string;
  isAbsent: boolean;
}

export default function TeacherExamsPage() {
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Active exam for marks entry
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [studentMarks, setStudentMarks] = useState<StudentMarkRow[]>([]);
  const [savingMarks, setSavingMarks] = useState(false);

  // Create Exam Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    batch: "",
    subject: "",
    title: "",
    examDate: new Date().toISOString().split("T")[0],
    maximumMarks: 100,
    passMarks: 40,
    examType: "weekly",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [examsRes, batchesRes] = await Promise.all([
        fetch("/api/exams"),
        fetch("/api/batches"),
      ]);

      const [examsJson, batchesJson] = await Promise.all([
        examsRes.json(),
        batchesRes.json(),
      ]);

      if (examsJson.success) {
        setExams(examsJson.data || []);
      }
      if (batchesJson.success) {
        setBatches(batchesJson.data || []);
        if (batchesJson.data.length > 0) {
          setNewExamForm((prev) => ({ ...prev, batch: batchesJson.data[0]._id }));
        }
      }
    } catch {
      setError("পরীক্ষার তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load marks entry table for selected exam
  const loadExamMarks = async (exam: any) => {
    setSelectedExam(exam);
    setLoadingResults(true);
    try {
      // 1. Fetch active enrollments in exam's batch
      const batchId = exam.batch?._id || exam.batch;
      const enrollRes = await fetch(`/api/enrollments?batch=${batchId}&status=active`);
      const enrollJson = await enrollRes.json();
      const enrolledStudents: any[] = enrollJson.data || [];

      // 2. Fetch existing results for this exam
      const resultsRes = await fetch(`/api/exams/${exam._id}/results`);
      const resultsJson = await resultsRes.json();
      const existingResultsMap: Record<string, any> = {};

      if (resultsJson.success && resultsJson.data) {
        resultsJson.data.forEach((r: any) => {
          const sId = r.student?._id || r.student;
          existingResultsMap[String(sId)] = r;
        });
      }

      // Map rows
      const rows: StudentMarkRow[] = enrolledStudents.map((e) => {
        const sId = String(e.student?._id || e.student);
        const res = existingResultsMap[sId];
        return {
          studentId: sId,
          name: e.student?.fullName || "শিক্ষার্থী",
          rollNumber: e.rollNumber ? String(e.rollNumber) : "",
          studentCode: e.student?.studentId || "N/A",
          obtainedMarks: res ? res.obtainedMarks : "",
          feedback: res?.feedback || "",
          isAbsent: res?.isAbsent || false,
        };
      });

      setStudentMarks(rows);
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "নম্বর তালিকা লোড করা যায়নি।",
        })
      );
    } finally {
      setLoadingResults(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingExam(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExamForm,
          maximumMarks: Number(newExamForm.maximumMarks),
          passMarks: Number(newExamForm.passMarks),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "পরীক্ষা তৈরি করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল!",
          message: "নতুন পরীক্ষা সফলভাবে সৃষ্টি হয়েছে।",
        })
      );
      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "পরীক্ষা সৃষ্টি ব্যর্থ হয়েছে।",
        })
      );
    } finally {
      setCreatingExam(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || studentMarks.length === 0) return;

    // Validate marks within limit
    for (const row of studentMarks) {
      if (
        row.obtainedMarks !== "" &&
        Number(row.obtainedMarks) > selectedExam.maximumMarks
      ) {
        dispatch(
          addNotification({
            type: "error",
            title: "ভুল ইনপুট",
            message: `${row.name}-এর প্রাপ্ত নম্বর পূর্ণমান (${toBanglaNumber(selectedExam.maximumMarks)})-এর চেয়ে বেশি হতে পারে না।`,
          })
        );
        return;
      }
    }

    setSavingMarks(true);
    try {
      const payload = {
        results: studentMarks
          .filter((r) => r.obtainedMarks !== "" || r.isAbsent)
          .map((r) => ({
            studentId: r.studentId,
            obtainedMarks: r.isAbsent ? 0 : Number(r.obtainedMarks),
            feedback: r.feedback || undefined,
            isAbsent: r.isAbsent,
          })),
      };

      const res = await fetch(`/api/exams/${selectedExam._id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "নম্বর সংরক্ষণ ব্যর্থ হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সংরক্ষণ সফল!",
          message: "পরীক্ষার নম্বর সফলভাবে সংরক্ষিত হয়েছে।",
        })
      );
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "নম্বর সংরক্ষণে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setSavingMarks(false);
    }
  };

  const examTypeLabels: Record<string, string> = {
    weekly: "সাপ্তাহিক মূল্যায়ন",
    monthly: "মাসিক পরীক্ষা",
    model_test: "মডেল টেস্ট",
    term: "টার্ম পরীক্ষা",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="পরীক্ষা ও নম্বর এন্ট্রি পোর্টাল"
        subtitle="নির্ধারিত ব্যাচের পরীক্ষা তৈরি এবং শিক্ষার্থীদের মূল্যায়িত নম্বর ডাটাবেজে এন্ট্রি করুন"
        breadcrumbs={[
          { label: "শিক্ষক ড্যাশবোর্ড", href: "/dashboard/teacher" },
          { label: "পরীক্ষা ও নম্বর" },
        ]}
        actions={
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন পরীক্ষা যোগ করুন</span>
          </Button>
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
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Exams List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                  <span>পরীক্ষার তালিকা</span>
                  <Badge variant="outline">{toBanglaNumber(exams.length)} টি</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {exams.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">কোনো পরীক্ষা তৈরি করা হয়নি</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      &quot;নতুন পরীক্ষা যোগ করুন&quot; বাটনে ক্লিক করে পরীক্ষা শুরু করুন।
                    </p>
                  </div>
                ) : (
                  exams.map((ex) => (
                    <div
                      key={ex._id}
                      onClick={() => loadExamMarks(ex)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        selectedExam?._id === ex._id
                          ? "border-[#00636b] bg-[#00636b]/5 ring-1 ring-[#00636b]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900 line-clamp-1">
                          {ex.title}
                        </span>
                        <Badge
                          variant={
                            ex.publicationStatus === "published" ? "default" : "secondary"
                          }
                          className={`text-[10px] shrink-0 ${
                            ex.publicationStatus === "published"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ex.publicationStatus === "published" ? "প্রকাশিত" : "ড্রাফট"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-primary-900">
                          {ex.subject}
                        </span>
                        <span>•</span>
                        <span>পূর্ণমান: {toBanglaNumber(ex.maximumMarks)}</span>
                        <span>•</span>
                        <span>{formatBanglaDate(ex.examDate)}</span>
                      </div>

                      {ex.batch && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          ব্যাচ: {ex.batch?.name || ex.batch}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Marks Entry Form (7 cols) */}
          <div className="lg:col-span-7">
            {selectedExam ? (
              <Card className="border-slate-200 shadow-2xs">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#00636b]" />
                      <span>{selectedExam.title} - নম্বর এন্ট্রি</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      বিষয়: <strong>{selectedExam.subject}</strong> | পূর্ণমান:{" "}
                      <strong>{toBanglaNumber(selectedExam.maximumMarks)}</strong>
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveMarks}
                    disabled={savingMarks || studentMarks.length === 0}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    {savingMarks ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>নম্বর সংরক্ষণ করুন</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingResults ? (
                    <div className="p-8 space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : studentMarks.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <p className="text-sm font-semibold">
                        এই ব্যাচে কোনো শিক্ষার্থী নেই
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-4">আইডি ও রোল</th>
                            <th className="py-3 px-4">নাম</th>
                            <th className="py-3 px-4 w-32">প্রাপ্ত নম্বর</th>
                            <th className="py-3 px-4">অনুপস্থিত?</th>
                            <th className="py-3 px-4">মন্তব্য</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentMarks.map((row) => (
                            <tr
                              key={row.studentId}
                              className="hover:bg-slate-50/60 transition"
                            >
                              <td className="py-3 px-4">
                                <span className="font-mono font-semibold text-[#00636b] block">
                                  {row.studentCode}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  রোল:{" "}
                                  {row.rollNumber ? toBanglaNumber(row.rollNumber) : "-"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {row.name}
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  min={0}
                                  max={selectedExam.maximumMarks}
                                  disabled={row.isAbsent}
                                  placeholder="0"
                                  value={row.obtainedMarks}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStudentMarks((prev) =>
                                      prev.map((item) =>
                                        item.studentId === row.studentId
                                          ? { ...item, obtainedMarks: val }
                                          : item
                                      )
                                    );
                                  }}
                                  className="w-24 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="checkbox"
                                  checked={row.isAbsent}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setStudentMarks((prev) =>
                                      prev.map((item) =>
                                        item.studentId === row.studentId
                                          ? {
                                              ...item,
                                              isAbsent: checked,
                                              obtainedMarks: checked
                                                ? 0
                                                : item.obtainedMarks,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  placeholder="যেমন: ভালো হয়েছে"
                                  value={row.feedback}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStudentMarks((prev) =>
                                      prev.map((item) =>
                                        item.studentId === row.studentId
                                          ? { ...item, feedback: val }
                                          : item
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
            ) : (
              <Card className="border-slate-200 shadow-2xs text-center py-16">
                <CardContent className="space-y-3">
                  <Award className="h-12 w-12 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800">
                    নম্বর এন্ট্রি করতে বামের তালিকা থেকে একটি পরীক্ষা নির্বাচন করুন
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    পরীক্ষা নির্বাচন করলে সেই ব্যাচের সকল শিক্ষার্থীর নামের তালিকা এখানে
                    প্রদর্শিত হবে।
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                নতুন পরীক্ষা তৈরি করুন
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্যাচ নির্বাচন করুন *
                </label>
                <select
                  required
                  value={newExamForm.batch}
                  onChange={(e) =>
                    setNewExamForm({ ...newExamForm, batch: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code}) - {b.classLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পরীক্ষার শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: অধ্যায়-১ ও ২ সাপ্তাহিক টেস্ট"
                  value={newExamForm.title}
                  onChange={(e) =>
                    setNewExamForm({ ...newExamForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    বিষয় *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: পদার্থবিজ্ঞান"
                    value={newExamForm.subject}
                    onChange={(e) =>
                      setNewExamForm({ ...newExamForm, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পরীক্ষার ধরণ
                  </label>
                  <select
                    value={newExamForm.examType}
                    onChange={(e) =>
                      setNewExamForm({ ...newExamForm, examType: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                  >
                    <option value="weekly">সাপ্তাহিক মূল্যায়ন</option>
                    <option value="monthly">মাসিক পরীক্ষা</option>
                    <option value="model_test">মডেল টেস্ট</option>
                    <option value="term">টার্ম পরীক্ষা</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExamForm.examDate}
                    onChange={(e) =>
                      setNewExamForm({ ...newExamForm, examDate: e.target.value })
                    }
                    className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পূর্ণমান *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newExamForm.maximumMarks}
                    onChange={(e) =>
                      setNewExamForm({
                        ...newExamForm,
                        maximumMarks: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পাস নম্বর
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newExamForm.passMarks}
                    onChange={(e) =>
                      setNewExamForm({
                        ...newExamForm,
                        passMarks: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00636b]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  বাতিল
                </Button>
                <Button type="submit" variant="primary" disabled={creatingExam}>
                  {creatingExam ? "সৃষ্টি হচ্ছে..." : "পরীক্ষা তৈরি করুন"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
