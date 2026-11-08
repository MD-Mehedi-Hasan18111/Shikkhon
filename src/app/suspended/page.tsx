import Link from "next/link";
import { ShieldAlert, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full border border-slate-200 shadow-md bg-white text-center p-8 rounded-3xl">
        <CardContent className="p-0 space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              অ্যাক্সেস স্থগিত (Account Suspended)
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
              সিস্টেম পরিষেবা সাময়িকভাবে স্থগিত
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              এডুকোচ সেন্ট্রাল প্ল্যাটফর্ম থেকে এই কোচিং সিস্টেমটির অ্যাক্সেস স্থগিত করা হয়েছে। সাবস্ক্রিপশন মেয়াদোত্তীর্ণ বা প্রশাসনিক কারণে এটি হতে পারে।
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5 text-left">
            <p className="font-bold text-slate-800">সমাধান নির্দেশিকা:</p>
            <p className="text-slate-700">কোচিং সেন্টারের পরিচালককে এডুকোচ মাস্টার কনসোল বা ওনার পোর্টালে লগইন করে সাবস্ক্রিপশন সক্রিয় করার অনুরোধ করা হচ্ছে।</p>
          </div>

          <div className="pt-2">
            <a href="http://localhost:3050/login" target="_blank" rel="noreferrer" className="w-full block">
              <Button className="w-full bg-slate-900 hover:bg-slate-800 gap-2 rounded-xl py-3 text-sm font-bold text-white">
                <Globe className="h-4 w-4" />
                <span>EduCoach Master পোর্টালে যান</span>
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
