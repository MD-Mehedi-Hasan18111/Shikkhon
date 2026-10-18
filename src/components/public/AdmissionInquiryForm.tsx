"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FormProps {
  initialClass?: string;
}

export function AdmissionInquiryForm({ initialClass }: FormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    guardianPhone: "",
    classLevel: initialClass || "class_10",
    previousSchool: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "আবেদনটি সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }

      setSuccess(true);
      setFormData({
        fullName: "",
        phone: "",
        guardianPhone: "",
        classLevel: initialClass || "class_10",
        previousSchool: "",
        message: "",
      });
    } catch (err: any) {
      setError(err.message || "নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-emerald-950">
          আপনার ভর্তি অনুসন্ধান সফলভাবে গৃহীত হয়েছে!
        </h3>
        <p className="text-sm text-emerald-800 leading-relaxed max-w-md mx-auto">
          ধন্যবাদ। আমাদের সিনিয়র ভর্তি কাউন্সিলর আগামী ২৪ ঘণ্টার মধ্যে আপনার প্রদত্ত নম্বরে যোগাযোগ করে ব্যাচ নির্বাচন ও ভর্তি প্রক্রিয়া বুঝিয়ে দেবেন।
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSuccess(false)}
          className="mt-2 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
        >
          নতুন আবেদন জমা দিন
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            শিক্ষার্থীর পূর্ণ নাম <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="যেমন: তানভীর আহমেদ"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            শ্রেণি / কোর্স নির্বাচন <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.classLevel}
            onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
          >
            <option value="class_6">৬ষ্ঠ শ্রেণি</option>
            <option value="class_7">৭ম শ্রেণি</option>
            <option value="class_8">৮ম শ্রেণি (জেএসসি/জুনিয়র)</option>
            <option value="class_9">৯ম শ্রেণি</option>
            <option value="class_10">১০ম শ্রেণি (এসএসসি স্পেশাল)</option>
            <option value="hsc_1st">একাদশ শ্রেণি (এইচএসসি ১ম বর্ষ)</option>
            <option value="hsc_2nd">দ্বাদশ শ্রেণি (এইচএসসি ২য় বর্ষ)</option>
            <option value="admission">বিশ্ববিদ্যালয় / মেডিকেল ভর্তি</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            মোবাইল নম্বর <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="017XXXXXXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            অভিভাবকের মোবাইল নম্বর (ঐচ্ছিক)
          </label>
          <input
            type="tel"
            placeholder="018XXXXXXXX"
            value={formData.guardianPhone}
            onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          বর্তমান বিদ্যালয় / কলেজের নাম
        </label>
        <input
          type="text"
          placeholder="যেমন: ঢাকা গভঃ মুসলিম হাই স্কুল"
          value={formData.previousSchool}
          onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          কোনো বিশেষ বিষয় বা ব্যাচ পছন্দের তথ্য (ঐচ্ছিক)
        </label>
        <textarea
          rows={3}
          placeholder="যেমন: পদার্থ ও উচ্চতর গণিত ব্যাচে ভর্তি হতে ইচ্ছুক..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        variant="primary"
        className="w-full flex items-center justify-center gap-2 py-3"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>প্রেরণ করা হচ্ছে...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>ভর্তির আবেদন জমা দিন</span>
          </>
        )}
      </Button>
    </form>
  );
}
