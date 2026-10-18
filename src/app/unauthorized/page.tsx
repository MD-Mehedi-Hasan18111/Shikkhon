import Link from "next/link";
import { Lock, ArrowLeft, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { bn } from "@/config/bangla-strings";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full border border-slate-200 shadow-sm bg-white text-center p-8">
        <CardContent className="p-0 space-y-5">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-[#eff8f9] border border-[#d7eef1] flex items-center justify-center text-[#00636b] shadow-2xs">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#00636b] uppercase tracking-wider">
              এইচটিটিপি ৪০১ • Unauthorized
            </span>
            <h1 className="text-xl font-bold text-slate-900">লগইন প্রয়োজন</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              এই পেজে প্রবেশের জন্য একটি সক্রিয় সেশন প্রয়োজন। অনুগ্রহ করে আপনার মোবাইল
              নম্বর ও পাসওয়ার্ড দিয়ে লগইন সম্পন্ন করুন।
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2 text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              নিরাপত্তার খাতিরে অননুমোদিত ব্রাউজিং স্বয়ংক্রিয়ভাবে ব্লক করা হয়েছে।
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full bg-[#00636b] hover:bg-[#004f56] gap-2">
                <LogIn className="h-4 w-4" />
                <span>লগইন করুন</span>
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
