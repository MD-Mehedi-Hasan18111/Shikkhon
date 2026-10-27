"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  User,
  BookOpen,
  Phone,
  Calendar,
  Sparkles,
  Zap,
  Scissors,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useAppDispatch } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";
import { AcademicClassLevel } from "@/types/database";

const banglaMonths = [
  { value: "1", label: "জানুয়ারি" },
  { value: "2", label: "ফেব্রুয়ারি" },
  { value: "3", label: "মার্চ" },
  { value: "4", label: "এপ্রিল" },
  { value: "5", label: "মে" },
  { value: "6", label: "জুন" },
  { value: "7", label: "জুলাই" },
  { value: "8", label: "আগস্ট" },
  { value: "9", label: "সেপ্টেম্বর" },
  { value: "10", label: "অক্টোবর" },
  { value: "11", label: "নভেম্বর" },
  { value: "12", label: "ডিসেম্বর" },
];

const classLevelOptions = [
  { value: "", label: "সকল শ্রেণি" },
  { value: "class_6", label: "৬ষ্ঠ শ্রেণি" },
  { value: "class_7", label: "৭ম শ্রেণি" },
  { value: "class_8", label: "৮ম শ্রেণি" },
  { value: "class_9", label: "৯ম শ্রেণি" },
  { value: "class_10", label: "১০ম শ্রেণি (এসএসসি)" },
  { value: "hsc_1st", label: "একাদশ শ্রেণি (এইচএসসি ১ম)" },
  { value: "hsc_2nd", label: "দ্বাদশ শ্রেণি (এইচএসসি ২য়)" },
  { value: "alim_1st", label: "আলিম ১ম বর্ষ" },
  { value: "alim_2nd", label: "আলিম ২য় বর্ষ" },
  { value: "admission", label: "বিশ্ববিদ্যালয় ও মেডিকেল ভর্তি" },
];

const statusOptions = [
  { value: "", label: "সকল স্ট্যাটাস" },
  { value: "paid", label: "পরিশোধিত (Paid)" },
  { value: "partial", label: "আংশিক পরিশোধ (Partial)" },
  { value: "due", label: "বকেয়া (Due)" },
];

const paymentMethodOptions = [
  { value: "cash", label: "নগদ (Cash)" },
  { value: "bkash", label: "বিকাশ (bKash)" },
  { value: "nagad", label: "নগদ (Nagad)" },
  { value: "rocket", label: "রকেট (Rocket)" },
  { value: "bank", label: "ব্যাংক ডিপোজিট" },
  { value: "other", label: "অন্যান্য" },
];

