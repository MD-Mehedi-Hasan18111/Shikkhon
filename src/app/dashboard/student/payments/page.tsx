"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Calendar,
  Filter,
  Loader2,
  Sparkles,
  RefreshCw,
  Wallet,
  Receipt,
  FileCheck,
} from "lucide-react";
import { toPng } from "html-to-image";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate, formatBanglaCurrency } from "@/lib/utils";
import {
  SingleReceiptCard,
  ReceiptPaymentData,
  ReceiptSiteSettings,
} from "@/components/receipt/ReceiptCard";

const banglaMonthsMap: Record<number, string> = {
  1: "জানুয়ারি",
  2: "ফেব্রুয়ারি",
  3: "মার্চ",
  4: "এপ্রিল",
  5: "মে",
  6: "জুন",
  7: "জুলাই",
  8: "আগস্ট",
  9: "সেপ্টেম্বর",
  10: "অক্টোবর",
  11: "নভেম্বর",
  12: "ডিসেম্বর",
};

const statusOptions = [
  { value: "", label: "সকল স্ট্যাটাস" },
  { value: "paid", label: "পরিশোধিত (Paid)" },
  { value: "partial", label: "আংশিক পরিশোধ (Partial)" },
  { value: "due", label: "বকেয়া (Due)" },
];

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: "", label: "সকল বছর" },
  { value: String(currentYear + 1), label: `${toBanglaNumber(currentYear + 1)} সাল` },
  { value: String(currentYear), label: `${toBanglaNumber(currentYear)} সাল (বর্তমান)` },
  { value: String(currentYear - 1), label: `${toBanglaNumber(currentYear - 1)} সাল` },
  { value: String(currentYear - 2), label: `${toBanglaNumber(currentYear - 2)} সাল` },
];

const paymentMethodLabels: Record<string, string> = {
  cash: "নগদ (Cash)",
  bkash: "বিকাশ (bKash)",
  nagad: "নগদ (Nagad)",
  rocket: "রকেট (Rocket)",
  bank: "ব্যাংক ডিপোজিট",
  other: "অন্যান্য",
};

interface PaymentSummary {
  totalFee: number;
  totalDiscount: number;
  totalPayable: number;
  totalPaid: number;
  totalDue: number;
  paidCount: number;
  partialCount: number;
  dueCount: number;
}

