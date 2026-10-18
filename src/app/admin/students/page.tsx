"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  AlertCircle,
  Phone,
  School,
  X,
  CheckCircle2,
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
import { ImageUpload } from "@/components/ui/ImageUpload";

interface StudentItem {
  _id: string;
  studentId: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  institutionName: string;
  classLevel: string;
  academicGroup: string;
  bloodGroup?: string;
  gender: string;
  guardian: {
    name: string;
    phone: string;
    relation: string;
    occupation?: string;
  };
  address: {
    present: string;
    permanent?: string;
  };
  status: "active" | "inactive" | "graduated" | "suspended";
  createdAt: string;
}

interface StudentDetailData {
  student: StudentItem;
  enrollments: Array<{
    _id: string;
    batch: {
      _id: string;
      name: string;
      code: string;
      classLevel: string;
      monthlyFee: number;
    };
    academicSession: {
      name: string;
      code: string;
    };
    rollNumber?: string;
    feeDiscountPercent: number;
    status: string;
    enrollmentDate: string;
  }>;
  attendanceStats: Array<{
    _id: string;
    count: number;
  }>;
  recentResults: Array<{
    _id: string;
    exam: {
      title: string;
      subject: string;
      maximumMarks: number;
      examDate: string;
    };
    obtainedMarks: number;
    grade?: string;
  }>;
}

interface BatchOption {
  _id: string;
  name: string;
  code: string;
  capacity: number;
  classLevel: string;
}

