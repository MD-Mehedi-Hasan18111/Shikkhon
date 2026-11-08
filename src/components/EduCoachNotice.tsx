"use client";

import Link from "next/link";
import { Wrench, ShieldAlert, RefreshCw, Globe } from "lucide-react";

export function MaintenanceScreen({
  reason,
  systemName = "শিক্ষণ",
}: {
  reason?: string;
  systemName?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-xl border border-amber-500/30 shadow-2xl rounded-3xl p-8 text-center text-white space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <Wrench className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 rounded-full">
            রক্ষণাবেক্ষণ চলছে • Under Maintenance
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white pt-2">
            {systemName} সিস্টেম সাময়িক বন্ধ রয়েছে
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            এডুকোচ সেন্ট্রাল কন্ট্রোল থেকে এই সিস্টেমটির নিয়মিত রক্ষণাবেক্ষণ চলছে। এই সময়ে কোনো ডেটা নষ্ট হবে না।
          </p>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>প্রশাসনিক কারণ (Maintenance Reason):</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            {reason || "রুটিন রক্ষণাবেক্ষণ ও ডাটাবেজ অপ্টিমাইজেশন চলছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>পেজ রিফ্রেশ করুন (Refresh Page)</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          Powered & Monitored by EduCoach Master Platform
        </p>
      </div>
    </div>
  );
}

export function SuspendedScreen({
  reason,
  systemName = "শিক্ষণ",
}: {
  reason?: string;
  systemName?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-xl border border-rose-500/30 shadow-2xl rounded-3xl p-8 text-center text-white space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/15 border border-rose-500/30 px-3.5 py-1 rounded-full">
            অ্যাক্সেস স্থগিত • Access Suspended
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white pt-2">
            {systemName} সার্ভিস সাময়িকভাবে স্থগিত
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            এডুকোচ সেন্ট্রাল প্ল্যাটফর্ম থেকে এই কোচিং সিস্টেমটির পরিষেবা স্থগিত করা হয়েছে।
          </p>
        </div>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>স্থগিতের কারণ (Suspension Reason):</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            {reason || "সাবস্ক্রিপশনের মেয়াদ শেষ বা প্রশাসনিক কারণে পরিষেবা স্থগিত রয়েছে।"}
          </p>
        </div>

        <div className="pt-2">
          <a
            href="http://localhost:3050/login"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Globe className="h-4 w-4" />
            <span>EduCoach Master পোর্টালে যান</span>
          </a>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          EduCoach Central SaaS Management
        </p>
      </div>
    </div>
  );
}

