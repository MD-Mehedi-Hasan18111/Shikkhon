"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
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
import { ActionDropdown } from "@/components/ui/ActionDropdown";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface TeacherItem {
  _id: string;
  teacherCode: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  qualifications: string[];
  subjects: string[];
  biography?: string;
  joiningDate: string;
  isActive: boolean;
}

interface AssignedBatchItem {
  _id: string;
  name: string;
  code: string;
  classLevel: string;
  capacity: number;
  status: string;
  academicSession?: {
    name: string;
    code: string;
  };
}

export default function TeacherManagementPage() {
  const dispatch = useAppDispatch();

  // List & Filter States
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);

  // Selected Target Teacher
  const [targetTeacher, setTargetTeacher] = useState<TeacherItem | null>(null);
  const [assignedBatches, setAssignedBatches] = useState<AssignedBatchItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    qualifications: "",
    subjects: "",
    biography: "",
    password: "123456",
    avatarUrl: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 1. Fetch Teachers List
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (activeFilter) params.set("isActive", activeFilter);

      const res = await fetch(`/api/teachers?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "শিক্ষকদের তালিকা লোড করা সম্ভব হয়নি।");
      }

      setTeachers(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalTeachers(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // 2. Open Detail Dialog
  const openDetailDialog = async (teacher: TeacherItem) => {
    setTargetTeacher(teacher);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/teachers/${teacher._id}`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setAssignedBatches(json.data.assignedBatches || []);
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "শিক্ষকের বিস্তারিত তথ্য পাওয়া যায়নি।",
        })
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // 3. Open Edit Dialog
  const openEditDialog = (teacher: TeacherItem) => {
    setTargetTeacher(teacher);
    setFormData({
      fullName: teacher.fullName,
      phone: teacher.phone,
      email: teacher.email || "",
      qualifications: teacher.qualifications.join(", "),
      subjects: teacher.subjects.join(", "),
      biography: teacher.biography || "",
      password: "",
      avatarUrl: teacher.avatarUrl || "",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  // 4. Save Teacher (Create / Edit)
  const handleSaveTeacher = async (isEdit: boolean) => {
    setFormSubmitting(true);
    setFormErrors({});

    const qualificationsArray = formData.qualifications
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const subjectsArray = formData.subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (subjectsArray.length === 0) {
      setFormErrors({ subjects: "কমপক্ষে একটি পাঠদানের বিষয় উল্লেখ করুন" });
      setFormSubmitting(false);
      return;
    }

    const payload: Record<string, unknown> = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      password: formData.password
        ? formData.password.trim()
        : isEdit
          ? undefined
          : "123456",
      qualifications: qualificationsArray,
      subjects: subjectsArray,
      biography: formData.biography.trim() || undefined,
      avatarUrl: formData.avatarUrl.trim() || undefined,
    };

    try {
      const url = isEdit ? `/api/teachers/${targetTeacher?._id}` : "/api/teachers";
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
            ? "শিক্ষকের তথ্য সফলভাবে আপডেট হয়েছে।"
            : "নতুন শিক্ষক সফলভাবে যুক্ত করা হয়েছে।",
        })
      );

      if (isEdit) setEditDialogOpen(false);
      else setCreateDialogOpen(false);

      fetchTeachers();
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

  // 5. Deactivate Teacher
  const handleDeactivateTeacher = async () => {
    if (!targetTeacher) return;
    try {
      const res = await fetch(`/api/teachers/${targetTeacher._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
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
          message:
            "শিক্ষকের অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে (অ্যাকাডেমিক ইতিহাস অক্ষুণ্ণ রয়েছে)।",
        })
      );

      setDeactivateDialogOpen(false);
      fetchTeachers();
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

  // 6. Reactivate Teacher
  const handleActivateTeacher = async () => {
    if (!targetTeacher) return;
    try {
      const res = await fetch(`/api/teachers/${targetTeacher._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "সক্রিয় করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সক্রিয়করণ সম্পন্ন",
          message: "শিক্ষকের অ্যাকাউন্ট সফলভাবে পুনরায় সক্রিয় করা হয়েছে।",
        })
      );

      setActivateDialogOpen(false);
      fetchTeachers();
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

  const getTeacherActionItems = (teacher: TeacherItem) => [
    {
      label: "বিস্তারিত দেখুন",
      icon: <Eye className="h-4 w-4" />,
      onClick: () => openDetailDialog(teacher),
      variant: "primary" as const,
    },
    {
      label: "তথ্য সম্পাদন",
      icon: <Edit className="h-4 w-4" />,
      onClick: () => openEditDialog(teacher),
      variant: "warning" as const,
    },
    {
      label: "শিক্ষক পুনরায় সক্রিয় করুন",
      icon: <CheckCircle2 className="h-4 w-4" />,
      onClick: () => {
        setTargetTeacher(teacher);
        setActivateDialogOpen(true);
      },
      variant: "success" as const,
      hidden: teacher.isActive,
    },
    {
      label: "শিক্ষক নিষ্ক্রিয় করুন",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => {
        setTargetTeacher(teacher);
        setDeactivateDialogOpen(true);
      },
      variant: "danger" as const,
      hidden: !teacher.isActive,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="শিক্ষক ব্যবস্থাপনা (Teacher Management)"
        subtitle="কোচিং সেন্টারের সম্মানিত শিক্ষকবৃন্দের তালিকা, বিষয়ভিত্তিক অ্যাসাইনমেন্ট ও প্রোফাইল"
        breadcrumbs={[{ label: "ড্যাশবোর্ড", href: "/admin" }, { label: "শিক্ষকবৃন্দ" }]}
        actions={
          <Button
            onClick={() => {
              setFormData({
                fullName: "",
                phone: "",
                email: "",
                qualifications: "",
                subjects: "",
                biography: "",
                password: "123456",
                avatarUrl: "",
              });
              setFormErrors({});
              setCreateDialogOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন শিক্ষক যুক্ত করুন</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="শিক্ষকের নাম, কোড, মোবাইল বা বিষয় লিখে খুঁজুন..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-[#00636b] focus:outline-none focus:ring-1 focus:ring-[#00636b] transition"
              />
            </div>

            <div>
              <Select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "সকল শিক্ষক (All Teachers)" },
                  { value: "true", label: "সক্রিয় শিক্ষকবৃন্দ (Active)" },
                  { value: "false", label: "নিষ্ক্রিয় শিক্ষকবৃন্দ (Deactivated)" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card className="shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <Alert variant="danger" title="ডাটা লোড ত্রুটি">
              {error}
            </Alert>
            <Button size="sm" variant="outline" onClick={fetchTeachers} className="mt-4">
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : teachers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <UserCheck className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">
              কোনো শিক্ষক পাওয়া যায়নি
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              নতুন শিক্ষক যুক্ত করুন বা ফিল্টার পরিবর্তন করুন।
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>কোড</TableHead>
                    <TableHead>শিক্ষকের নাম</TableHead>
                    <TableHead>পাঠদানের বিষয়সমূহ</TableHead>
                    <TableHead>যোগাযোগ</TableHead>
                    <TableHead>যোগদানের তারিখ</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher._id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs font-bold text-[#c27a29]">
                        {teacher.teacherCode}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-sm">
                          {teacher.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {teacher.qualifications.join(", ") ||
                            "শিক্ষাগত যোগ্যতা উল্লেখ নেই"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((sub, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono text-slate-800">
                          {teacher.phone}
                        </div>
                        {teacher.email && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {teacher.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatBanglaDate(teacher.joiningDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={teacher.isActive ? "success" : "danger"}
                          className="text-xs font-semibold"
                        >
                          {teacher.isActive ? "সক্রিয়" : "নিষ্ক্রিয় (Deactivated)"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionDropdown
                          ariaLabel="শিক্ষক অ্যাকশন"
                          items={getTeacherActionItems(teacher)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {teachers.map((teacher) => (
                <div key={teacher._id} className="p-4 bg-white hover:bg-slate-50/60 transition space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#c27a29] bg-amber-50 px-2 py-0.5 rounded">
                          {teacher.teacherCode}
                        </span>
                        <Badge
                          variant={teacher.isActive ? "success" : "danger"}
                          className="text-[11px] font-semibold"
                        >
                          {teacher.isActive ? "সক্রিয়" : "নিষ্ক্রিয় (Deactivated)"}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{teacher.fullName}</h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {teacher.qualifications.join(", ") || "শিক্ষাগত যোগ্যতা উল্লেখ নেই"}
                      </p>
                    </div>
                    <ActionDropdown
                      ariaLabel="শিক্ষক অ্যাকশন"
                      items={getTeacherActionItems(teacher)}
                    />
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-1">পাঠদানের বিষয়সমূহ</span>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.map((sub, idx) => (
                          <Badge key={idx} variant="outline" className="text-[11px] font-normal py-0">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                      <div>
                        <span className="text-slate-400 block text-[10px]">মোবাইল</span>
                        <span className="font-mono font-medium text-slate-800">{teacher.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">যোগদান</span>
                        <span className="text-slate-600">{formatBanglaDate(teacher.joiningDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              মোট {toBanglaNumber(totalTeachers)} জন শিক্ষকের মধ্যে পৃষ্ঠা{" "}
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

      {/* DIALOG 1: Create / Edit Teacher */}
      <Dialog
        isOpen={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        title={editDialogOpen ? "শিক্ষকের তথ্য সম্পাদন" : "নতুন শিক্ষক যুক্ত করুন"}
        size="md"
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
              onClick={() => handleSaveTeacher(editDialogOpen)}
              disabled={formSubmitting}
              className="bg-[#00636b] hover:bg-[#004f55] text-white"
            >
              {formSubmitting
                ? "সংরক্ষণ হচ্ছে..."
                : editDialogOpen
                  ? "আপডেট করুন"
                  : "যুক্ত করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Teacher Image Upload */}
          <div className="p-4 sm:p-4.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200/70 pb-2">
              <h5 className="text-xs font-bold text-[#00636b] uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#00636b]" />
                শিক্ষকের ছবি (Passport Photo)
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
                  শিক্ষকের পাসপোর্ট সাইজের ছবি আপলোড করুন
                </p>
                <p className="text-[11.5px] leading-relaxed text-slate-500">
                  ছবির সর্বোচ্চ সাইজ ৫ মেগাবাইট (JPG, PNG বা WebP ফরম্যাট)। এটি
                  ওয়েবসাইটে শিক্ষক পরিচিতি ও ড্যাশবোর্ডে প্রদর্শিত হবে।
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              শিক্ষকের পুরো নাম <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="যেমন: ইঞ্জিনিয়ার মাহমুদ হাসান"
              error={formErrors.fullName}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              মোবাইল নম্বর <span className="text-rose-500">*</span>
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
              placeholder="teacher@example.com"
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
              * এই পাসওয়ার্ড ও মোবাইল নম্বর দিয়ে শিক্ষক সিস্টেমে লগইন করে ড্যাশবোর্ড
              ব্যবহার করতে পারবেন।
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              পাঠদানের বিষয়সমূহ (কমা দিয়ে লিখুন) <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.subjects}
              onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
              placeholder="পদার্থবিজ্ঞান, উচ্চতর গণিত"
              error={formErrors.subjects}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              শিক্ষাগত যোগ্যতা (কমা দিয়ে লিখুন)
            </label>
            <Input
              value={formData.qualifications}
              onChange={(e) =>
                setFormData({ ...formData, qualifications: e.target.value })
              }
              placeholder="বিএসসি (সিএসই, চুয়েট), এমএসসি"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              সংক্ষিপ্ত পরিচিতি
            </label>
            <Input
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              placeholder="শিক্ষকতার অভিজ্ঞতা ও ব্যাকগ্রাউন্ড..."
            />
          </div>
        </div>
      </Dialog>

      {/* DIALOG 2: Teacher Detail Dialog */}
      <Dialog
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        title="শিক্ষকের বিস্তারিত প্রোফাইল"
        size="md"
        footer={
          <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
            বন্ধ করুন
          </Button>
        }
      >
        {detailLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          targetTeacher && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                {targetTeacher.avatarUrl ? (
                  <img
                    src={targetTeacher.avatarUrl}
                    alt={targetTeacher.fullName}
                    className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#00636b]/10 text-[#00636b] flex items-center justify-center font-bold text-lg border border-[#00636b]/20 shrink-0">
                    {targetTeacher.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="font-mono text-xs font-bold text-[#c27a29] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {targetTeacher.teacherCode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {targetTeacher.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    মোবাইল: <span className="font-mono">{targetTeacher.phone}</span>
                  </p>
                  {targetTeacher.email && (
                    <p className="text-xs text-slate-500">ইমেইল: {targetTeacher.email}</p>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  নির্ধারিত ব্যাচসমূহ
                </h5>
                {assignedBatches.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 text-center text-xs text-slate-400">
                    বর্তমানে এই শিক্ষক কোনো সক্রিয় ব্যাচে নির্ধারিত নেই।
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {assignedBatches.map((b) => (
                      <div
                        key={b._id}
                        className="p-3 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{b.name}</p>
                          <p className="text-slate-500 text-[11px]">
                            সেশন: {b.academicSession?.name || "চলমান"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs font-normal">
                          আসন: {b.capacity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </Dialog>

      {/* DIALOG 3: Deactivate Confirmation */}
      <Dialog
        isOpen={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        title="শিক্ষক নিষ্ক্রিয়করণ"
        description="শিক্ষককে নিষ্ক্রিয় করা হলেও তার অতীতের সকল ব্যাচ অ্যাসাইনমেন্ট ও ক্লাস রেকর্ড অক্ষুণ্ণ থাকবে।"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              ফিরে যান
            </Button>
            <Button variant="danger" onClick={handleDeactivateTeacher}>
              হ্যাঁ, নিষ্ক্রিয় করুন
            </Button>
          </>
        }
      >
        <div className="py-2 text-sm text-slate-600">
          আপনি কি নিশ্চিতভাবে{" "}
          <strong className="text-slate-900">{targetTeacher?.fullName}</strong>
          -কে নিষ্ক্রিয় করতে চান?
        </div>
      </Dialog>

      {/* DIALOG 4: Reactivate Confirmation */}
      <Dialog
        isOpen={activateDialogOpen}
        onClose={() => setActivateDialogOpen(false)}
        title="শিক্ষক পুনরায় সক্রিয়করণ"
        description="শিক্ষককে সক্রিয় করা হলে তিনি পুনরায় ড্যাশবোর্ডে লগইন করতে পারবেন এবং নতুন ব্যাচে ক্লাস পরিচালনা করতে পারবেন।"
        footer={
          <>
            <Button variant="outline" onClick={() => setActivateDialogOpen(false)}>
              ফিরে যান
            </Button>
            <Button
              variant="primary"
              onClick={handleActivateTeacher}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              হ্যাঁ, সক্রিয় করুন
            </Button>
          </>
        }
      >
        <div className="py-2 text-sm text-slate-600">
          আপনি কি নিশ্চিতভাবে{" "}
          <strong className="text-slate-900">{targetTeacher?.fullName}</strong> (কোড:{" "}
          <span className="font-mono text-[#00636b]">{targetTeacher?.teacherCode}</span>)-কে
          পুনরায় সক্রিয় করতে চান?
        </div>
      </Dialog>
    </div>
  );
}