interface PaymentItem {
  _id: string;
  student: {
    _id: string;
    fullName: string;
    studentId: string;
    phone: string;
    guardianPhone?: string;
    classLevel: string;
    institutionName?: string;
  };
  batch: {
    _id: string;
    name: string;
    code: string;
    monthlyFee: number;
    classLevel: string;
  };
  month: number;
  year: number;
  feeAmount: number;
  discountAmount: number;
  payableAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: "paid" | "partial" | "due";
  paymentMethod: string;
  transactionId?: string;
  receiptNumber?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

interface SummaryData {
  totalFee: number;
  totalDiscount: number;
  totalPayable: number;
  totalPaid: number;
  totalDue: number;
  paidCount: number;
  partialCount: number;
  dueCount: number;
}

interface SiteSettingsInfo {
  institutionName: string;
  shortName: string;
  motto: string;
  logoUrl: string;
  address: string;
  phones: string[];
  email: string;
}

export default function AdminPaymentsPage() {
  const dispatch = useAppDispatch();
  const printRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonthNum));
  const [selectedYear, setSelectedYear] = useState(String(currentYearNum));
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);

  // Data States
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalFee: 0,
    totalDiscount: 0,
    totalPayable: 0,
    totalPaid: 0,
    totalDue: 0,
    paidCount: 0,
    partialCount: 0,
    dueCount: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  // Site Settings for Receipts
  const [siteSettings, setSiteSettings] = useState<SiteSettingsInfo>({
    institutionName: "শিক্ষণ একাডেমিক কেয়ার",
    shortName: "শিক্ষণ",
    motto: "চলো সেরা হই...",
    logoUrl: "/images/logo.png",
    address: "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
    phones: ["০১৯৮-২৭০৫৬৪৬", "০১৮৫৯-৭৮৭৩৯৯"],
    email: "info@shikkhon.edu.bd",
  });

  // Batches for filter & modal dropdown
  const [batchesList, setBatchesList] = useState<Array<{ _id: string; name: string; code: string; monthlyFee: number; classLevel: string }>>([]);

  // Modal 1: Payment Entry / Edit Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(null);
  const [modalBatchId, setModalBatchId] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingEnrolledStudents, setLoadingEnrolledStudents] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    batchId: "",
    month: currentMonthNum,
    year: currentYearNum,
    feeAmount: 1500,
    discountAmount: 0,
    paidAmount: 1500,
    paymentMethod: "cash",
    transactionId: "",
    receiptNumber: "",
    paidAt: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal 2: Generate Batch Dues Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateBatchId, setGenerateBatchId] = useState("");
  const [generateMonth, setGenerateMonth] = useState(String(currentMonthNum));
  const [generateYear, setGenerateYear] = useState(String(currentYearNum));
  const [generating, setGenerating] = useState(false);

  // Modal 3: Receipt View / Print Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<PaymentItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch batches & site settings
  useEffect(() => {
    setIsMounted(true);
    fetch("/api/batches?status=active&limit=100")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setBatchesList(json.data);
        }
      })
      .catch(() => {});

    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSiteSettings({
            institutionName: json.data.institutionName || "শিক্ষণ একাডেমিক কেয়ার",
            shortName: json.data.shortName || "শিক্ষণ",
            motto: json.data.motto || "চলো সেরা হই...",
            logoUrl: json.data.logoUrl || "/images/logo.png",
            address: json.data.address || "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম",
            phones: json.data.phones?.length ? json.data.phones : ["০১৯৮-২৭০৫৬৪৬", "০১৮৫৯-৭৮৭৩৯৯"],
            email: json.data.email || "info@shikkhon.edu.bd",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (selectedBatch) params.set("batch", selectedBatch);
      if (selectedClass) params.set("classLevel", selectedClass);
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedYear) params.set("year", selectedYear);
      if (selectedStatus) params.set("status", selectedStatus);

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
      }
    } catch {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: "পেমেন্ট ডাটা লোড করা সম্ভব হয়নি।",
        })
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedBatch, selectedClass, selectedMonth, selectedYear, selectedStatus, dispatch]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Load enrolled students when modal batch changes
  const handleModalBatchChange = async (batchId: string) => {
    setModalBatchId(batchId);
    setPaymentForm((prev) => ({ ...prev, batchId, studentId: "" }));
    if (!batchId) {
      setEnrolledStudents([]);
      return;
    }

    setLoadingEnrolledStudents(true);
    try {
      const selectedB = batchesList.find((b) => b._id === batchId);
      if (selectedB) {
        setPaymentForm((prev) => ({
          ...prev,
          feeAmount: selectedB.monthlyFee || 1500,
          paidAmount: selectedB.monthlyFee || 1500,
        }));
      }

      const res = await fetch(`/api/enrollments?batch=${batchId}&status=active&limit=100`);
      const json = await res.json();
      if (json.success && json.data) {
        setEnrolledStudents(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingEnrolledStudents(false);
    }
  };

  // Open Create Payment Modal
  const openCreateModal = () => {
    setEditingPayment(null);
    const defaultBatch = batchesList[0]?._id || "";
    setPaymentForm({
      studentId: "",
      batchId: defaultBatch,
      month: currentMonthNum,
      year: currentYearNum,
      feeAmount: batchesList[0]?.monthlyFee || 1500,
      discountAmount: 0,
      paidAmount: batchesList[0]?.monthlyFee || 1500,
      paymentMethod: "cash",
      transactionId: "",
      receiptNumber: "",
      paidAt: new Date().toISOString().split("T")[0],
      notes: "",
    });
    if (defaultBatch) {
      handleModalBatchChange(defaultBatch);
    }
    setPaymentModalOpen(true);
  };

  // Open Edit / Pay Due Modal
  const openEditModal = (p: PaymentItem) => {
    setEditingPayment(p);
    setModalBatchId(p.batch._id);
    setPaymentForm({
      studentId: p.student._id,
      batchId: p.batch._id,
      month: p.month,
      year: p.year,
      feeAmount: p.feeAmount,
      discountAmount: p.discountAmount,
      paidAmount: p.paidAmount,
      paymentMethod: p.paymentMethod || "cash",
      transactionId: p.transactionId || "",
      receiptNumber: p.receiptNumber || "",
      paidAt: p.paidAt ? new Date(p.paidAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      notes: p.notes || "",
    });
    setPaymentModalOpen(true);
  };

  // Save Payment
  const handleSavePayment = async () => {
    if (!paymentForm.studentId) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "শিক্ষার্থী নির্বাচন করুন।",
        })
      );
      return;
    }
    if (!paymentForm.batchId) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "ব্যাচ নির্বাচন করুন।",
        })
      );
      return;
    }

    setFormSubmitting(true);
    try {
      const url = editingPayment ? `/api/payments/${editingPayment._id}` : "/api/payments";
      const method = editingPayment ? "PATCH" : "POST";

      const payload = {
        student: paymentForm.studentId,
        batch: paymentForm.batchId,
        month: Number(paymentForm.month),
        year: Number(paymentForm.year),
        feeAmount: Number(paymentForm.feeAmount),
        discountAmount: Number(paymentForm.discountAmount),
        paidAmount: Number(paymentForm.paidAmount),
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId.trim() || undefined,
        receiptNumber: paymentForm.receiptNumber.trim() || undefined,
        paidAt: paymentForm.paidAt ? new Date(paymentForm.paidAt).toISOString() : undefined,
        notes: paymentForm.notes.trim() || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "পেমেন্ট সংরক্ষণ ব্যর্থ হয়েছে।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: editingPayment ? "পেমেন্ট তথ্য আপডেট করা হয়েছে।" : "পেমেন্ট এন্ট্রি সফল হয়েছে।",
        })
      );

      setPaymentModalOpen(false);
      fetchPayments();
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "সংরক্ষণ করতে সমস্যা হয়েছে।",
        })
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Payment
  const handleDeletePayment = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই পেমেন্ট রেকর্ডটি মুছে ফেলতে চান?")) return;

    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "মুছে ফেলা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "মুছে ফেলা হয়েছে",
          message: "পেমেন্ট রেকর্ড মুছে ফেলা হয়েছে।",
        })
      );
      fetchPayments();
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "পেমেন্ট মোছা যায়নি।",
        })
      );
    }
  };

  // Generate Batch Dues
  const handleGenerateBatchDues = async () => {
    if (!generateBatchId) {
      dispatch(
        addNotification({
          type: "warning",
          title: "সতর্কতা",
          message: "ব্যাচ নির্বাচন করুন।",
        })
      );
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/payments/generate-batch-dues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: generateBatchId,
          month: Number(generateMonth),
          year: Number(generateYear),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "ডিউ তৈরি করা সম্ভব হয়নি।");
      }

      dispatch(
        addNotification({
          type: "success",
          title: "সফল",
          message: json.message || "ব্যাচ ডিউ সফলভাবে তৈরি করা হয়েছে।",
        })
      );
      setGenerateModalOpen(false);
      fetchPayments();
    } catch (err: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "ত্রুটি",
          message: err.message || "ডিউ তৈরিতে ব্যর্থ হয়েছে।",
        })
      );
    } finally {
      setGenerating(false);
    }
  };

  // Print Receipt Action - Direct native print
  const handlePrint = () => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "visible";
    window.print();
    setTimeout(() => {
      document.body.style.overflow = prevOverflow;
    }, 500);
  };

  const calculatedPayable = Math.max(0, paymentForm.feeAmount - paymentForm.discountAmount);
  const calculatedDue = Math.max(0, calculatedPayable - paymentForm.paidAmount);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="শিক্ষার্থী মাসিক ফি ও পেমেন্ট ব্যবস্থাপনা"
        subtitle="ব্যাচ ও শ্রেণি ভিত্তিক মাসিক টিউশন ফি আদায়, বকেয়া হিসাব এবং আর্থিক রিপোর্ট"
        breadcrumbs={[
          { label: "হোম", href: "/" },
          { label: "ড্যাশবোর্ড", href: "/admin" },
          { label: "ফি ও কালেকশন" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGenerateModalOpen(true)}
              className="border-teal-300 text-[#00636b] hover:bg-teal-50 gap-1.5"
            >
              <Zap className="h-4 w-4" />
              <span>ব্যাচ ডিউ জেনারেট</span>
            </Button>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-[#00636b] hover:bg-[#004e54] text-white gap-1.5 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>নতুন পেমেন্ট এন্ট্রি</span>
            </Button>
          </div>
        }
      />

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Collected */}
        <Card className="border-l-4 border-l-[#00636b] shadow-xs bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  ফিল্টার মোট আদায়
                </p>
                <h3 className="text-2xl font-bold text-teal-900 mt-1">
                  ৳{toBanglaNumber(summary.totalPaid.toLocaleString("bn-BD"))}
                </h3>
                <p className="text-[11px] text-teal-700 font-medium mt-1">
                  পরিশোধিত: {toBanglaNumber(summary.paidCount)} জন
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-teal-50 flex items-center justify-center text-[#00636b]">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Due */}
        <Card className="border-l-4 border-l-rose-500 shadow-xs bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  ফিল্টার মোট বকেয়া
                </p>
                <h3 className="text-2xl font-bold text-rose-600 mt-1">
                  ৳{toBanglaNumber(summary.totalDue.toLocaleString("bn-BD"))}
                </h3>
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  বকেয়া শিক্ষার্থী: {toBanglaNumber(summary.dueCount + summary.partialCount)} জন
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Demand / Payable */}
        <Card className="border-l-4 border-l-blue-500 shadow-xs bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  মোট ধার্যকৃত ফি
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  ৳{toBanglaNumber(summary.totalPayable.toLocaleString("bn-BD"))}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  ছাড়: ৳{toBanglaNumber(summary.totalDiscount.toLocaleString("bn-BD"))}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Records Count */}
        <Card className="border-l-4 border-l-amber-500 shadow-xs bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  কালেকশন হার
                </p>
                <h3 className="text-2xl font-bold text-amber-800 mt-1">
                  {toBanglaNumber(
                    summary.totalPayable > 0
                      ? Math.round((summary.totalPaid / summary.totalPayable) * 100)
                      : 0
                  )}
                  %
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  মোট শিক্ষার্থী এন্ট্রি: {toBanglaNumber(totalRecords)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card className="shadow-xs bg-white border border-slate-200">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="শিক্ষার্থীর নাম, রোল বা মোবাইল..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#00636b] focus:ring-1 focus:ring-[#00636b]"
              />
            </div>

            {/* Batch Dropdown */}
            <div>
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                <option value="">সকল ব্যাচ</option>
                {batchesList.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Class Dropdown */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                {classLevelOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown */}
            <div>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                <option value="">সকল মাস</option>
                {banglaMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                <option value="">সকল বছর</option>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={String(y)}>
                    {toBanglaNumber(y)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                <span>স্ট্যাটাস:</span>
              </span>
              {[
                { label: "সকল", value: "" },
                { label: "পরিশোধিত", value: "paid" },
                { label: "আংশিক", value: "partial" },
                { label: "বকেয়া", value: "due" },
              ].map((pill) => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(pill.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-full transition font-medium ${
                    selectedStatus === pill.value
                      ? "bg-[#00636b] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Reset Filter Button */}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSearch("");
                setSelectedBatch("");
                setSelectedClass("");
                setSelectedMonth(String(currentMonthNum));
                setSelectedYear(String(currentYearNum));
                setSelectedStatus("");
                setPage(1);
              }}
              className="text-slate-500 hover:text-slate-800 text-xs"
            >
              ফিল্টার রিসেট
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-xs bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">শিক্ষার্থী</th>
                <th className="px-4 py-3">ব্যাচ ও শ্রেণি</th>
                <th className="px-4 py-3">মাস ও বছর</th>
                <th className="px-4 py-3 text-right">ধার্যকৃত ফি</th>
                <th className="px-4 py-3 text-right">পরিশোধিত</th>
                <th className="px-4 py-3 text-right">বকেয়া</th>
                <th className="px-4 py-3 text-center">স্ট্যাটাস</th>
                <th className="px-4 py-3">পদ্ধতি ও রসিদ</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <Skeleton className="h-8 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CreditCard className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    <p className="text-sm font-semibold">কোনো পেমেন্ট তথ্য পাওয়া যায়নি</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ফিল্টার পরিবর্তন করুন অথবা &apos;নতুন পেমেন্ট এন্ট্রি&apos; বাটনে ক্লিক করে যুক্ত করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const monthName =
                    banglaMonths.find((m) => m.value === String(p.month))?.label ||
                    String(p.month);

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      {/* Student Info */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">
                          {p.student?.fullName || "নামহীন শিক্ষার্থী"}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded">
                            {p.student?.studentId || "ID-N/A"}
                          </span>
                          {p.student?.phone && (
                            <a
                              href={`tel:${p.student.phone}`}
                              className="text-[#00636b] hover:underline flex items-center gap-0.5"
                            >
                              <Phone className="h-2.5 w-2.5" />
                              <span>{p.student.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Batch & Class */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {p.batch?.name || "ব্যাচ তথ্য নেই"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.batch?.code && (
                            <span className="font-mono uppercase font-bold text-teal-800 mr-1.5">
                              {p.batch.code}
                            </span>
                          )}
                          <span>
                            {classLevelOptions.find((c) => c.value === p.student?.classLevel)?.label ||
                              p.student?.classLevel}
                          </span>
                        </div>
                      </td>

                      {/* Month & Year */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{monthName}</span>
                        <span className="text-slate-400 font-mono ml-1">
                          {toBanglaNumber(p.year)}
                        </span>
                      </td>

                      {/* Payable Fee */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          ৳{toBanglaNumber(p.payableAmount.toLocaleString("bn-BD"))}
                        </div>
                        {p.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            ছাড়: ৳{toBanglaNumber(p.discountAmount)}
                          </div>
                        )}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-bold text-teal-700">
                          ৳{toBanglaNumber(p.paidAmount.toLocaleString("bn-BD"))}
                        </div>
                      </td>

                      {/* Due Amount */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className={`font-bold ${
                            p.dueAmount > 0 ? "text-rose-600" : "text-slate-400 font-normal"
                          }`}
                        >
                          {p.dueAmount > 0
                            ? `৳${toBanglaNumber(p.dueAmount.toLocaleString("bn-BD"))}`
                            : "পরিশোধিত"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {p.status === "paid" ? (
                          <Badge variant="success" className="text-[10px] py-0.5">
                            পরিশোধিত
                          </Badge>
                        ) : p.status === "partial" ? (
                          <Badge variant="warning" className="text-[10px] py-0.5">
                            আংশিক
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px] py-0.5">
                            বকেয়া
                          </Badge>
                        )}
                      </td>

                      {/* Method & Receipt */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[11px] font-semibold text-slate-700 uppercase">
                          {paymentMethodOptions.find((m) => m.value === p.paymentMethod)?.label ||
                            p.paymentMethod}
                        </div>
                        {p.receiptNumber && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {p.receiptNumber}
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Receipt Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceiptPayment(p);
                              setReceiptModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#00636b] hover:bg-teal-50 rounded transition"
                            title="রসিদ দেখুন / প্রিন্ট করুন"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Edit / Pay Due Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                            title="পেমেন্ট আপডেট করুন"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>

      {/* DIALOG 1: Payment Entry / Edit Modal */}
      <Dialog
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={editingPayment ? "পেমেন্ট তথ্য সম্পাদন / বকেয়া পরিশোধ" : "নতুন মাসিক পেমেন্ট এন্ট্রি"}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              onClick={handleSavePayment}
              disabled={formSubmitting}
              className="bg-[#00636b] hover:bg-[#004e54] text-white"
            >
              {formSubmitting
                ? "সংরক্ষণ হচ্ছে..."
                : editingPayment
                ? "পেমেন্ট আপডেট করুন"
                : "পেমেন্ট সংরক্ষণ করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Batch & Student Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ব্যাচ নির্বাচন <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={Boolean(editingPayment)}
                value={paymentForm.batchId}
                onChange={(e) => handleModalBatchChange(e.target.value)}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b] disabled:bg-slate-100"
              >
                <option value="">ব্যাচ বেছে নিন...</option>
                {batchesList.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code}) - ৳{b.monthlyFee}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                শিক্ষার্থী <span className="text-rose-500">*</span>
              </label>
              {editingPayment ? (
                <div className="h-9 px-3 flex items-center bg-slate-100 rounded-lg font-bold text-slate-800">
                  {editingPayment.student?.fullName} ({editingPayment.student?.studentId})
                </div>
              ) : (
                <select
                  disabled={loadingEnrolledStudents || !paymentForm.batchId}
                  value={paymentForm.studentId}
                  onChange={(e) => {
                    const stId = e.target.value;
                    const enrollment = enrolledStudents.find(
                      (en) => (en.student?._id || en.student) === stId
                    );
                    const discountPercent = enrollment?.feeDiscountPercent || 0;
                    const fee = paymentForm.feeAmount || 1500;
                    const disc = Math.round((fee * discountPercent) / 100);
                    setPaymentForm((prev) => ({
                      ...prev,
                      studentId: stId,
                      discountAmount: disc,
                      paidAmount: Math.max(0, fee - disc),
                    }));
                  }}
                  className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b] disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingEnrolledStudents ? "শিক্ষার্থী লোড হচ্ছে..." : "শিক্ষার্থী নির্বাচন করুন..."}
                  </option>
                  {enrolledStudents.map((en) => {
                    const st = en.student;
                    if (!st) return null;
                    return (
                      <option key={st._id} value={st._id}>
                        {st.fullName} ({st.studentId}) - {st.phone}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Month & Year Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ফি এর মাস <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentForm.month}
                onChange={(e) => setPaymentForm({ ...paymentForm, month: Number(e.target.value) })}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                {banglaMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                বছর <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentForm.year}
                onChange={(e) => setPaymentForm({ ...paymentForm, year: Number(e.target.value) })}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {toBanglaNumber(y)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fee & Calculation Grid */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  মাসিক ফি (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  value={paymentForm.feeAmount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, feeAmount: Number(e.target.value) })
                  }
                  className="w-full h-8 px-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ছাড় / ডিসকাউন্ট (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  value={paymentForm.discountAmount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, discountAmount: Number(e.target.value) })
                  }
                  className="w-full h-8 px-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  পরিশোধযোগ্য মোট
                </label>
                <div className="h-8 px-2 flex items-center font-bold text-slate-900 bg-slate-200/70 rounded-lg">
                  ৳{toBanglaNumber(calculatedPayable)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-teal-800 mb-1">
                  পরিশোধিত টাকা (Paid Amount) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={calculatedPayable}
                  value={paymentForm.paidAmount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paidAmount: Number(e.target.value) })
                  }
                  className="w-full h-9 px-2 text-sm font-bold text-teal-900 border border-teal-400 rounded-lg bg-teal-50/50 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                  বকেয়ার পরিমাণ (Due Amount)
                </label>
                <div
                  className={`h-9 px-3 flex items-center font-bold text-sm rounded-lg ${
                    calculatedDue > 0
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {calculatedDue > 0 ? `৳${toBanglaNumber(calculatedDue)} (বকেয়া)` : "পরিশোধিত (কোনো বকেয়া নেই)"}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method, Date, Receipt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                {paymentMethodOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">পরিশোধের তারিখ</label>
              <input
                type="date"
                value={paymentForm.paidAt}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ট্রানজ্যাকশন আইডি</label>
              <input
                type="text"
                placeholder="বিকাশ / নগদ TrxID"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">মন্তব্য (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="পেমেন্ট সম্পর্কিত কোনো তথ্য থাকলে লিখুন..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
            />
          </div>
        </div>
      </Dialog>

      {/* DIALOG 2: Batch Dues Generator Modal */}
      <Dialog
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="ব্যাচ মাসিক ডিউ / ফি জেনারেট করুন"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setGenerateModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button
              onClick={handleGenerateBatchDues}
              disabled={generating || !generateBatchId}
              className="bg-[#00636b] hover:bg-[#004e54] text-white gap-1.5"
            >
              {generating ? "ডিউ তৈরি হচ্ছে..." : "ডিউ জেনারেট করুন"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            নির্বাচিত ব্যাচের সকল সক্রিয় শিক্ষার্থীর জন্য নির্দিষ্ট মাসের ফি রেকর্ড তৈরি হবে।
            যাদের আগে তৈরি করা হয়েছে তাদের পরিবর্তন হবে না।
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ব্যাচ নির্বাচন করুন <span className="text-rose-500">*</span>
            </label>
            <select
              value={generateBatchId}
              onChange={(e) => setGenerateBatchId(e.target.value)}
              className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
            >
              <option value="">ব্যাচ নির্বাচন করুন...</option>
              {batchesList.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.code}) - মাসিক ফি: ৳{b.monthlyFee}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">মাস</label>
              <select
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                {banglaMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">বছর</label>
              <select
                value={generateYear}
                onChange={(e) => setGenerateYear(e.target.value)}
                className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={String(y)}>
                    {toBanglaNumber(y)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Dialog>

      {/* DIALOG 3: Printable Dual Money Receipt Modal */}
      {selectedReceiptPayment && (
        <Dialog
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          title="মানি রসিদ (Money Receipt - ২ কপি এক পৃষ্ঠায় প্রিন্ট)"
          size="xl"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setReceiptModalOpen(false)}
              >
                বন্ধ করুন
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-[#00636b] hover:bg-[#004e54] text-white gap-1.5 shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>প্রিন্ট করুন (Print Receipts)</span>
              </Button>
            </>
          }
        >
          {(() => {
            if (!selectedReceiptPayment) return null;
            const isPaid = (selectedReceiptPayment.dueAmount || 0) <= 0;

            const renderReceiptCopy = (copyType: "office" | "student") => {
              const isOffice = copyType === "office";
              return (
                <div
                  key={copyType}
                  className={`receipt-copy-card relative overflow-hidden border rounded-xl bg-white p-3.5 sm:p-4 text-xs transition ${
                    isOffice
                      ? "border-slate-300 shadow-2xs"
                      : "border-teal-200/80 shadow-2xs"
                  }`}
                >
                  {/* Official Watermark Seal Stamp */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                    <div
                      className={`transform -rotate-12 border-3 sm:border-4 rounded-2xl p-1 shadow-xs transition-opacity ${
                        isPaid
                          ? "border-emerald-600/35 bg-emerald-500/5 text-emerald-700"
                          : "border-rose-600/35 bg-rose-500/5 text-rose-700"
                      }`}
                    >
                      <div
                        className={`border-2 rounded-xl px-6 py-2 flex flex-col items-center justify-center ${
                          isPaid ? "border-emerald-600/30" : "border-rose-600/30"
                        }`}
                      >
                        <div className="text-[10px] font-black tracking-widest uppercase opacity-80">
                          {isPaid ? "★ সম্পূর্ণ পরিশোধিত ★" : "★ ফি বকেয়া রয়েছে ★"}
                        </div>
                        <div className="text-4xl font-black tracking-widest font-mono my-0.5 leading-none opacity-90">
                          {isPaid ? "PAID" : "DUE"}
                        </div>
                        <div className="text-[9px] font-bold tracking-wider uppercase opacity-80">
                          {isPaid
                            ? `${siteSettings.shortName || "SHIKKHON"} • OFFICIAL SEAL`
                            : `অবশিষ্ট বকেয়া: ৳${toBanglaNumber(selectedReceiptPayment.dueAmount)}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Relative Content Layer */}
                  <div className="relative z-10 space-y-2">
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-1 shadow-2xs">
                          <img
                            src={siteSettings.logoUrl || "/images/logo.png"}
                            alt={siteSettings.institutionName}
                            className="max-h-full max-w-full object-contain"
                            loading="eager"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/images/logo.png";
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                            {siteSettings.institutionName}
                          </h3>
                          {siteSettings.motto && (
                            <p className="text-[10px] font-semibold text-[#00636b] leading-tight mt-0.5">
                              {siteSettings.motto}
                            </p>
                          )}
                          <p className="text-[9.5px] text-slate-500 leading-tight mt-0.5">
                            {siteSettings.address}
                            {siteSettings.phones?.length ? ` | হেল্পলাইন: ${siteSettings.phones.join(", ")}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                            isOffice
                              ? "bg-slate-800 text-white"
                              : "bg-[#00636b] text-white"
                          }`}
                        >
                          {isOffice ? "কোচিং / অফিস কপি" : "শিক্ষার্থী কপি"}
                        </span>
                        <p className="text-[11px] font-bold text-slate-700 mt-1">
                          মানি রসিদ (Money Receipt)
                        </p>
                      </div>
                    </div>

                    {/* Receipt Meta Bar */}
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
                      <span>
                        <span className="text-slate-500 font-normal">রসিদ নং:</span>{" "}
                        <strong className="font-mono text-slate-900">
                          {selectedReceiptPayment.receiptNumber ||
                            `RCP-${selectedReceiptPayment._id.slice(-6).toUpperCase()}`}
                        </strong>
                      </span>
                      <span>
                        <span className="text-slate-500 font-normal">তারিখ:</span>{" "}
                        <strong className="text-slate-900">
                          {formatBanglaDate(selectedReceiptPayment.paidAt || selectedReceiptPayment.createdAt)}
                        </strong>
                      </span>
                    </div>

                    {/* Student & Batch Information */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] block">শিক্ষার্থীর নাম</span>
                        <strong className="text-slate-900 text-xs block truncate">
                          {selectedReceiptPayment.student?.fullName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">রোল / আইডি</span>
                        <strong className="font-mono text-slate-900 text-xs block">
                          {selectedReceiptPayment.student?.studentId}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">মোবাইল</span>
                        <strong className="text-slate-900 text-xs block">
                          {selectedReceiptPayment.student?.phone}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">ব্যাচ ও শ্রেণি</span>
                        <strong className="text-slate-900 text-xs block truncate">
                          {selectedReceiptPayment.batch?.name}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">ফি মাস ও বছর</span>
                        <strong className="text-slate-900 text-xs block">
                          {banglaMonths.find((m) => m.value === String(selectedReceiptPayment.month))?.label}{" "}
                          {toBanglaNumber(selectedReceiptPayment.year)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">পদ্ধতি ও TrxID</span>
                        <strong className="text-slate-900 text-xs block truncate uppercase">
                          {paymentMethodOptions.find((m) => m.value === selectedReceiptPayment.paymentMethod)?.label || selectedReceiptPayment.paymentMethod}
                          {selectedReceiptPayment.transactionId ? ` (${selectedReceiptPayment.transactionId})` : ""}
                        </strong>
                      </div>
                    </div>

                    {/* Financial Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <div className="grid grid-cols-4 bg-slate-100/90 text-[10px] font-bold text-slate-600 px-3 py-1 uppercase tracking-wide border-b border-slate-200">
                        <div className="col-span-2">বিবরণ (Description)</div>
                        <div className="text-right">ছাড় (Discount)</div>
                        <div className="text-right">মোট টাকা (Amount)</div>
                      </div>
                      <div className="divide-y divide-slate-100">
                        <div className="grid grid-cols-4 px-3 py-1.5 text-slate-700">
                          <div className="col-span-2 font-medium">
                            মাসিক টিউশন ফি ({banglaMonths.find((m) => m.value === String(selectedReceiptPayment.month))?.label} {toBanglaNumber(selectedReceiptPayment.year)})
                          </div>
                          <div className="text-right text-emerald-600 font-semibold">
                            {selectedReceiptPayment.discountAmount > 0
                              ? `- ৳${toBanglaNumber(selectedReceiptPayment.discountAmount)}`
                              : "—"}
                          </div>
                          <div className="text-right font-semibold">
                            ৳{toBanglaNumber(selectedReceiptPayment.feeAmount)}
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50/90 px-3 py-1.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[11px]">
                            ধার্যকৃত মোট: <strong>৳{toBanglaNumber(selectedReceiptPayment.payableAmount)}</strong>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isPaid
                              ? "সম্পূর্ণ পরিশোধিত (PAID)"
                              : `বকেয়া: ৳${toBanglaNumber(selectedReceiptPayment.dueAmount)}`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-600 mr-2 text-[11px]">পরিশোধিত টাকা:</span>
                          <strong className="text-sm font-extrabold text-[#00636b]">
                            ৳{toBanglaNumber(selectedReceiptPayment.paidAmount)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-5 pb-0.5 flex justify-between items-end text-[10px] text-slate-500">
                      <div className="text-center">
                        <div className="border-t border-slate-300 pt-1 w-28 sm:w-32">
                          শিক্ষার্থী / অভিভাবকের স্বাক্ষর
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="border-t border-slate-300 pt-1 w-32 sm:w-36 font-medium text-slate-700">
                          কর্তৃপক্ষের স্বাক্ষর ও সিল
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            };

            const fullReceiptLayout = (
              <div className="space-y-2 bg-white w-full">
                {/* Copy 1: Coaching / Office Copy */}
                {renderReceiptCopy("office")}

                {/* Cut Separator Line */}
                <div className="receipt-cut-line my-2 flex items-center justify-center gap-2 select-none py-1">
                  <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-300 shadow-2xs">
                    <Scissors className="h-3.5 w-3.5 text-slate-500 rotate-90" />
                    <span>এখান থেকে কেটে শিক্ষার্থীকে প্রদান করুন (Cut along this line)</span>
                    <Scissors className="h-3.5 w-3.5 text-slate-500 -rotate-90" />
                  </span>
                  <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                </div>

                {/* Copy 2: Student Copy */}
                {renderReceiptCopy("student")}
              </div>
            );

            return (
              <div className="space-y-3">
                {/* On-screen Preview */}
                {fullReceiptLayout}

                {/* Direct Body Portal for clean, 100% unclipped, non-blank A4 Print */}
                {isMounted && typeof document !== "undefined" && createPortal(
                  <div id="coaching-print-receipt-root" className="hidden print:block">
                    {fullReceiptLayout}
                  </div>,
                  document.body
                )}

                {/* Print Stylesheet */}
                <style jsx global>{`
                  @media screen {
                    #coaching-print-receipt-root {
                      display: none !important;
                    }
                  }
                  @media print {
                    @page {
                      size: A4 portrait;
                      margin: 6mm 10mm;
                    }
                    * {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      color-adjust: exact !important;
                      box-sizing: border-box !important;
                    }
                    html, body {
                      overflow: visible !important;
                      height: auto !important;
                      background: #ffffff !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      width: 100% !important;
                    }
                    /* Hide everything else on the page */
                    body > *:not(#coaching-print-receipt-root) {
                      display: none !important;
                    }
                    /* Show only the direct body portal */
                    #coaching-print-receipt-root {
                      display: block !important;
                      position: static !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      margin: 0 auto !important;
                      padding: 0 !important;
                      background: #ffffff !important;
                    }
                    .receipt-copy-card {
                      border: 1.5px solid #cbd5e1 !important;
                      border-radius: 10px !important;
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                      background: #ffffff !important;
                      position: relative !important;
                      overflow: hidden !important;
                      box-shadow: none !important;
                      margin-bottom: 4px !important;
                    }
                    .receipt-cut-line {
                      margin: 6px 0 !important;
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                    }
                  }
                `}</style>
              </div>
            );
          })()}
        </Dialog>
      )}
    </div>
  );
}
