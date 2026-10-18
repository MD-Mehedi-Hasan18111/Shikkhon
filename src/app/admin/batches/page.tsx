"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
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
import { toBanglaNumber, formatBanglaCurrency } from "@/lib/utils";

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  roomNo?: string;
}

interface BatchItem {
  _id: string;
  name: string;
  code: string;
  classLevel: string;
  academicSession: {
    _id: string;
    name: string;
    code: string;
  };
  assignedTeachers: Array<{
    _id: string;
    fullName: string;
    teacherCode: string;
  }>;
  subjects: string[];
  schedule: ScheduleItem[];
  roomOrOnlineDetails?: string;
  capacity: number;
  monthlyFee: number;
  status: "upcoming" | "active" | "completed" | "cancelled";
}

interface BatchDetailResponse {
  batch: BatchItem;
  enrolledCount: number;
  availableSeats: number;
  isFull: boolean;
}

const classLevelOptions = [
  { value: "class_6", label: "৬ষ্ঠ শ্রেণি" },
  { value: "class_7", label: "৭ম শ্রেণি" },
  { value: "class_8", label: "৮ম শ্রেণি" },
  { value: "class_9", label: "৯ম শ্রেণি" },
  { value: "class_10", label: "১০ম শ্রেণি (এসএসসি)" },
  { value: "hsc_1st", label: "একাদশ শ্রেণি (এইচএসসি ১ম বর্ষ)" },
  { value: "hsc_2nd", label: "দ্বাদশ শ্রেণি (এইচএসসি ২য় বর্ষ)" },
  { value: "alim_1st", label: "আলিম ১ম বর্ষ" },
  { value: "alim_2nd", label: "আলিম ২য় বর্ষ" },
  { value: "admission", label: "বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি" },
];

const classLevelLabels: Record<string, string> = {
  class_6: "৬ষ্ঠ শ্রেণি",
  class_7: "৭ম শ্রেণি",
  class_8: "৮ম শ্রেণি",
  class_9: "৯ম শ্রেণি",
  class_10: "১০ম শ্রেণি",
  hsc_1st: "একাদশ শ্রেণি",
  hsc_2nd: "দ্বাদশ শ্রেণি",
  alim_1st: "আলিম ১ম বর্ষ",
  alim_2nd: "আলিম ২য় বর্ষ",
  admission: "ভর্তি প্রস্তুতি",
};

const daysBangla: Record<string, string> = {
  saturday: "শনিবার",
  sunday: "রবিবার",
  monday: "সোমবার",
  tuesday: "মঙ্গলবার",
  wednesday: "বুধবার",
  thursday: "বৃহস্পতিবার",
  friday: "শুক্রবার",
};

