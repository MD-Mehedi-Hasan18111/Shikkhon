"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Clock,
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
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";

interface EventItem {
  _id: string;
  title: string;
  description: string;
  venue: string;
  startDate: string;
  endDate?: string;
  coverImage?: string;
  images?: string[];
  status: "draft" | "published" | "completed" | "cancelled";
  isFeatured: boolean;
}

export default function EventManagementPage() {
  const dispatch = useAppDispatch();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState<EventItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    venue: "অডিটোরিয়াম, শিক্ষণ একাডেমিক কেয়ার, হালিশহর",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    coverImage: "",
    images: [] as string[],
    isFeatured: false,
    status: "published",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events?page=${page}&limit=10`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "ইভেন্ট তালিকা লোড করা যায়নি।");
      }
      setEvents(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalEvents(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openCreateDialog = () => {
    setFormData({
      title: "",
      description: "",
      venue: "অডিটোরিয়াম, শিক্ষণ একাডেমিক কেয়ার, হালিশহর",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      coverImage: "",
      images: [],
      isFeatured: false,
      status: "published",
    });
    setCreateDialogOpen(true);
  };

  const openEditDialog = (event: EventItem) => {
    setTargetEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      venue: event.venue,
      startDate: event.startDate.split("T")[0],
      endDate: event.endDate ? event.endDate.split("T")[0] : "",
      coverImage: event.coverImage || "",
      images: event.images || [],
      isFeatured: event.isFeatured,
      status: event.status,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEvent = async (isEdit: boolean) => {
    if (!formData.title.trim() || !formData.description.trim()) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "ইভেন্টের নাম ও বিবরণ দিন।",
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/events/${targetEvent?._id}` : "/api/events";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          venue: formData.venue.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          coverImage: formData.coverImage.trim() || undefined,
          images: formData.images,
          isFeatured: formData.isFeatured,
          status: formData.status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "সংরক্ষণ করা যায়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: isEdit ? "ইভেন্ট আপডেট হয়েছে।" : "নতুন ইভেন্ট তৈরি হয়েছে।",
        })
      );

      if (isEdit) setEditDialogOpen(false);
      else setCreateDialogOpen(false);

      fetchEvents();
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

  const handleCancelEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "বাতিল করা যায়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "ইভেন্ট বাতিল সম্পন্ন",
          message: "ইভেন্টটি সফলভাবে বাতিল করা হয়েছে।",
        })
      );

      fetchEvents();
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
        title="ইভেন্ট ও সেমিনার ব্যবস্থাপনা (Events)"
        subtitle="অভিভাবক সমাবেশ, মোটিভেশনাল সেমিনার ও ক্যারিয়ার গাইডেন্স ইভেন্টের সময়সূচী"
        breadcrumbs={[{ label: "ড্যাশবোর্ড", href: "/admin" }, { label: "ইভেন্টসমূহ" }]}
        actions={
          <Button
            onClick={openCreateDialog}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন ইভেন্ট যোগ করুন</span>
          </Button>
        }
      />

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
            <Button size="sm" variant="outline" onClick={fetchEvents} className="mt-4">
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <Sparkles className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              কোনো ইভেন্ট তালিকাভুক্ত নেই
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              অভিভাবক সমাবেশ বা সেমিনার যুক্ত করে প্রচার করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইভেন্টের নাম</TableHead>
                  <TableHead>অনুষ্ঠানস্থল (Venue)</TableHead>
                  <TableHead>তারিখ ও সময়</TableHead>
                  <TableHead>ফিচার্ড</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event._id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">
                        {event.title}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                        {event.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{event.venue}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatBanglaDate(event.startDate)}
                    </TableCell>
                    <TableCell>
                      {event.isFeatured ? (
                        <Badge variant="warning" className="text-xs">
                          ফিচার্ড ইভেন্ট
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "published"
                            ? "success"
                            : event.status === "completed"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {event.status === "published"
                          ? "আসন্ন/প্রকাশিত"
                          : event.status === "completed"
                            ? "সমাপ্ত"
                            : event.status === "cancelled"
                              ? "বাতিল"
                              : "খসড়া"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEditDialog(event)}
                        className="text-blue-600 hover:bg-blue-50"
                        title="সম্পাদনা"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {event.status === "published" && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleCancelEvent(event._id)}
                          className="text-rose-600 hover:bg-rose-50"
                          title="বাতিল করুন"
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
              মোট {toBanglaNumber(totalEvents)} টি ইভেন্টের মধ্যে পৃষ্ঠা{" "}
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

      {/* DIALOG: Create / Edit Event */}
      <Dialog
        isOpen={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        title={editDialogOpen ? "ইভেন্ট তথ্য সম্পাদন" : "নতুন ইভেন্ট যোগ করুন"}
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
              onClick={() => handleSaveEvent(editDialogOpen)}
              disabled={submitting}
              className="bg-[#00636b] hover:bg-[#004f55] text-white"
            >
              {submitting ? "সংরক্ষণ হচ্ছে..." : editDialogOpen ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ইভেন্ট কভার ব্যানার (Cover Image)
            </label>
            <ImageUpload
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              aspectRatio="banner"
              folder="banners"
              description="ইভেন্টের আকর্ষণীয় ব্যানার ছবি আপলোড করুন।"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ইভেন্টের নাম <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="যেমন: এসএসসির বিশেষ প্রস্তুতি ও অভিভাবক সমাবেশ"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              অনুষ্ঠানস্থল (Venue) <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="অডিটোরিয়াম, শিক্ষণ একাডেমিক কেয়ার, হালিশহর"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                শুরুর তারিখ <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                সমাপ্তির তারিখ
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              বিস্তারিত বিবরণ <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="ইভেন্টের উদ্দেশ্য, প্রধান আলোচক ও সময়সূচী..."
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#00636b] focus:ring-1 focus:ring-[#00636b]"
            />
          </div>

          {/* Multi Image Upload for Event Gallery / Moments */}
          <div className="pt-2 border-t border-slate-100">
            <MultiImageUpload
              label="ইভেন্টের ছবি গ্যালারি (একাধিক ছবি আপলোড করতে পারবেন)"
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
              folder="general"
              maxFiles={12}
              description="অনুষ্ঠানের স্মরণীয় মুহূর্ত, পুরস্কার বিতরণী বা মঞ্চের একাধিক ছবি আপলোড করুন।"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
                className="rounded border-slate-300 text-[#00636b] focus:ring-[#00636b]"
              />
              <span>হোমপেজে ফিচার্ড ইভেন্ট হিসেবে প্রদর্শন করুন</span>
            </label>

            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as
                    "draft" | "published" | "completed" | "cancelled",
                })
              }
              options={[
                { value: "published", label: "প্রকাশিত" },
                { value: "draft", label: "খসড়া" },
                { value: "completed", label: "সম্পন্ন" },
              ]}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
