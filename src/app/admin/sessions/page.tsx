"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Plus,
  RefreshCw,
  Edit,
  Archive,
  CheckCircle2,
  Clock,
  Layers,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ActionDropdown } from "@/components/ui/ActionDropdown";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

interface AcademicSessionItem {
  _id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: "upcoming" | "active" | "completed" | "archived";
  description?: string;
}

export default function AcademicSessionManagementPage() {
  const dispatch = useAppDispatch();

  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const [targetSession, setTargetSession] = useState<AcademicSessionItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    status: "active",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/academic-sessions?limit=50", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "শিক্ষাবর্ষের তালিকা পাওয়া যায়নি।");
      }
      setSessions(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openCreateDialog = () => {
    const currentYear = new Date().getFullYear();
    setFormData({
      name: `${toBanglaNumber(currentYear)} শিক্ষাবর্ষ`,
      code: `SESSION-${currentYear}`,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      isCurrent: true,
      status: "active",
      description: "",
    });
    setFormErrors({});
    setCreateDialogOpen(true);
  };

  const openEditDialog = (session: AcademicSessionItem) => {
    setTargetSession(session);
    setFormData({
      name: session.name,
      code: session.code,
      startDate: session.startDate.split("T")[0],
      endDate: session.endDate.split("T")[0],
      isCurrent: session.isCurrent,
      status: session.status,
      description: session.description || "",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleSaveSession = async (isEdit: boolean) => {
    setSubmitting(true);
    setFormErrors({});

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      isCurrent: formData.isCurrent,
      status: formData.status,
      description: formData.description.trim() || undefined,
    };

    try {
      const url = isEdit
        ? `/api/academic-sessions/${targetSession?._id}`
        : "/api/academic-sessions";
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
            ? "শিক্ষাবর্ষের তথ্য সফলভাবে আপডেট হয়েছে।"
            : "নতুন শিক্ষাবর্ষ সফলভাবে তৈরি করা হয়েছে।",
        })
      );

      if (isEdit) setEditDialogOpen(false);
      else setCreateDialogOpen(false);

      fetchSessions();
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

  const handleArchiveSession = async () => {
    if (!targetSession) return;
    try {
      const res = await fetch(`/api/academic-sessions/${targetSession._id}`, {
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
          message: "শিক্ষাবর্ষটি সফলভাবে সমাপ্ত ও আর্কাইভ করা হয়েছে।",
        })
      );

      setArchiveDialogOpen(false);
      fetchSessions();
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

  const getSessionActionItems = (session: AcademicSessionItem) => [
    {
      label: "তথ্য সম্পাদন",
      icon: <Edit className="h-4 w-4" />,
      onClick: () => openEditDialog(session),
      variant: "warning" as const,
    },
    {
      label: "আর্কাইভ করুন",
      icon: <Archive className="h-4 w-4" />,
      onClick: () => {
        setTargetSession(session);
        setArchiveDialogOpen(true);
      },
      variant: "danger" as const,
      hidden: session.status === "archived",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="শিক্ষাবর্ষ ও সেশন ব্যবস্থাপনা (Academic Sessions)"
        subtitle="প্রতিষ্ঠানের বার্ষিক শিক্ষাবর্ষ, চলমান সেশন ও মেয়াদ কনফিগারেশন"
        breadcrumbs={[
          { label: "ড্যাশবোর্ড", href: "/admin" },
          { label: "শিক্ষাবর্ষসমূহ" },
        ]}
        actions={
          <Button
            onClick={openCreateDialog}
            className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন শিক্ষাবর্ষ তৈরি করুন</span>
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
            <Button size="sm" variant="outline" onClick={fetchSessions} className="mt-4">
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">কোনো শিক্ষাবর্ষ নেই</h4>
            <p className="text-xs text-slate-500 mt-1">
              একটি নতুন শিক্ষাবর্ষ তৈরি করে ব্যাচ ও ভর্তি শুরু করুন।
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
                    <TableHead>শিক্ষাবর্ষের নাম</TableHead>
                    <TableHead>শুরুর তারিখ</TableHead>
                    <TableHead>সমাপ্তির তারিখ</TableHead>
                    <TableHead>চলমান স্ট্যাটাস</TableHead>
                    <TableHead>অবস্থা</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session._id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs font-bold text-[#00636b]">
                        {session.code}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 text-sm">
                        {session.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatBanglaDate(session.startDate)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatBanglaDate(session.endDate)}
                      </TableCell>
                      <TableCell>
                        {session.isCurrent ? (
                          <Badge variant="success" className="text-xs">
                            চলতি শিক্ষাবর্ষ (Active)
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.status === "active" ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {session.status === "active"
                            ? "সক্রিয়"
                            : session.status === "archived"
                              ? "আর্কাইভকৃত"
                              : session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionDropdown
                          ariaLabel="সেশন অ্যাকশন"
                          items={getSessionActionItems(session)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {sessions.map((session) => (
                <div key={session._id} className="p-4 bg-white hover:bg-slate-50/60 transition space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#00636b] bg-teal-50 px-2 py-0.5 rounded">
                          {session.code}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="success" className="text-[10px]">
                            চলতি শিক্ষাবর্ষ
                          </Badge>
                        )}
                        <Badge
                          variant={session.status === "active" ? "outline" : "secondary"}
                          className="text-[10px]"
                        >
                          {session.status === "active"
                            ? "সক্রিয়"
                            : session.status === "archived"
                              ? "আর্কাইভকৃত"
                              : session.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{session.name}</h4>
                    </div>
                    <ActionDropdown
                      ariaLabel="সেশন অ্যাকশন"
                      items={getSessionActionItems(session)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">শুরুর তারিখ</span>
                      <span className="text-slate-700 font-medium">{formatBanglaDate(session.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">সমাপ্তির তারিখ</span>
                      <span className="text-slate-700 font-medium">{formatBanglaDate(session.endDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* DIALOG 1: Create / Edit Session */}
      <Dialog
        isOpen={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }}
        title={editDialogOpen ? "শিক্ষাবর্ষ সম্পাদন" : "নতুন শিক্ষাবর্ষ তৈরি"}
        size="md"
      >
        <div className="space-y-3 py-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              শিক্ষাবর্ষের নাম <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="যেমন: ২০২৬ শিক্ষাবর্ষ"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              সেশন কোড <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="SESSION-2026"
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
                সমাপ্তির তারিখ <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrentCheck"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#00636b] focus:ring-[#00636b]"
            />
            <label
              htmlFor="isCurrentCheck"
              className="text-xs font-medium text-slate-800"
            >
              এটি প্রতিষ্ঠানের বর্তমান চলতি সেশন হিসেবে নির্ধারণ করুন
            </label>
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
            onClick={() => handleSaveSession(editDialogOpen)}
            disabled={submitting}
            className="bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            {submitting
              ? "সংরক্ষণ হচ্ছে..."
              : editDialogOpen
                ? "আপডেট করুন"
                : "তৈরি করুন"}
          </Button>
        </div>
      </Dialog>

      {/* DIALOG 2: Archive Confirmation */}
      <Dialog
        isOpen={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        title="শিক্ষাবর্ষ সমাপ্ত ও আর্কাইভ করুন"
        description="শিক্ষাবর্ষটি আর্কাইভ করা হলেও এর পূর্ববর্তী সমস্ত ব্যাচ, ফলাফল ও ইতিহাস অক্ষুণ্ণ থাকবে।"
      >
        <div className="py-2 text-sm text-slate-600">
          আপনি কি নিশ্চিতভাবে{" "}
          <strong className="text-slate-900">{targetSession?.name}</strong> (
          {targetSession?.code})-কে সমাপ্ত ও আর্কাইভ করতে চান?
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
            ফিরে যান
          </Button>
          <Button variant="danger" onClick={handleArchiveSession}>
            হ্যাঁ, আর্কাইভ করুন
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
