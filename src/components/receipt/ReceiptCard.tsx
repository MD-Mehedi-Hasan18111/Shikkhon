"use client";

import React from "react";
import { Scissors } from "lucide-react";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";

export interface ReceiptSiteSettings {
  institutionName: string;
  shortName: string;
  motto?: string;
  logoUrl?: string;
  address?: string;
  phones?: string[];
  email?: string;
}

export interface ReceiptPaymentData {
  _id: string;
  student: {
    _id?: string;
    fullName: string;
    studentId: string;
    phone: string;
    guardianPhone?: string;
    classLevel?: string;
    institutionName?: string;
  };
  batch: {
    _id?: string;
    name: string;
    code?: string;
    monthlyFee?: number;
    classLevel?: string;
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

const paymentMethodLabels: Record<string, string> = {
  cash: "নগদ (Cash)",
  bkash: "বিকাশ (bKash)",
  nagad: "নগদ (Nagad)",
  rocket: "রকেট (Rocket)",
  bank: "ব্যাংক ডিপোজিট",
  other: "অন্যান্য",
};

interface SingleReceiptCardProps {
  payment: ReceiptPaymentData;
  copyType: "office" | "student";
  siteSettings: ReceiptSiteSettings;
  className?: string;
}

export function SingleReceiptCard({
  payment,
  copyType,
  siteSettings,
  className = "",
}: SingleReceiptCardProps) {
  const isPaid = (payment.dueAmount || 0) <= 0;
  const isOffice = copyType === "office";

  return (
    <div
      className={`receipt-copy-card relative overflow-hidden border rounded-xl bg-white p-4 sm:p-5 text-xs transition ${
        isOffice
          ? "border-slate-300 shadow-2xs"
          : "border-teal-200/90 shadow-2xs"
      } ${className}`}
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
                : `অবশিষ্ট বকেয়া: ৳${toBanglaNumber(payment.dueAmount)}`}
            </div>
          </div>
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 space-y-2.5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-1 shadow-2xs">
              <img
                src={siteSettings.logoUrl || "/images/logo.png"}
                alt={siteSettings.institutionName}
                crossOrigin="anonymous"
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
                {siteSettings.phones?.length
                  ? ` | হেল্পলাইন: ${siteSettings.phones.join(", ")}`
                  : ""}
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
              {payment.receiptNumber ||
                `RCP-${payment._id.slice(-6).toUpperCase()}`}
            </strong>
          </span>
          <span>
            <span className="text-slate-500 font-normal">তারিখ:</span>{" "}
            <strong className="text-slate-900">
              {formatBanglaDate(payment.paidAt || payment.createdAt)}
            </strong>
          </span>
        </div>

        {/* Student & Batch Information */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
          <div>
            <span className="text-slate-400 text-[10px] block">শিক্ষার্থীর নাম</span>
            <strong className="text-slate-900 text-xs block truncate">
              {payment.student?.fullName}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">রোল / আইডি</span>
            <strong className="font-mono text-slate-900 text-xs block">
              {payment.student?.studentId}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">মোবাইল</span>
            <strong className="text-slate-900 text-xs block">
              {payment.student?.phone}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">ব্যাচ ও শ্রেণি</span>
            <strong className="text-slate-900 text-xs block truncate">
              {payment.batch?.name}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">ফি মাস ও বছর</span>
            <strong className="text-slate-900 text-xs block">
              {banglaMonthsMap[payment.month] || `${payment.month} নং মাস`}{" "}
              {toBanglaNumber(payment.year)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">পদ্ধতি ও TrxID</span>
            <strong className="text-slate-900 text-xs block truncate uppercase">
              {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
              {payment.transactionId ? ` (${payment.transactionId})` : ""}
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
                মাসিক টিউশন ফি ({banglaMonthsMap[payment.month] || `${payment.month} নং মাস`} {toBanglaNumber(payment.year)})
              </div>
              <div className="text-right text-emerald-600 font-semibold">
                {payment.discountAmount > 0
                  ? `- ৳${toBanglaNumber(payment.discountAmount)}`
                  : "—"}
              </div>
              <div className="text-right font-semibold">
                ৳{toBanglaNumber(payment.feeAmount)}
              </div>
            </div>
          </div>
          <div className="bg-slate-50/90 px-3 py-1.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">
                ধার্যকৃত মোট: <strong>৳{toBanglaNumber(payment.payableAmount)}</strong>
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
                  : `বকেয়া: ৳${toBanglaNumber(payment.dueAmount)}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-600 mr-2 text-[11px]">পরিশোধিত টাকা:</span>
              <strong className="text-sm font-extrabold text-[#00636b]">
                ৳{toBanglaNumber(payment.paidAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-4 pb-0.5 flex justify-between items-end text-[10px] text-slate-500">
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
}

export function ReceiptCutLine() {
  return (
    <div className="receipt-cut-line my-2 flex items-center justify-center gap-2 select-none py-1">
      <div className="flex-1 border-t-2 border-dashed border-slate-300" />
      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-300 shadow-2xs">
        <Scissors className="h-3.5 w-3.5 text-slate-500 rotate-90" />
        <span>এখান থেকে কেটে শিক্ষার্থীকে প্রদান করুন (Cut along this line)</span>
        <Scissors className="h-3.5 w-3.5 text-slate-500 -rotate-90" />
      </span>
      <div className="flex-1 border-t-2 border-dashed border-slate-300" />
    </div>
  );
}

