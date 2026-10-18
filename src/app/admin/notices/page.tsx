"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Pin,
  Globe,
  Users,
  UserCheck,
  CheckCircle2,
  Archive,
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
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";

interface NoticeItem {
  _id: string;
  title: string;
  summary?: string;
  content: string;
  visibility: "public" | "students" | "teachers" | "all";
  priority: "normal" | "important" | "urgent";
  isPinned: boolean;
  status: "draft" | "published" | "archived";
  images?: string[];
  publishedAt: string;
  author?: {
    fullName: string;
    role: string;
  };
}

export default function NoticeManagementPage() {
  const dispatch = useAppDispatch();

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotices, setTotalNotices] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [targetNotice, setTargetNotice] = useState<NoticeItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    visibility: "all",
    priority: "normal",
    isPinned: false,
    status: "published",
    images: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/notices?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "নোটিশ লোড করা সম্ভব হয়নি।");
      }

      setNotices(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalNotices(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const openCreateDialog = () => {
    setFormData({
      title: "",
      content: "",
      summary: "",
      visibility: "all",
      priority: "normal",
      isPinned: false,
      status: "published",
      images: [],
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (notice: NoticeItem) => {
    setTargetNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      summary: notice.summary || "",
      visibility: notice.visibility,
      priority: notice.priority,
      isPinned: notice.isPinned,
      status: notice.status,
      images: notice.images || [],
    });
    setEditDialogOpen(true);
  };

  const handleSaveNotice = async (isEdit: boolean) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "নোটিশের শিরোনাম ও বিস্তারিত বিবরণ আবশ্যক।",
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/notices/${targetNotice?._id}` : "/api/notices";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "সংরক্ষণ করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: isEdit ? "নোটিশ আপডেট হয়েছে।" : "নতুন নোটিশ প্রকাশিত হয়েছে।",
        })
      );

      if (isEdit) setEditDialogOpen(false);
      else setCreateDialogOpen(false);

      fetchNotices();
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

  const handleArchiveNotice = async (noticeId: string) => {
    try {
      const res = await fetch(`/api/notices/${noticeId}`, {
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
          message: "নোটিশটি আর্কাইভ করা হয়েছে।",
        })
      );

      fetchNotices();
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
      <PageHeader
        title="নোটিশ বোর্ড ব্যবস্থাপনা (Notice Board)"
        subtitle="প্রতিষ্ঠানের জরুরি ঘোষণা, ক্লাস সংক্রান্ত নোটিশ জারি ও প্রকাশনা নিয়ন্ত্রণ"
        breadcrumbs={[{ label: "ড্যাশবোর্ড", href: "/admin" }, { label: "নোটিশ বোর্ড" }]}
        actions={
          <Button
            onClick={openCreateDialog}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন নোটিশ জারি করুন</span>
          </Button>
        }
      />

      {/* Filter and Search */}
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
                placeholder="শিরোনাম বা বিষয়বস্তু লিখে অনুসন্ধান করুন..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-[#00636b] focus:outline-none focus:ring-1 focus:ring-[#00636b] transition"
              />
            </div>

            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "সকল নোটিশ" },
                  { value: "published", label: "প্রকাশিত নোটিশ" },
                  { value: "draft", label: "খসড়া (Draft)" },
                  { value: "archived", label: "আর্কাইভকৃত নোটিশ" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
            <Button size="sm" variant="outline" onClick={fetchNotices} className="mt-4">
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              কোনো নোটিশ পাওয়া যায়নি
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              নতুন একটি নোটিশ তৈরি করে প্রকাশ করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিরোনাম</TableHead>
                  <TableHead>দর্শনার্থী পরিধি (Visibility)</TableHead>
                  <TableHead>অগ্রাধিকার</TableHead>
                  <TableHead>প্রকাশের তারিখ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice._id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {notice.isPinned && (
                          <Pin className="h-3.5 w-3.5 text-amber-600 fill-amber-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900 text-sm">
                          {notice.title}
                        </span>
                      </div>
                      {notice.summary && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                          {notice.summary}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {notice.visibility === "public"
                          ? "পাবলিক"
                          : notice.visibility === "students"
                            ? "শিক্ষার্থীবৃন্দ"
                            : notice.visibility === "teachers"
                              ? "শিক্ষকবৃন্দ"
                              : "সকলের জন্য"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          notice.priority === "urgent"
                            ? "danger"
                            : notice.priority === "important"
                              ? "warning"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {notice.priority === "urgent"
                          ? "জরুরি"
                          : notice.priority === "important"
                            ? "গুরুত্বপূর্ণ"
                            : "সাধারণ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatBanglaDate(notice.publishedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={notice.status === "published" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {notice.status === "published"
                          ? "প্রকাশিত"
                          : notice.status === "draft"
                            ? "ড্রাফট"
                            : "আর্কাইভকৃত"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEditDialog(notice)}
                        className="text-blue-600 hover:bg-blue-50"
                        title="সম্পাদনা"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {notice.status !== "archived" && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleArchiveNotice(notice._id)}
                          className="text-amber-600 hover:bg-amber-50"
                          title="আর্কাইভ"
                        >
                          <Archive className="h-4 w-4" />
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
              মোট {toBanglaNumber(totalNotices)} টি নোটিশের মধ্যে পৃষ্ঠা{" "}
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

      {/* DIALOG: Create / Edit Notice */}
      <Dialog
        isOpen={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        title={editDialogOpen ? "নোটিশ সম্পাদন" : "নতুন নোটিশ জারি করুন"}
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
              onClick={() => handleSaveNotice(editDialogOpen)}
              disabled={submitting}
              className="bg-[#00636b] hover:bg-[#004f55] text-white"
            >
              {submitting
                ? "সংরক্ষণ হচ্ছে..."
                : editDialogOpen
                  ? "আপডেট করুন"
                  : "জারি করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              নোটিশের শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="যেমন: পবিত্র ঈদুল ফিতর উপলক্ষে কোচিং ছুটি সংক্রান্ত বিজ্ঞপ্তি"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              সংক্ষিপ্ত সারসংক্ষেপ
            </label>
            <Input
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="নোটিশের ১-২ লাইনের সারসংক্ষেপ..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              বিস্তারিত নোটিশ বিবরণ <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="পূর্ণাঙ্গ বিজ্ঞপ্তি ও নির্দেশনা এখানে লিখুন..."
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#00636b] focus:ring-1 focus:ring-[#00636b]"
            />
          </div>

          {/* Multi Image Upload for Notice attachments */}
          <div className="pt-2 border-t border-slate-100">
            <MultiImageUpload
              label="সংযুক্ত নোটিশপত্র বা অফিসিয়াল সার্কুলার ছবি (একাধিক ছবি আপলোড করতে পারবেন)"
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
              folder="general"
              maxFiles={6}
              description="অফিসিয়াল স্বাক্ষরিত নোটিশের স্ক্যান কপি বা রুটিনের ছবি আপলোড করুন।"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                কারা দেখতে পারবে
              </label>
              <Select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visibility: e.target.value as
                      "all" | "public" | "students" | "teachers",
                  })
                }
                options={[
                  { value: "all", label: "সকলের জন্য (All)" },
                  { value: "public", label: "পাবলিক ওয়েবসাইট" },
                  { value: "students", label: "শুধু শিক্ষার্থী" },
                  { value: "teachers", label: "শুধু শিক্ষকবৃন্দ" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                অগ্রাধিকার
              </label>
              <Select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as "normal" | "important" | "urgent",
                  })
                }
                options={[
                  { value: "normal", label: "সাধারণ" },
                  { value: "important", label: "গুরুত্বপূর্ণ" },
                  { value: "urgent", label: "জরুরি" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="rounded border-slate-300 text-[#00636b] focus:ring-[#00636b]"
              />
              <span>নোটিশটি শীর্ষে পিন (Pin to Top) করে রাখুন</span>
            </label>

            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "draft" | "published" | "archived",
                })
              }
              options={[
                { value: "published", label: "প্রকাশিত" },
                { value: "draft", label: "খসড়া (Draft)" },
              ]}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
