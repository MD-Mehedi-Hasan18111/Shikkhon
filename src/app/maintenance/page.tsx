import Link from "next/link";
import { Wrench, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full border border-slate-200 shadow-md bg-white text-center p-8 rounded-3xl">
        <CardContent className="p-0 space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
            <Wrench className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              রক্ষণাবেক্ষণ চলছে (Under Maintenance)
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
              সিস্টেম রক্ষণাবেক্ষণ প্রক্রিয়াধীন
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              এডুকোচ সেন্ট্রাল প্ল্যাটফর্ম থেকে এই সিস্টেমের নিয়মিত রক্ষণাবেক্ষণ ও ডাটাবেজ অপ্টিমাইজেশন চলছে। সাময়িক অসুবিধার জন্য আমরা দুঃখিত।
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5 text-left">
            <p className="font-bold text-slate-800">কর্তৃপক্ষের বার্তা:</p>
            <p className="text-slate-700">খুব শীঘ্রই সমস্ত সেবা পুনরায় চালু হবে। অনুগ্রহ করে কিছু সময় পর আবার চেষ্টা করুন।</p>
          </div>

          <div className="pt-2">
            <Link href="/" className="w-full block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 rounded-xl py-3 text-sm font-bold">
                <RefreshCw className="h-4 w-4" />
                <span>রিফ্রেশ করুন</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
