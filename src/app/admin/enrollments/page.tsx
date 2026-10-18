"use client";

import { useEffect, useState, useCallback } from "react";
import {
  GraduationCap,
  Search,
  RefreshCw,
  ArrowRightLeft,
  XCircle,
  BookOpen,
  Calendar,
  AlertCircle,
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
import { toBanglaNumber, formatBanglaDate, formatBanglaCurrency } from "@/lib/utils";

interface EnrollmentItem {
  _id: string;
  student: {
    _id: string;
    studentId: string;
    fullName: string;
    phone: string;
    classLevel: string;
    institutionName: string;
  };
  batch: {
    _id: string;
    name: string;
    code: string;
    classLevel: string;
    monthlyFee: number;
    capacity: number;
  };
  academicSession: {
    _id: string;
    name: string;
    code: string;
  };
  rollNumber?: string;
  feeDiscountPercent: number;
  status: "active" | "completed" | "cancelled" | "transferred";
  enrollmentDate: string;
  notes?: string;
}

export default function EnrollmentManagementPage() {
  const dispatch = useAppDispatch();

  // List States
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("active");

  // Supporting Batches for transfer
  const [activeBatches, setActiveBatches] = useState<
    Array<{ _id: string; name: string; capacity: number }>
  >([]);

  // Transfer Dialog
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [targetEnrollment, setTargetEnrollment] = useState<EnrollmentItem | null>(null);

  const [transferTargetBatchId, setTransferTargetBatchId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // 1. Fetch Enrollments
  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (selectedBatchId) params.set("batch", selectedBatchId);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/enrollments?${params.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "ভর্তি তালিকা লোড করা যায়নি।");
      }

      setEnrollments(json.data || []);
      if (json.meta) {
        setTotalPages(json.meta.totalPages || 1);
        setTotalRecords(json.meta.total || 0);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [page, selectedBatchId, selectedStatus]);

  useEffect(() => {
    fetchEnrollments();

    // Fetch batches for filter and transfer
    fetch("/api/batches?status=active&limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setActiveBatches(json.data || []);
      })
      .catch(() => {});
  }, [fetchEnrollments]);

  // 2. Open Transfer Dialog
  const openTransferDialog = (enr: EnrollmentItem) => {
    setTargetEnrollment(enr);
    setTransferTargetBatchId("");
    setTransferReason("");
    setTransferDialogOpen(true);
  };

  // 3. Submit Batch Transfer
  const handleTransferSubmit = async () => {
    if (!targetEnrollment || !transferTargetBatchId) return;

    setTransferLoading(true);
    try {
      const res = await fetch(`/api/enrollments/${targetEnrollment._id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetBatchId: transferTargetBatchId,
          reason: transferReason.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "স্থানান্তর সম্পন্ন করা যায়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "স্থানান্তর সম্পন্ন",
          message:
            "শিক্ষার্থীর ব্যাচ সফলভাবে পরিবর্তন হয়েছে (পূর্ববর্তী ইতিহাস সংরক্ষিত রয়েছে)।",
        })
      );

      setTransferDialogOpen(false);
      fetchEnrollments();
    } catch (err: unknown) {
      dispatch(
        addNotification({
          type: "error",
          title: "স্থানান্তর ব্যর্থ",
          message: err instanceof Error ? err.message : "সমস্যা হয়েছে।",
        })
      );
    } finally {
      setTransferLoading(false);
    }
  };

  // 4. Cancel / Withdraw Enrollment
  const handleCancelEnrollment = async () => {
    if (!targetEnrollment) return;
    try {
      const res = await fetch(`/api/enrollments/${targetEnrollment._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "প্রত্যাহার করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "ভর্তি প্রত্যাহার সম্পন্ন",
          message: "শিক্ষার্থীর ভর্তি প্রত্যাহার করা হয়েছে।",
        })
      );

      setCancelDialogOpen(false);
      fetchEnrollments();
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
        title="ভর্তি ও ব্যাচ রূপান্তর (Enrollment & Transfers)"
        subtitle="ব্যাচভিত্তিক শিক্ষার্থী ভর্তি তালিকা, ইতিহাস ও ব্যাচ রূপান্তর ট্রানজেকশন"
        breadcrumbs={[
          { label: "ড্যাশবোর্ড", href: "/admin" },
          { label: "ভর্তি ব্যবস্থাপনা" },
        ]}
      />

      {/* Filter Bar */}
      <Card className="shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "সকল ব্যাচ" },
                  ...activeBatches.map((b) => ({ value: b._id, label: b.name })),
                ]}
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
                  { value: "", label: "সকল স্ট্যাটাস" },
                  { value: "active", label: "সক্রিয় ভর্তি (Active)" },
                  { value: "transferred", label: "স্থানান্তরিত (Transferred)" },
                  { value: "cancelled", label: "বাতিলকৃত (Cancelled)" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
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
            <Button
              size="sm"
              variant="outline"
              onClick={fetchEnrollments}
              className="mt-4"
            >
              পুনরায় চেষ্টা করুন
            </Button>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="py-16 text-center">
            <GraduationCap className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              কোনো ভর্তি রেকর্ড পাওয়া যায়নি
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              শিক্ষার্থী তালিকা থেকে ব্যাচে ভর্তি করান।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিক্ষার্থী আইডি ও নাম</TableHead>
                  <TableHead>ব্যাচ ও শিক্ষাবর্ষ</TableHead>
                  <TableHead>রোল নম্বর</TableHead>
                  <TableHead>মাসিক ফি ও ছাড়</TableHead>
                  <TableHead>ভর্তির তারিখ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enr) => (
                  <TableRow key={enr._id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-sm">
                        {enr.student?.fullName || "অজ্ঞাত"}
                      </div>
                      <div className="text-[11px] font-mono text-[#00636b]">
                        আইডি: {enr.student?.studentId} • {enr.student?.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-800 text-xs">
                        {enr.batch?.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        সেশন: {enr.academicSession?.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-700">
                      {enr.rollNumber || "নাই"}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {formatBanglaCurrency(enr.batch?.monthlyFee || 0)}
                      </div>
                      {enr.feeDiscountPercent > 0 && (
                        <div className="text-[10px] text-teal-600 font-bold">
                          ছাড়: {toBanglaNumber(enr.feeDiscountPercent)}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatBanglaDate(enr.enrollmentDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          enr.status === "active"
                            ? "success"
                            : enr.status === "transferred"
                              ? "outline"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {enr.status === "active"
                          ? "চলমান"
                          : enr.status === "transferred"
                            ? "স্থানান্তরিত"
                            : enr.status === "cancelled"
                              ? "বাতিল"
                              : enr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {enr.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => openTransferDialog(enr)}
                            className="text-teal-600 hover:bg-teal-50"
                            title="অন্য ব্যাচে স্থানান্তর করুন"
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            <span>স্থানান্তর</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setTargetEnrollment(enr);
                              setCancelDialogOpen(true);
                            }}
                            className="text-rose-600 hover:bg-rose-50"
                            title="ভর্তি প্রত্যাহার করুন"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
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
              মোট {toBanglaNumber(totalRecords)} টি ভর্তির মধ্যে পৃষ্ঠা{" "}
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

      {/* DIALOG 1: Batch Transfer Modal */}
      <Dialog
        isOpen={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        title="শিক্ষার্থীকে অন্য ব্যাচে স্থানান্তর (Batch Transfer)"
        description="স্থানান্তরের মাধ্যমে পূর্ববর্তী ব্যাচের সমস্ত হাজিরা ও ফলাফল সংরক্ষিত রেখে নতুন ব্যাচে সক্রিয় ভর্তি তৈরি করা হবে।"
      >
        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <p>
              <strong className="text-slate-900">শিক্ষার্থী:</strong>{" "}
              {targetEnrollment?.student?.fullName} (
              {targetEnrollment?.student?.studentId})
            </p>
            <p className="mt-1">
              <strong className="text-slate-900">বর্তমান ব্যাচ:</strong>{" "}
              {targetEnrollment?.batch?.name}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              স্থানান্তরযোগ্য নতুন ব্যাচ <span className="text-rose-500">*</span>
            </label>
            <Select
              value={transferTargetBatchId}
              onChange={(e) => setTransferTargetBatchId(e.target.value)}
              options={[
                { value: "", label: "নতুন ব্যাচ নির্বাচন করুন..." },
                ...activeBatches
                  .filter((b) => b._id !== targetEnrollment?.batch?._id)
                  .map((b) => ({
                    value: b._id,
                    label: `${b.name} (আসন: ${b.capacity})`,
                  })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              স্থানান্তরের কারণ (ঐচ্ছিক)
            </label>
            <Input
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="যেমন: শিক্ষার্থীর ক্লাসের সময়সূচী পরিবর্তন..."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
            বাতিল
          </Button>
          <Button
            onClick={handleTransferSubmit}
            disabled={transferLoading || !transferTargetBatchId}
            className="bg-[#00636b] hover:bg-[#004f55] text-white"
          >
            {transferLoading ? "স্থানান্তর হচ্ছে..." : "স্থানান্তর সম্পন্ন করুন"}
          </Button>
        </div>
      </Dialog>

      {/* DIALOG 2: Cancel/Withdraw Confirmation */}
      <Dialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="ভর্তি প্রত্যাহার নিশ্চিতকরণ"
        description="ভর্তি প্রত্যাহার করা হলেও শিক্ষার্থীর অতীত রেকর্ড অক্ষুণ্ণ থাকবে।"
      >
        <div className="py-2 text-sm text-slate-600">
          আপনি কি নিশ্চিতভাবে{" "}
          <strong className="text-slate-900">
            {targetEnrollment?.student?.fullName}
          </strong>
          -এর ভর্তি বাতিল করতে চান?
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
            ফিরে যান
          </Button>
          <Button variant="danger" onClick={handleCancelEnrollment}>
            হ্যাঁ, প্রত্যাহার করুন
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