export default function StudentPaymentsPage() {
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<ReceiptPaymentData[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalFee: 0,
    totalDiscount: 0,
    totalPayable: 0,
    totalPaid: 0,
    totalDue: 0,
    paidCount: 0,
    partialCount: 0,
    dueCount: 0,
  });

  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Site Settings for Receipt Rendering
  const [siteSettings, setSiteSettings] = useState<ReceiptSiteSettings>({
    institutionName: "শিক্ষণ একাডেমিক কেয়ার",
    shortName: "শিক্ষণ",
    motto: "চলো সেরা হই...",
    logoUrl: "/images/logo.png",
    address: "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
    phones: ["০১৬৪৫-২৭০৫৬৭", "০১৮৭২-৭৮০৯৪৫"],
    email: "contact@shikkhon.edu.bd",
  });

  // Modal & Download states
  const [selectedPayment, setSelectedPayment] = useState<ReceiptPaymentData | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Mount effect
  useEffect(() => {
    setIsMounted(true);

    // Fetch site settings for official receipts
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSiteSettings({
            institutionName: json.data.institutionName || "শিক্ষণ একাডেমিক কেয়ার",
            shortName: json.data.shortName || "শিক্ষণ",
            motto: json.data.motto || "চলো সেরা হই...",
            logoUrl: json.data.logoUrl || "/images/logo.png",
            address:
              json.data.address ||
              "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
            phones: json.data.phones || ["০১৬৪৫-২৭০৫৬৭"],
            email: json.data.email || "contact@shikkhon.edu.bd",
          });
        }
      })
      .catch(() => {
        // Fallback to default
      });

    // Fetch enrolled batches
    fetch("/api/batches")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setBatches(json.data.map((b: any) => ({ _id: b._id, name: b.name })));
        }
      })
      .catch(() => {
        // Ignore error
      });
  }, []);

  // Fetch payments list
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (selectedBatch) params.set("batch", selectedBatch);
      if (selectedStatus) params.set("status", selectedStatus);
      if (selectedYear) params.set("year", selectedYear);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setPayments(json.data.payments || []);
        if (json.data.summary) {
          setSummary(json.data.summary);
        }
        if (json.meta) {
          setTotalPages(json.meta.totalPages || 1);
          setTotalRecords(json.meta.total || 0);
        }
      } else {
        dispatch(
          addNotification({
            type: "error",
            title: "পেমেন্ট লোড ত্রুটি",
            message: json.message || "পেমেন্ট হিস্ট্রি লোড করতে ব্যর্থ হয়েছে।",
          })
        );
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "সংযোগ ত্রুটি",
          message: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
        })
      );
    } finally {
      setLoading(false);
    }
  }, [page, selectedBatch, selectedStatus, selectedYear, dispatch]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Open Receipt Modal
  const handleViewReceipt = (payment: ReceiptPaymentData) => {
    setSelectedPayment(payment);
    setReceiptModalOpen(true);
  };

  // Download Student Copy Receipt as PNG
  const handleDownloadReceipt = async (payment: ReceiptPaymentData) => {
    setSelectedPayment(payment);
    setIsDownloading(true);

    try {
      // Delay slightly to ensure capture element is rendered in DOM
      await new Promise((resolve) => setTimeout(resolve, 200));

      const captureEl = document.getElementById("student-receipt-export-capture");
      if (!captureEl) {
        throw new Error("রসিদ প্রস্তুত করা যায়নি।");
      }

      const dataUrl = await toPng(captureEl, {
        quality: 1,
        pixelRatio: 2, // 2x sharp Retina quality
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const receiptNum =
        payment.receiptNumber || `RCP-${payment._id.slice(-6).toUpperCase()}`;
      const studentId = payment.student?.studentId || "student";
      const filename = `Receipt-${receiptNum}-${studentId}-Student-Copy.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dispatch(
        addNotification({
          type: "success",
          title: "ডাউনলোড সফল",
          message: "শিক্ষার্থী কপি মানি রসিদ ইমেজ সফলভাবে ডাউনলোড হয়েছে।",
        })
      );
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ডাউনলোড ব্যর্থ",
          message: err?.message || "রসিদ ডাউনলোড করতে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: "paid" | "partial" | "due", dueAmount: number) => {
    if (status === "paid" || dueAmount <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          পরিশোধিত
        </span>
      );
    }
    if (status === "partial") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="h-3 w-3 text-amber-600" />
          আংশিক পরিশোধ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertCircle className="h-3 w-3 text-rose-600" />
        বকেয়া
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ফি ও পেমেন্ট হিস্ট্রি"
        subtitle="মাসিক টিউশন ফি পরিশোধ বিবরণী, অবশিষ্ট বকেয়া এবং শিক্ষার্থী কপি মানি রসিদ ডাউনলোড"
        breadcrumbs={[
          { label: "ড্যাশবোর্ড", href: "/dashboard/student" },
          { label: "ফি ও পেমেন্ট" },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Paid */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Wallet className="h-6 w-6 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                মোট পরিশোধিত ফি
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {formatBanglaCurrency(summary.totalPaid)}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium block">
                {toBanglaNumber(summary.paidCount)} টি মাস সম্পূর্ণ পরিশোধিত
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Due */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6 text-rose-700" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                বর্তমান বকেয়া ফি
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
                {formatBanglaCurrency(summary.totalDue)}
              </span>
              <span className="text-[11px] text-rose-600 font-medium block">
                {summary.dueCount > 0 || summary.partialCount > 0
                  ? `${toBanglaNumber(summary.dueCount + summary.partialCount)} টি বিল বকেয়া/আংশিক`
                  : "কোন বকেয়া নেই"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Payable Fee */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center shrink-0">
              <CreditCard className="h-6 w-6 text-primary-700" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                মোট ধার্যকৃত ফি
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatBanglaCurrency(summary.totalPayable)}
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                মোট ছাড়: {formatBanglaCurrency(summary.totalDiscount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Invoices Count / Status */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Receipt className="h-6 w-6 text-teal-700" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 font-medium block">
                মোট রসিদ / ইনভয়েস
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {toBanglaNumber(totalRecords)}
              </span>
              <span className="text-[11px] text-teal-700 font-medium block">
                ডিজিটাল মানি রসিদ সংরক্ষিত
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            {/* Batch Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                ব্যাচ অনুযায়ী ফিল্টার
              </label>
              <Select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "সকল ব্যাচ" },
                  ...batches.map((b) => ({ value: b._id, label: b.name })),
                ]}
              />
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                বছর অনুযায়ী ফিল্টার
              </label>
              <Select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
                options={yearOptions}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                পরিশোধ অবস্থা
              </label>
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                options={statusOptions}
              />
            </div>

            {/* Refresh Button */}
            <div>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  fetchPayments();
                }}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin text-primary-600" : ""}`}
                />
                <span>রিফ্রেশ করুন</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary-800" />
            <span>পেমেন্ট ও মাসিক ফি রেকর্ডসমূহ</span>
            <span className="text-xs font-medium text-slate-500">
              ({toBanglaNumber(totalRecords)} টি রেকর্ড)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : payments.length === 0 ? (
          <Card className="border-slate-200 text-center py-12 px-4 shadow-2xs">
            <div className="max-w-md mx-auto space-y-3">
              <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Receipt className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                কোন পেমেন্ট তথ্য পাওয়া যায়নি
              </h3>
              <p className="text-xs text-slate-500">
                নির্বাচিত ব্যাচ বা সময়ের জন্য এখনও কোন ফি রেকর্ড যুক্ত করা হয়নি। যদি ফি পরিশোধ
                করে থাকেন, কোচিং অফিসের সাথে যোগাযোগ করুন।
              </p>
              {(selectedBatch || selectedStatus || selectedYear) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBatch("");
                    setSelectedStatus("");
                    setSelectedYear("");
                    setPage(1);
                  }}
                >
                  ফিল্টার ক্লিয়ার করুন
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-hidden bg-white rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">ফি মাস ও বছর</th>
                    <th className="px-4 py-3.5">ব্যাচের নাম</th>
                    <th className="px-4 py-3.5 text-right">ধার্যকৃত ফি</th>
                    <th className="px-4 py-3.5 text-right">ছাড়</th>
                    <th className="px-4 py-3.5 text-right">পরিশোধিত</th>
                    <th className="px-4 py-3.5 text-right">বকেয়া</th>
                    <th className="px-4 py-3.5 text-center">স্ট্যাটাস</th>
                    <th className="px-4 py-3.5">মাধ্যম ও তারিখ</th>
                    <th className="px-4 py-3.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const monthName =
                      banglaMonthsMap[p.month] || `${toBanglaNumber(p.month)} নং মাস`;
                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50/70 transition duration-150"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block text-xs">
                            {monthName} {toBanglaNumber(p.year)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.receiptNumber || `RCP-${p._id.slice(-6).toUpperCase()}`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                            {p.batch?.name || "সাধারণ ব্যাচ"}
                          </span>
                          {p.batch?.code && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {p.batch.code}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-medium">
                          ৳{toBanglaNumber(p.feeAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600 font-medium">
                          {p.discountAmount > 0
                            ? `-৳${toBanglaNumber(p.discountAmount)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                          ৳{toBanglaNumber(p.paidAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600">
                          {p.dueAmount > 0 ? `৳${toBanglaNumber(p.dueAmount)}` : "০"}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {getStatusBadge(p.status, p.dueAmount)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-xs text-slate-700 font-medium block">
                            {paymentMethodLabels[p.paymentMethod] || p.paymentMethod}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {p.paidAt ? formatBanglaDate(p.paidAt) : formatBanglaDate(p.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-primary-800 border-primary-200 hover:bg-primary-50 gap-1"
                              onClick={() => handleViewReceipt(p)}
                              title="শিক্ষার্থী রসিদ দেখুন"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>রসিদ</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-primary-800 hover:bg-slate-100 rounded-lg"
                              onClick={() => handleDownloadReceipt(p)}
                              title="রসিদ ডাউনলোড (.PNG)"
                              disabled={isDownloading}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Single Cards View (Visible on small screens) */}
            <div className="block md:hidden space-y-3">
              {payments.map((p) => {
                const monthName =
                  banglaMonthsMap[p.month] || `${toBanglaNumber(p.month)} নং মাস`;
                return (
                  <Card
                    key={p._id}
                    className="border-slate-200 shadow-2xs hover:shadow-xs transition overflow-hidden"
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Top Row: Month, Year and Status Badge */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary-700" />
                            <span className="font-extrabold text-slate-900 text-sm">
                              {monthName} {toBanglaNumber(p.year)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            রসিদ নং: {p.receiptNumber || `RCP-${p._id.slice(-6).toUpperCase()}`}
                          </span>
                        </div>
                        <div>{getStatusBadge(p.status, p.dueAmount)}</div>
                      </div>

                      {/* Batch & Fee Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block">ব্যাচের নাম</span>
                          <span className="font-bold text-slate-900 block truncate">
                            {p.batch?.name || "সাধারণ ব্যাচ"}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">ধার্যকৃত ফি</span>
                          <span className="font-semibold text-slate-800 font-mono">
                            ৳{toBanglaNumber(p.feeAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">ছাড়</span>
                          <span className="font-semibold text-emerald-600 font-mono">
                            {p.discountAmount > 0
                              ? `৳${toBanglaNumber(p.discountAmount)}`
                              : "০"}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">পরিশোধিত টাকা</span>
                          <span className="font-black text-emerald-700 font-mono text-sm">
                            ৳{toBanglaNumber(p.paidAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">অবশিষ্ট বকেয়া</span>
                          <span className="font-black text-rose-600 font-mono text-sm">
                            {p.dueAmount > 0 ? `৳${toBanglaNumber(p.dueAmount)}` : "০"}
                          </span>
                        </div>
                      </div>

                      {/* Payment Method & Date */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <div>
                          <span>পদ্ধতি: </span>
                          <strong className="text-slate-800">
                            {paymentMethodLabels[p.paymentMethod] || p.paymentMethod}
                          </strong>
                        </div>
                        <div>
                          <span>তারিখ: </span>
                          <strong className="text-slate-800">
                            {p.paidAt
                              ? formatBanglaDate(p.paidAt)
                              : formatBanglaDate(p.createdAt)}
                          </strong>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs flex items-center justify-center gap-1.5 text-primary-800 border-primary-200 hover:bg-primary-50"
                          onClick={() => handleViewReceipt(p)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>রসিদ দেখুন</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs flex items-center justify-center gap-1.5 bg-[#00636b] hover:bg-[#005157] text-white"
                          onClick={() => handleDownloadReceipt(p)}
                          disabled={isDownloading}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>ডাউনলোড (.PNG)</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-2">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden Offscreen Container for HTML-to-PNG High-Res Capture */}
      {selectedPayment && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: "-9999px",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <div
            id="student-receipt-export-capture"
            className="p-6 bg-white"
            style={{ width: "760px", boxSizing: "border-box" }}
          >
            <SingleReceiptCard
              payment={selectedPayment}
              copyType="student"
              siteSettings={siteSettings}
            />
          </div>
        </div>
      )}

      {/* DIALOG: Student Copy Money Receipt Modal */}
      {selectedPayment && (
        <Dialog
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          title="মানি রসিদ (Money Receipt)"
          size="lg"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReceiptModalOpen(false)}
              >
                বন্ধ করুন
              </Button>
              <div className="flex items-center gap-2">
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={handlePrint}
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>প্রিন্ট করুন</span>
                </Button> */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1.5 bg-[#00636b] hover:bg-[#005157] text-white"
                  onClick={() => handleDownloadReceipt(selectedPayment)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>রসিদ ডাউনলোড (.PNG)</span>
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Modal Screen Preview */}
            <div className="bg-white">
              <SingleReceiptCard
                payment={selectedPayment}
                copyType="student"
                siteSettings={siteSettings}
              />
            </div>

            {/* Direct Body Portal for clean, vertically centered A4 Print */}
            {isMounted &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  id="student-print-receipt-root"
                  className="hidden print:flex"
                >
                  <div id="student-print-receipt-container">
                    <SingleReceiptCard
                      payment={selectedPayment}
                      copyType="student"
                      siteSettings={siteSettings}
                    />
                  </div>
                </div>,
                document.body
              )}

            {/* Global Print Stylesheet for true A4 centered print */}
            <style jsx global>{`
              @media screen {
                #student-print-receipt-root {
                  display: none !important;
                }
              }
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 0;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  box-sizing: border-box !important;
                }
                html,
                body {
                  overflow: hidden !important;
                  height: 100% !important;
                  min-height: 100% !important;
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                }
                body > *:not(#student-print-receipt-root) {
                  display: none !important;
                }
                #student-print-receipt-root {
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  width: 100% !important;
                  min-height: 100vh !important;
                  height: 100vh !important;
                  box-sizing: border-box !important;
                  padding: 15mm 20mm !important;
                  margin: 0 auto !important;
                  background: #ffffff !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                #student-print-receipt-container {
                  width: 100% !important;
                  max-width: 720px !important;
                  margin: auto 0 !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                }
              }
            `}</style>
          </div>
        </Dialog>
      )}
    </div>
  );
}

