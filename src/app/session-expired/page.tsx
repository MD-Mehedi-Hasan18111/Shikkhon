import Link from "next/link";
import { Clock, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { bn } from "@/config/bangla-strings";

export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full border border-slate-200 shadow-sm bg-white text-center p-8">
        <CardContent className="p-0 space-y-5">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c27a29] shadow-2xs">
            <Clock className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#c27a29] uppercase tracking-wider">
              সেশন মেয়াদোত্তীর্ণ • Session Expired
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              সেশনের মেয়াদ শেষ হয়ে গেছে
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              নিরাপত্তার স্বার্থে দীর্ঘক্ষণ নিষ্ক্রিয় থাকার কারণে আপনার ব্রাউজার সেশনের
              মেয়াদ সমাপ্ত হয়েছে। আপনার তথ্য সুরক্ষিত রাখতে অনুগ্রহ করে পুনরায় লগইন করুন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full bg-[#00636b] hover:bg-[#004f56] gap-2">
                <LogIn className="h-4 w-4" />
                <span>পুনরায় লগইন করুন</span>
              </Button>
            </Link>

            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>{bn.publicNav.home}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