const classLevelOptions = [
  { value: "", label: "সকল শ্রেণি" },
  { value: "class_6", label: "৬ষ্ঠ শ্রেণি" },
  { value: "class_7", label: "৭ম শ্রেণি" },
  { value: "class_8", label: "৮ম শ্রেণি" },
  { value: "class_9", label: "৯ম শ্রেণি" },
  { value: "class_10", label: "১০ম শ্রেণি (এসএসসি)" },
  { value: "hsc_1st", label: "একাদশ শ্রেণি (এইচএসসি ১ম বর্ষ)" },
  { value: "hsc_2nd", label: "দ্বাদশ শ্রেণি (এইচএসসি ২য় বর্ষ)" },
  { value: "alim_1st", label: "আলিম ১ম বর্ষ" },
  { value: "alim_2nd", label: "আলিম ২য় বর্ষ" },
  { value: "admission", label: "ভর্তি প্রস্তুতি" },
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

export default function StudentManagementPage() {
  const dispatch = useAppDispatch();
  const [, startTransition] = useTransition();

  // List & Filter States
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("active");

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Selected Target Student for actions
  const [targetStudent, setTargetStudent] = useState<StudentItem | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Available Batches for Enrollment Dialog
  const [availableBatches, setAvailableBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [rollNumberInput, setRollNumberInput] = useState("");
  const [discountInput, setDiscountInput] = useState("0");
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    institutionName: "",
    classLevel: "class_10",
    academicGroup: "general",
    bloodGroup: "",
    gender: "male",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "পিতা",
    guardianOccupation: "",
    presentAddress: "",
    permanentAddress: "",
    notes: "",
    password: "123456",
    avatarUrl: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 1. Fetch Students List
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (selectedClass) params.set("classLevel", selectedClass);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/students?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "শিক্ষার্থীদের তালিকা লোড করা যায়নি।");
      }

      setStudents(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalStudents(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedClass, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 2. Fetch Batches for Enrollment dropdown
  const loadAvailableBatches = async () => {
    try {
      const res = await fetch("/api/batches?status=active&limit=50", {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setAvailableBatches(json.data || []);
      }
    } catch (err) {
      console.error("Batches fetch error:", err);
    }
  };

  // 3. Open Detail Modal
  const openDetailDialog = async (student: StudentItem) => {
    setTargetStudent(student);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/students/${student._id}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setStudentDetails(json.data);
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "শিক্ষার্থীর বিস্তারিত তথ্য আনা সম্ভব হয়নি।",
        })
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // 4. Open Edit Modal
  const openEditDialog = (student: StudentItem) => {
    setTargetStudent(student);
    setFormData({
      fullName: student.fullName,
      phone: student.phone,
      email: student.email || "",
      institutionName: student.institutionName,
      classLevel: student.classLevel,
      academicGroup: student.academicGroup || "general",
      bloodGroup: student.bloodGroup || "",
      gender: student.gender || "male",
      guardianName: student.guardian.name,
      guardianPhone: student.guardian.phone,
      guardianRelation: student.guardian.relation || "পিতা",
      guardianOccupation: student.guardian.occupation || "",
      presentAddress: student.address.present,
      permanentAddress: student.address.permanent || "",
      notes: "",
      password: "",
      avatarUrl: student.avatarUrl || "",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  // 5. Open Batch Enrollment Modal
  const openEnrollDialog = (student: StudentItem) => {
    setTargetStudent(student);
    setSelectedBatchId("");
    setRollNumberInput("");
    setDiscountInput("0");
    loadAvailableBatches();
    setEnrollDialogOpen(true);
  };

  // 6. Handle Create / Edit Submission
  const handleSaveStudent = async (isEdit: boolean) => {
    setFormSubmitting(true);
    setFormErrors({});

    const payload: Record<string, unknown> = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      password: formData.password
        ? formData.password.trim()
        : isEdit
          ? undefined
          : "123456",
      institutionName: formData.institutionName.trim(),
      classLevel: formData.classLevel,
      academicGroup: formData.academicGroup,
      bloodGroup: formData.bloodGroup || undefined,
      gender: formData.gender,
      guardian: {
        name: formData.guardianName.trim(),
        phone: formData.guardianPhone.trim(),
        relation: formData.guardianRelation,
        occupation: formData.guardianOccupation.trim() || undefined,
      },
      address: {
        present: formData.presentAddress.trim(),
        permanent: formData.permanentAddress.trim() || undefined,
      },
      notes: formData.notes.trim() || undefined,
      avatarUrl: formData.avatarUrl.trim() || undefined,
    };

    try {
      const url = isEdit ? `/api/students/${targetStudent?._id}` : "/api/students";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors && typeof json.errors === "object") {
          const flatErrors: Record<string, string> = {};
          for (const [k, v] of Object.entries(json.errors)) {
            flatErrors[k] = Array.isArray(v) ? v[0] : String(v);
          }
          setFormErrors(flatErrors);
        }
        throw new Error(json.message || "সংরক্ষণ করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: isEdit
            ? "শিক্ষার্থীর তথ্য সফলভাবে আপডেট হয়েছে।"
            : "নতুন শিক্ষার্থী সফলভাবে ভর্তি ও নিবন্ধিত হয়েছে।",
        })
      );

      if (isEdit) setEditDialogOpen(false);
      else setCreateDialogOpen(false);

      fetchStudents();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ব্যর্থ",
          message: err instanceof Error ? err.message : "একটি সমস্যা হয়েছে।",
        })
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // 7. Handle Batch Enrollment Submit
  const handleEnrollSubmit = async () => {
    if (!targetStudent || !selectedBatchId) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "অনুগ্রহ করে একটি ব্যাচ নির্বাচন করুন।",
        })
      );
      return;
    }

    setEnrollLoading(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          student: targetStudent._id,
          batch: selectedBatchId,
          rollNumber: rollNumberInput.trim() || undefined,
          feeDiscountPercent: parseFloat(discountInput) || 0,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "ভর্তি সম্পন্ন করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "ভর্তি সম্পন্ন",
          message: "শিক্ষার্থীকে সফলভাবে ব্যাচে ভর্তি করা হয়েছে।",
        })
      );

      setEnrollDialogOpen(false);
      fetchStudents();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "ভর্তি ব্যর্থ",
          message: err instanceof Error ? err.message : "ভর্তিতে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setEnrollLoading(false);
    }
  };

  // 8. Handle Student Safe Deactivation
  const handleDeactivateStudent = async () => {
    if (!targetStudent) return;
    try {
      const res = await fetch(`/api/students/${targetStudent._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "নিষ্ক্রিয় করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "নিষ্ক্রিয়করণ সম্পন্ন",
          message: "শিক্ষার্থীর রেকর্ড নিষ্ক্রিয় ও আর্কাইভ করা হয়েছে।",
        })
      );

      setDeactivateDialogOpen(false);
      fetchStudents();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="শিক্ষার্থী ব্যবস্থাপনা (Student Management)"
        subtitle="কোচিং সেন্টারের নিবন্ধিত সকল শিক্ষার্থীর তথ্য, ভর্তি এবং অ্যাকাডেমিক হিস্টোরি"
        breadcrumbs={[
          { label: "ড্যাশবোর্ড", href: "/admin" },
          { label: "শিক্ষার্থীবৃন্দ" },
        ]}
        actions={
          <Button
            onClick={() => {
              setFormData({
                fullName: "",
                phone: "",
                email: "",
                institutionName: "",
                classLevel: "class_10",
                academicGroup: "general",
                bloodGroup: "",
                gender: "male",
                guardianName: "",
                guardianPhone: "",
                guardianRelation: "পিতা",
                guardianOccupation: "",
                presentAddress: "",
                permanentAddress: "",
                notes: "",
                password: "123456",
                avatarUrl: "",
              });
              setFormErrors({});
              setCreateDialogOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন শিক্ষার্থী ভর্তি</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="নাম, শিক্ষার্থী আইডি, মোবাইল বা স্কুল দিয়ে খুঁজুন..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-[#00636b] focus:outline-none focus:ring-1 focus:ring-[#00636b] transition"
              />
            </div>

            {/* Class Level Select */}
            <div>
              <Select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                }}
                options={classLevelOptions}
              />
            </div>

            {/* Status Select */}
            <div>
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "সকল স্ট্যাটাস" },
                  { value: "active", label: "সক্রিয় (Active)" },
                  { value: "inactive", label: "নিষ্ক্রিয় (Inactive)" },
                  { value: "graduated", label: "উত্তীর্ণ (Graduated)" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Container */}
      <Card className="shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <Alert variant="danger" title="ডাটা লোড ত্রুটি">
              {error}
            </Alert>
            <Button size="sm" variant="outline" onClick={fetchStudents} className="mt-4">
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Users className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">
              কোনো শিক্ষার্থী পাওয়া যায়নি
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              প্রদত্ত ফিল্টার অনুযায়ী কোনো রেকর্ড নেই। ফিল্টার পরিবর্তন করুন অথবা নতুন
              শিক্ষার্থী যোগ করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>আইডি</TableHead>
                  <TableHead>শিক্ষার্থীর নাম</TableHead>
                  <TableHead>শ্রেণি ও প্রতিষ্ঠান</TableHead>
                  <TableHead>মোবাইল নম্বর</TableHead>
                  <TableHead>অভিভাবকের তথ্য</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id} className="hover:bg-slate-50">
                    <TableCell className="font-mono text-xs font-bold text-[#00636b]">
                      {student.studentId}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ভর্তি: {formatBanglaDate(student.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {classLevelLabels[student.classLevel] || student.classLevel}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                        {student.institutionName}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {student.phone}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {student.guardian.name} ({student.guardian.relation})
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {student.guardian.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={student.status === "active" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {student.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {/* Details Button */}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openDetailDialog(student)}
                        className="text-slate-600 hover:text-[#00636b]"
                        title="বিস্তারিত দেখুন"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Enroll in Batch Button */}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEnrollDialog(student)}
                        className="text-teal-600 hover:bg-teal-50"
                        title="ব্যাচে ভর্তি করান"
                      >
                        <GraduationCap className="h-4 w-4" />
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEditDialog(student)}
                        className="text-blue-600 hover:bg-blue-50"
                        title="তথ্য সম্পাদন"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Deactivate Button */}
                      {student.status === "active" && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setTargetStudent(student);
                            setDeactivateDialogOpen(true);
                          }}
                          className="text-rose-600 hover:bg-rose-50"
                          title="নিষ্ক্রিয় করুন"
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

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              সর্বমোট {toBanglaNumber(totalStudents)} জন শিক্ষার্থীর মধ্যে পৃষ্ঠা{" "}
              {toBanglaNumber(page)} (মোট {toBanglaNumber(totalPages)} পৃষ্ঠা)
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/* DIALOG 1: Create / Edit Student Form Dialog */}
      {/* ============================================================ */}
      <Dialog
        isOpen={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        title={
          editDialogOpen ? "শিক্ষার্থীর তথ্য সংশোধন করুন" : "নতুন শিক্ষার্থী ভর্তি ফরম"
        }
        description="শিক্ষার্থীর সঠিক ব্যক্তিগত তথ্য, শ্রেণি ও অভিভাবকের বিবরণ প্রদান করুন।"
        size="lg"
        footer={
          <>
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
              onClick={() => handleSaveStudent(editDialogOpen)}
              disabled={formSubmitting}
              className="bg-[#00636b] hover:bg-[#004f55] text-white"
            >
              {formSubmitting
                ? "সংরক্ষণ হচ্ছে..."
                : editDialogOpen
                  ? "আপডেট করুন"
                  : "ভর্তি সম্পন্ন করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Section 0: Student Image Upload */}
          <div className="p-4 sm:p-4.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200/70 pb-2">
              <h5 className="text-xs font-bold text-[#00636b] uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#00636b]" />
                শিক্ষার্থীর ছবি (Passport Photo)
              </h5>
              <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                ঐচ্ছিক
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              <div className="shrink-0 flex flex-col items-center sm:items-start">
                <ImageUpload
                  value={formData.avatarUrl}
                  onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
                  folder="avatars"
                  aspectRatio="square"
                  rounded
                />
              </div>
              <div className="text-xs text-slate-500 space-y-1.5 text-center sm:text-left flex-1 sm:pt-1">
                <p className="font-bold text-slate-800 text-[13px]">
                  শিক্ষার্থীর পাসপোর্ট সাইজের ছবি আপলোড করুন
                </p>
                <p className="text-[11.5px] leading-relaxed text-slate-500">
                  ছবির সর্বোচ্চ সাইজ ৫ মেগাবাইট (JPG, PNG বা WebP ফরম্যাট)। এটি
                  শিক্ষার্থীর আইডি কার্ড, হাজিরা শিট ও ড্যাশবোর্ড প্রোফাইলে প্রদর্শিত হবে।
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Basic Info */}
          <div>
            <h5 className="text-xs font-bold text-[#00636b] uppercase tracking-wider mb-2">
              ১. শিক্ষার্থীর মৌলিক তথ্য
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  পুরো নাম <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="যেমন: মুহাম্মদ রাকিব হাসান"
                  error={formErrors.fullName}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  শিক্ষার্থীর মোবাইল <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="০১৭১১XXXXXX"
                  error={formErrors.phone}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ইমেইল (ঐচ্ছিক)
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  error={formErrors.email}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  লগইন পাসওয়ার্ড (ড্যাশবোর্ড অ্যাক্সেস){" "}
                  {editDialogOpen ? (
                    "(পরিবর্তন করতে চাইলে লিখুন)"
                  ) : (
                    <span className="text-rose-500">*</span>
                  )}
                </label>
                <Input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="কমপক্ষে ৬ অক্ষর (যেমন: 123456)"
                  error={formErrors.password}
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  * এই পাসওয়ার্ড ও মোবাইল নম্বর দিয়ে শিক্ষার্থী সিস্টেমে লগইন করতে পারবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  স্কুল বা কলেজের নাম <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.institutionName}
                  onChange={(e) =>
                    setFormData({ ...formData, institutionName: e.target.value })
                  }
                  placeholder="যেমন: হালিশহর সেন্ট্রাল কলেজ"
                  error={formErrors.institutionName}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  শ্রেণি স্তর <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={formData.classLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, classLevel: e.target.value })
                  }
                  options={classLevelOptions.filter((opt) => opt.value !== "")}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  বিভাগ/গ্রুপ
                </label>
                <Select
                  value={formData.academicGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, academicGroup: e.target.value })
                  }
                  options={[
                    { value: "general", label: "সাধারণ (General)" },
                    { value: "science", label: "বিজ্ঞান (Science)" },
                    { value: "humanities", label: "মানবিক (Humanities)" },
                    { value: "business_studies", label: "ব্যবসায় শিক্ষা (Commerce)" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Guardian Info */}
          <div className="pt-2 border-t border-slate-100">
            <h5 className="text-xs font-bold text-[#00636b] uppercase tracking-wider mb-2">
              ২. অভিভাবকের তথ্য
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  অভিভাবকের নাম <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.guardianName}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianName: e.target.value })
                  }
                  placeholder="যেমন: মো. দেলোয়ার হোসেন"
                  error={formErrors["guardian.name"]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  অভিভাবকের মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.guardianPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianPhone: e.target.value })
                  }
                  placeholder="০১৮১২XXXXXX"
                  error={formErrors["guardian.phone"]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  সম্পর্ক
                </label>
                <Input
                  value={formData.guardianRelation}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianRelation: e.target.value })
                  }
                  placeholder="পিতা / মাতা / বড় ভাই"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  পেশা (ঐচ্ছিক)
                </label>
                <Input
                  value={formData.guardianOccupation}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianOccupation: e.target.value })
                  }
                  placeholder="যেমন: ব্যবসায়ী / শিক্ষক"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Address */}
          <div className="pt-2 border-t border-slate-100">
            <h5 className="text-xs font-bold text-[#00636b] uppercase tracking-wider mb-2">
              ৩. বর্তমান ও স্থায়ী ঠিকানা
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  বর্তমান ঠিকানা <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.presentAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, presentAddress: e.target.value })
                  }
                  placeholder="রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম"
                  error={formErrors["address.present"]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  স্থায়ী ঠিকানা
                </label>
                <Input
                  value={formData.permanentAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, permanentAddress: e.target.value })
                  }
                  placeholder="গ্রাম, থানা, জেলা"
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG 2: Student Details Dialog */}
      {/* ============================================================ */}
      <Dialog
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        title="শিক্ষার্থীর পূর্ণাঙ্গ প্রোফাইল ও অ্যাকাডেমিক বিবরণ"
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
            বন্ধ করুন
          </Button>
        }
      >
        {detailLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          targetStudent && (
            <div className="space-y-5">
              {/* Header Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[#00636b] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {targetStudent.studentId}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {targetStudent.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {targetStudent.institutionName} •{" "}
                    {classLevelLabels[targetStudent.classLevel] ||
                      targetStudent.classLevel}
                  </p>
                </div>
                <Badge
                  variant={targetStudent.status === "active" ? "success" : "secondary"}
                >
                  {targetStudent.status === "active" ? "সক্রিয় শিক্ষার্থী" : "নিষ্ক্রিয়"}
                </Badge>
              </div>

              {/* Guardian & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <h5 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                    যোগাযোগের তথ্য
                  </h5>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">মোবাইল:</span>{" "}
                    {targetStudent.phone}
                  </p>
                  {targetStudent.email && (
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-medium text-slate-800">ইমেইল:</span>{" "}
                      {targetStudent.email}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-medium text-slate-800">ঠিকানা:</span>{" "}
                    {targetStudent.address.present}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <h5 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                    অভিভাবকের বিবরণ
                  </h5>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">নাম:</span>{" "}
                    {targetStudent.guardian.name}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-medium text-slate-800">সম্পর্ক:</span>{" "}
                    {targetStudent.guardian.relation}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-medium text-slate-800">অভিভাবক ফোন:</span>{" "}
                    {targetStudent.guardian.phone}
                  </p>
                </div>
              </div>

              {/* Enrolled Batches */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-[#00636b]" />
                  <span>ভর্তিকৃত ব্যাচসমূহ (Enrollment History)</span>
                </h5>
                {!studentDetails?.enrollments?.length ? (
                  <div className="p-4 rounded-lg bg-slate-50 text-center text-xs text-slate-400">
                    শিক্ষার্থী এখনও কোনো নির্দিষ্ট ব্যাচে ভর্তি হয়নি।
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    {studentDetails.enrollments.map((enr) => (
                      <div
                        key={enr._id}
                        className="p-3 flex items-center justify-between text-xs bg-white"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{enr.batch.name}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            সেশন: {enr.academicSession.name} • রোল:{" "}
                            {enr.rollNumber || "নাই"}
                          </p>
                        </div>
                        <Badge
                          variant={enr.status === "active" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {enr.status === "active" ? "চলমান" : enr.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Results */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-purple-600" />
                  <span>সাম্প্রতিক পরীক্ষার ফলাফল (Recent Exam Marks)</span>
                </h5>
                {!studentDetails?.recentResults?.length ? (
                  <div className="p-4 rounded-lg bg-slate-50 text-center text-xs text-slate-400">
                    কোনো পরীক্ষার ফলাফল এখনও জমা দেওয়া হয়নি।
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    {studentDetails.recentResults.map((res) => (
                      <div
                        key={res._id}
                        className="p-3 flex items-center justify-between text-xs bg-white"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{res.exam.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            বিষয়: {res.exam.subject}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#00636b]">
                            {toBanglaNumber(res.obtainedMarks)} /{" "}
                            {toBanglaNumber(res.exam.maximumMarks)}
                          </span>
                          {res.grade && (
                            <span className="ml-2 font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px]">
                              {res.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG 3: Enroll in Batch Modal */}
      {/* ============================================================ */}
      <Dialog
        isOpen={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        title="শিক্ষার্থীকে ব্যাচে ভর্তি করান (Batch Enrollment)"
        description={`শিক্ষার্থী: ${targetStudent?.fullName} (${targetStudent?.studentId})`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
              বাতিল
            </Button>
            <Button
              onClick={handleEnrollSubmit}
              disabled={enrollLoading || !selectedBatchId}
              className="bg-[#00636b] hover:bg-[#004f55] text-white"
            >
              {enrollLoading ? "ভর্তি হচ্ছে..." : "ভর্তি নিশ্চিত করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              সক্রিয় ব্যাচ নির্বাচন করুন <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              options={[
                { value: "", label: "ব্যাচ নির্বাচন করুন..." },
                ...availableBatches.map((b) => ({
                  value: b._id,
                  label: `${b.name} (${classLevelLabels[b.classLevel] || b.classLevel}) - আসন: ${b.capacity}`,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                রোল নম্বর
              </label>
              <Input
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value)}
                placeholder="যেমন: ১০১"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ফি ডিসকাউন্ট (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="০%"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG 4: Safe Deactivation Confirmation */}
      {/* ============================================================ */}
      <Dialog
        isOpen={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        title="শিক্ষার্থীর রেকর্ড নিষ্ক্রিয়করণ নিশ্চিতকরণ"
        description="শিক্ষার্থীর রেকর্ডটি নিষ্ক্রিয় করা হলে তার পূর্ববর্তী সকল ভর্তি, হাজিরা ও ফলাফল ডেটাবেজে সংরক্ষিত থাকবে।"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              না, ফিরে যান
            </Button>
            <Button
              variant="danger"
              onClick={handleDeactivateStudent}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              হ্যাঁ, নিষ্ক্রিয় করুন
            </Button>
          </>
        }
      >
        <div className="py-2 text-sm text-slate-600">
          আপনি কি নিশ্চিতভাবে{" "}
          <strong className="text-slate-900">{targetStudent?.fullName}</strong> (আইডি:{" "}
          <span className="font-mono text-[#00636b]">{targetStudent?.studentId}</span>)-কে
          নিষ্ক্রিয় ও আর্কাইভ করতে চান?
        </div>
      </Dialog>
    </div>
  );
}