export default function BatchManagementPage() {
  const dispatch = useAppDispatch();

  // List States
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBatches, setTotalBatches] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("active");

  // Metadata Lists for form dropdowns
  const [academicSessions, setAcademicSessions] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [teachersList, setTeachersList] = useState<
    Array<{ _id: string; fullName: string; teacherCode: string }>
  >([]);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const [targetBatch, setTargetBatch] = useState<BatchItem | null>(null);
  const [batchDetail, setBatchDetail] = useState<BatchDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    classLevel: "class_10",
    academicSession: "",
    subjects: "",
    capacity: 40,
    monthlyFee: 1500,
    assignedTeachers: [] as string[],
    schedule: [
      { day: "saturday", startTime: "16:00", endTime: "17:30", roomNo: "কক্ষ-০১" },
      { day: "monday", startTime: "16:00", endTime: "17:30", roomNo: "কক্ষ-০১" },
      { day: "wednesday", startTime: "16:00", endTime: "17:30", roomNo: "কক্ষ-০১" },
    ],
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 1. Fetch Batches
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (selectedClass) params.set("classLevel", selectedClass);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/batches?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "ব্যাচ তালিকা লোড করা যায়নি।");
      }

      setBatches(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalBatches(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedClass, selectedStatus]);

  // Load supporting sessions & teachers
  useEffect(() => {
    fetchBatches();

    // Fetch sessions
    fetch("/api/academic-sessions?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAcademicSessions(json.data || []);
      })
      .catch(() => {});

    // Fetch teachers
    fetch("/api/teachers?isActive=true&limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTeachersList(json.data || []);
      })
      .catch(() => {});
  }, [fetchBatches]);

  // 2. Open Detail Dialog
  const openDetailDialog = async (batch: BatchItem) => {
    setTargetBatch(batch);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/batches/${batch._id}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setBatchDetail(json.data);
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "ব্যাচের তথ্য লোড করা সম্ভব হয়নি।",
        })
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // 3. Open Edit Dialog
  const openEditDialog = (batch: BatchItem) => {
    setTargetBatch(batch);
    setFormData({
      name: batch.name,
      code: batch.code,
      classLevel: batch.classLevel,
      academicSession: batch.academicSession?._id || "",
      subjects: batch.subjects.join(", "),
      capacity: batch.capacity,
      monthlyFee: batch.monthlyFee,
      assignedTeachers: batch.assignedTeachers?.map((t) => t._id) || [],
      schedule: batch.schedule?.length
        ? batch.schedule.map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            roomNo: s.roomNo || "",
          }))
        : [{ day: "saturday", startTime: "16:00", endTime: "17:30", roomNo: "কক্ষ-০১" }],
    });
    setEditDialogOpen(true);
  };

  // 4. Save Batch (Create / Edit)
  const handleSaveBatch = async (isEdit: boolean) => {
    setFormSubmitting(true);

    const subjectsArr = formData.subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (subjectsArr.length === 0) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "কমপক্ষে একটি বিষয় উল্লেখ করুন।",
        })
      );
      setFormSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      classLevel: formData.classLevel,
      academicSession: formData.academicSession || academicSessions[0]?._id,
      subjects: subjectsArr,
      capacity: Number(formData.capacity),
      monthlyFee: Number(formData.monthlyFee),
      assignedTeachers: formData.assignedTeachers,
      schedule: formData.schedule,
    };

    try {
      const url = isEdit ? `/api/batches/${targetBatch?._id}` : "/api/batches";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "সংরক্ষণ করতে সমস্যা হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: isEdit
            ? "ব্যাচের তথ্য সফলভাবে আপডেট হয়েছে।"
            : "নতুন ব্যাচ সফলভাবে খোলা হয়েছে।",
        })
      );

      if (isEdit) setEditDialogOpen(false);
      else setCreateDialogOpen(false);

      fetchBatches();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // 5. Archive Batch
  const handleArchiveBatch = async () => {
    if (!targetBatch) return;
    try {
      const res = await fetch(`/api/batches/${targetBatch._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "আর্কাইভ করা যায়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "আর্কাইভ সম্পন্ন",
          message:
            "ব্যাচটি সমাপ্ত ও আর্কাইভ করা হয়েছে (পূর্বের সমস্ত রেকর্ড অক্ষুণ্ণ রয়েছে)।",
        })
      );

      setArchiveDialogOpen(false);
      fetchBatches();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    }
  };

  // Add / Remove Schedule Row
  const addScheduleRow = () => {
    setFormData({
      ...formData,
      schedule: [
        ...formData.schedule,
        { day: "sunday", startTime: "16:00", endTime: "17:30", roomNo: "কক্ষ-০১" },
      ],
    });
  };

  const removeScheduleRow = (index: number) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index),
    });
  };

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, val: string) => {
    const updated = [...formData.schedule];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, schedule: updated });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ব্যাচ ও সময়সূচী ব্যবস্থাপনা (Batch Management)"
        subtitle="শ্রেণিভিত্তিক অ্যাকাডেমিক ব্যাচ, শিক্ষক বণ্টন, আসন সংখ্যা এবং সাপ্তাহিক রুটিন"
        breadcrumbs={[{ label: "ড্যাশবোর্ড", href: "/admin" }, { label: "ব্যাচসমূহ" }]}
        actions={
          <Button
            onClick={() => {
              const currentYear = new Date().getFullYear();
              setFormData({
                name: "১০ম শ্রেণি বিশেষ কেয়ার ব্যাচ",
                code: `BATCH-${currentYear}-10`,
                classLevel: "class_10",
                academicSession: academicSessions[0]?._id || "",
                subjects: "পদার্থবিজ্ঞান, রসায়ন, গণিত",
                capacity: 40,
                monthlyFee: 2000,
                assignedTeachers: teachersList.length ? [teachersList[0]._id] : [],
                schedule: [
                  {
                    day: "saturday",
                    startTime: "16:00",
                    endTime: "17:30",
                    roomNo: "কক্ষ-০১",
                  },
                  {
                    day: "monday",
                    startTime: "16:00",
                    endTime: "17:30",
                    roomNo: "কক্ষ-০১",
                  },
                  {
                    day: "wednesday",
                    startTime: "16:00",
                    endTime: "17:30",
                    roomNo: "কক্ষ-০১",
                  },
                ],
              });
              setCreateDialogOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন ব্যাচ খুলুন</span>
          </Button>
        }
      />

      {/* Filter and Search */}
      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ব্যাচের নাম, কোড বা বিষয় দিয়ে খুঁজুন..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-[#00636b] focus:outline-none focus:ring-1 focus:ring-[#00636b] transition"
              />
            </div>

            <div>
              <Select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                }}
                options={[{ value: "", label: "সকল শ্রেণি" }, ...classLevelOptions]}
              />
            </div>

            <div>
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "সকল অবস্থা" },
                  { value: "active", label: "চলমান ব্যাচ (Active)" },
                  { value: "completed", label: "সমাপ্ত ব্যাচ (Completed)" },
                  { value: "upcoming", label: "আসন্ন ব্যাচ (Upcoming)" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card className="shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <Alert variant="danger" title="ত্রুটি">
              {error}
            </Alert>
            <Button size="sm" variant="outline" onClick={fetchBatches} className="mt-4">
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              কোনো ব্যাচ পাওয়া যায়নি
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              নতুন একটি ব্যাচ তৈরি করে কার্যক্রম শুরু করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>কোড</TableHead>
                  <TableHead>ব্যাচের নাম ও শ্রেণি</TableHead>
                  <TableHead>শিক্ষাবর্ষ</TableHead>
                  <TableHead>নির্ধারিত শিক্ষক</TableHead>
                  <TableHead>আসন ও ফি</TableHead>
                  <TableHead>সাপ্তাহিক ক্লাস</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch._id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-xs font-bold text-[#00636b]">
                      {batch.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">
                        {batch.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {classLevelLabels[batch.classLevel] || batch.classLevel}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {batch.academicSession?.name || "চলতি সেশন"}
                    </TableCell>
                    <TableCell>
                      {batch.assignedTeachers?.length ? (
                        <div className="text-xs text-slate-800">
                          {batch.assignedTeachers.map((t) => t.fullName).join(", ")}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">নির্ধারিত নেই</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        আসন: {toBanglaNumber(batch.capacity)} টি
                      </div>
                      <div className="text-[11px] text-slate-500">
                        মাসিক: {formatBanglaCurrency(batch.monthlyFee)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        সপ্তাহে {toBanglaNumber(batch.schedule?.length || 0)} দিন
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={batch.status === "active" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {batch.status === "active" ? "চলমান" : batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openDetailDialog(batch)}
                        className="text-slate-600 hover:text-[#00636b]"
                        title="বিস্তারিত দেখুন"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEditDialog(batch)}
                        className="text-blue-600 hover:bg-blue-50"
                        title="সম্পাদনা"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {batch.status === "active" && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setTargetBatch(batch);
                            setArchiveDialogOpen(true);
                          }}
                          className="text-amber-600 hover:bg-amber-50"
                          title="আর্কাইভ/সমাপ্ত"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              মোট {toBanglaNumber(totalBatches)} টি ব্যাচের মধ্যে পৃষ্ঠা{" "}
              {toBanglaNumber(page)}
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>

      {/* DIALOG 1: Create / Edit Batch */}
      <Dialog
        isOpen={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        title={editDialogOpen ? "ব্যাচ তথ্য সম্পাদন" : "নতুন ব্যাচ ও সময়সূচী নির্ধারণ"}
        size="lg"
      >
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ব্যাচের নাম <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="যেমন: ১০ম শ্রেণি বিশেষ কেয়ার ব্যাচ"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ব্যাচ কোড <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="BATCH-2026-10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                শ্রেণি স্তর <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.classLevel}
                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                options={classLevelOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                শিক্ষাবর্ষ (Session) <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.academicSession}
                onChange={(e) =>
                  setFormData({ ...formData, academicSession: e.target.value })
                }
                options={academicSessions.map((s) => ({ value: s._id, label: s.name }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                সর্বোচ্চ আসন সংখ্যা <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                মাসিক ফি (টাকা)
              </label>
              <Input
                type="number"
                min="0"
                value={formData.monthlyFee}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyFee: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              পাঠদানের বিষয়সমূহ (কমা দিয়ে লিখুন) <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান"
            />
          </div>

          {/* Assigned Teachers Checkboxes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              শিক্ষক নিয়োগ / নির্ধারণ
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 max-h-32 overflow-y-auto">
              {teachersList.map((teacher) => {
                const checked = formData.assignedTeachers.includes(teacher._id);
                return (
                  <label
                    key={teacher._id}
                    className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            assignedTeachers: [...formData.assignedTeachers, teacher._id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            assignedTeachers: formData.assignedTeachers.filter(
                              (id) => id !== teacher._id
                            ),
                          });
                        }
                      }}
                      className="rounded border-slate-300 text-[#00636b] focus:ring-[#00636b]"
                    />
                    <span>
                      {teacher.fullName} ({teacher.teacherCode})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Schedule Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                সাপ্তাহিক রুটিন ও সময়সূচী
              </label>
              <Button size="xs" variant="outline" onClick={addScheduleRow}>
                <Plus className="h-3 w-3 mr-1" />
                <span>ক্লাস দিন যোগ করুন</span>
              </Button>
            </div>

            <div className="space-y-2">
              {formData.schedule.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <div className="col-span-4">
                    <Select
                      value={row.day}
                      onChange={(e) => updateScheduleItem(idx, "day", e.target.value)}
                      options={Object.entries(daysBangla).map(([val, label]) => ({
                        value: val,
                        label,
                      }))}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="text"
                      placeholder="16:00"
                      value={row.startTime}
                      onChange={(e) =>
                        updateScheduleItem(idx, "startTime", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="text"
                      placeholder="17:30"
                      value={row.endTime}
                      onChange={(e) => updateScheduleItem(idx, "endTime", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeScheduleRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="মুছুন"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
            }}
          >
            বাতিল
          </Button>
          <Button
            onClick={() => handleSaveBatch(editDialogOpen)}
            disabled={formSubmitting}
            className="bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            {formSubmitting
              ? "সংরক্ষণ হচ্ছে..."
              : editDialogOpen
                ? "আপডেট করুন"
                : "খুলুন"}
          </Button>
        </div>
      </Dialog>

      {/* DIALOG 2: Batch Details & Live Capacity View */}
      <Dialog
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        title="ব্যাচের পূর্ণাঙ্গ বিবরণ ও আসন পরিস্থিতি"
        size="md"
      >
        {detailLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          batchDetail && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-mono text-xs font-bold text-[#00636b] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {batchDetail.batch.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {batchDetail.batch.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {classLevelLabels[batchDetail.batch.classLevel] ||
                    batchDetail.batch.classLevel}{" "}
                  • সেশন: {batchDetail.batch.academicSession?.name}
                </p>
              </div>

              {/* Capacity Meter */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-800">আসন পূরণ পরিস্থিতি</span>
                  <span className="font-mono font-bold text-[#00636b]">
                    {toBanglaNumber(batchDetail.enrolledCount)} /{" "}
                    {toBanglaNumber(batchDetail.batch.capacity)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${
                      batchDetail.isFull ? "bg-rose-500" : "bg-[#00636b]"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (batchDetail.enrolledCount / batchDetail.batch.capacity) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>
                    খালি আসন:{" "}
                    <strong className="text-slate-800">
                      {toBanglaNumber(batchDetail.availableSeats)}
                    </strong>{" "}
                    টি
                  </span>
                  <Badge
                    variant={batchDetail.isFull ? "danger" : "success"}
                    className="text-[10px]"
                  >
                    {batchDetail.isFull ? "আসন পূর্ণ" : "ভর্তি চলছে"}
                  </Badge>
                </div>
              </div>

              {/* Timetable */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  সাপ্তাহিক ক্লাসের রুটিন
                </h5>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                  {batchDetail.batch.schedule?.map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 px-3 flex items-center justify-between text-xs bg-white"
                    >
                      <span className="font-medium text-slate-800">
                        {daysBangla[item.day] || item.day}
                      </span>
                      <span className="font-mono text-slate-600">
                        {item.startTime} - {item.endTime} (কক্ষ: {item.roomNo || "১"})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        <div className="pt-4 border-t border-slate-200 flex justify-end mt-4">
          <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
            বন্ধ করুন
          </Button>
        </div>
      </Dialog>

      {/* DIALOG 3: Archive Confirmation */}
      <Dialog
        isOpen={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        title="ব্যাচ সমাপ্ত ও আর্কাইভ করুন"
        description="ব্যাচটি সমাপ্ত করা হলে এর পূর্বের সমস্ত হাজিরা ও ফলাফল ডেটাবেজে সংরক্ষিত থাকবে।"
      >
        <div className="py-2 text-sm text-slate-600">
          আপনি কি নিশ্চিতভাবে{" "}
          <strong className="text-slate-900">{targetBatch?.name}</strong> (
          {targetBatch?.code})-কে সমাপ্ত ঘোষণা ও আর্কাইভ করতে চান?
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
            ফিরে যান
          </Button>
          <Button variant="danger" onClick={handleArchiveBatch}>
            হ্যাঁ, আর্কাইভ করুন
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
