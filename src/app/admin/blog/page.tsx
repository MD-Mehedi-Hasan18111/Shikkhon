"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Tag,
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
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface BlogPostItem {
  _id: string;
  title: string;
  summary: string;
  content: string;
  coverImage?: string;
  images?: string[];
  tags: string[];
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  viewCount: number;
}

export default function BlogManagementPage() {
  const dispatch = useAppDispatch();

  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [targetPost, setTargetPost] = useState<BlogPostItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    coverImage: "",
    images: [] as string[],
    tags: "",
    status: "published",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/blog?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "ব্লগ পোস্ট লোড করা যায়নি।");
      }

      setPosts(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalPosts(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const openCreateDialog = () => {
    setFormData({
      title: "",
      summary: "",
      content: "",
      coverImage: "",
      images: [],
      tags: "পড়াশোনা, এইচএসসি প্রস্তুতি, টিপস",
      status: "published",
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (post: BlogPostItem) => {
    setTargetPost(post);
    setFormData({
      title: post.title,
      summary: post.summary,
      content: post.content,
      coverImage: post.coverImage || "",
      images: post.images || [],
      tags: post.tags?.join(", ") || "",
      status: post.status,
    });
    setEditDialogOpen(true);
  };

  const handleSavePost = async (isEdit: boolean) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "ব্লগের শিরোনাম ও বিষয়বস্তু আবশ্যক।",
        })
      );
      return;
    }

    setSubmitting(true);
    const tagsArr = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const url = isEdit ? `/api/blog/${targetPost?._id}` : "/api/blog";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title.trim(),
          summary: formData.summary.trim() || formData.content.slice(0, 150),
          content: formData.content.trim(),
          coverImage: formData.coverImage.trim() || undefined,
          images: formData.images,
          tags: tagsArr,
          status: formData.status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "সংরক্ষণ করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: isEdit ? "ব্লগ পোস্ট আপডেট হয়েছে।" : "নতুন ব্লগ পোস্ট প্রকাশিত হয়েছে।",
        })
      );

      if (isEdit) setEditDialogOpen(false);
      else setCreateDialogOpen(false);

      fetchPosts();
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

  const handleArchivePost = async (id: string) => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
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
          message: "ব্লগ পোস্টটি আর্কাইভ করা হয়েছে।",
        })
      );

      fetchPosts();
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
        title="ব্লগ ও প্রবন্ধ ব্যবস্থাপনা (Blog Posts)"
        subtitle="পাবলিক ওয়েবসাইটের শিক্ষামূলক ব্লগ, পরামর্শমূলক প্রবন্ধ ও টিপস নিয়ন্ত্রণ"
        breadcrumbs={[
          { label: "ড্যাশবোর্ড", href: "/admin" },
          { label: "ব্লগ ও প্রবন্ধ" },
        ]}
        actions={
          <Button
            onClick={openCreateDialog}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন ব্লগ লিখুন</span>
          </Button>
        }
      />

      {/* Filter */}
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
                placeholder="ব্লগের শিরোনাম বা বিষয়বস্তু দিয়ে খুঁজুন..."
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
                  { value: "", label: "সকল পোস্ট" },
                  { value: "published", label: "প্রকাশিত" },
                  { value: "draft", label: "খসড়া (Draft)" },
                  { value: "archived", label: "আর্কাইভকৃত" },
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
            <Button size="sm" variant="outline" onClick={fetchPosts} className="mt-4">
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              কোনো ব্লগ পোস্ট পাওয়া যায়নি
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              শিক্ষার্থীদের জন্য দিকনির্দেশনামূলক প্রবন্ধ লিখুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ব্লগ শিরোনাম</TableHead>
                  <TableHead>ট্যাগসমূহ</TableHead>
                  <TableHead>পাঠ সংখ্যা (Views)</TableHead>
                  <TableHead>প্রকাশের তারিখ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post._id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">
                        {post.title}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                        {post.summary}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.tags?.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[11px] font-normal"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {toBanglaNumber(post.viewCount || 0)} বার
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {post.publishedAt
                        ? formatBanglaDate(post.publishedAt)
                        : "অপ্রকাশিত"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.status === "published" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {post.status === "published"
                          ? "প্রকাশিত"
                          : post.status === "draft"
                            ? "খসড়া"
                            : "আর্কাইভকৃত"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEditDialog(post)}
                        className="text-blue-600 hover:bg-blue-50"
                        title="সম্পাদনা"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {post.status !== "archived" && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleArchivePost(post._id)}
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
              মোট {toBanglaNumber(totalPosts)} টি পোস্টের মধ্যে পৃষ্ঠা{" "}
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

      {/* DIALOG: Create / Edit Blog */}
      <Dialog
        isOpen={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        title={editDialogOpen ? "ব্লগ পোস্ট সম্পাদন" : "নতুন ব্লগ পোস্ট লিখুন"}
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
              onClick={() => handleSavePost(editDialogOpen)}
              disabled={submitting}
              className="bg-[#00636b] hover:bg-[#004f55] text-white"
            >
              {submitting
                ? "সংরক্ষণ হচ্ছে..."
                : editDialogOpen
                  ? "আপডেট করুন"
                  : "প্রকাশ করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              কভার ফটো (Cover Banner)
            </label>
            <ImageUpload
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              aspectRatio="banner"
              folder="banners"
              description="ব্লগ পোস্টের মূল কভার ছবি নির্বাচন করুন (১৬:৯ ব্যানারের জন্য উপযুক্ত)।"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ব্লগের শিরোনাম <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="যেমন: এইচএসসি রসায়নে ভালো নম্বর পাওয়ার সেরা কৌশল"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              সংক্ষিপ্ত সারসংক্ষেপ
            </label>
            <Input
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="সংক্ষিপ্ত বিবরণ (সারসংক্ষেপ)..."
            />
          </div>

          <div>
            <RichTextEditor
              label="ব্লগের মূল বিষয়বস্তু"
              required
              value={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
              placeholder="ব্লগের বিস্তারিত লেখা এখানে লিখুন... লেখার মাঝে ছবি ইনসার্ট করতে পারেন।"
            />
          </div>

          {/* Multi Image Upload for Blog Gallery / Attachments */}
          <div className="pt-2 border-t border-slate-100">
            <MultiImageUpload
              label="ব্লগের অতিরিক্ত ছবিসমূহ (যতখুশি ছবি আপলোড করতে পারবেন)"
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
              folder="general"
              maxFiles={100}
              description="লেখা বা বিষয়বস্তুর প্রাসঙ্গিক ছবি, ডায়াগ্রাম বা হ্যান্ডনোটের ছবি একসাথে নির্বাচন করুন।"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ট্যাগসমূহ (কমা দিয়ে লিখুন)
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="পড়াশোনা, এইচএসসি, টিপস"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                অবস্থা
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
                  { value: "published", label: "সরাসরি প্রকাশ করুন" },
                  { value: "draft", label: "খসড়া হিসেবে রাখুন (Draft)" },
                ]}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
