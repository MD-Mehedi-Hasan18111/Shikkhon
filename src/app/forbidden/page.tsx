import Link from "next/link";
import { ShieldBan, ArrowLeft, Home, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { bn } from "@/config/bangla-strings";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="max-w-md w-full border border-slate-200 shadow-sm bg-white text-center p-8">
        <CardContent className="p-0 space-y-5">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#c22126] shadow-2xs">
            <ShieldBan className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#c22126] uppercase tracking-wider">
              এইচটিটিপি ৪০৩ • Forbidden
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              প্রবেশাধিকার সংরক্ষিত (অনুমতি নেই)
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              আপনার বর্তমান ব্যবহারকারী রোলে এই নির্দিষ্ট বিভাগ বা কার্যক্রমে প্রবেশের
              অনুমতি নেই। সিস্টেম কেবল অনুমোদিত ভূমিকাগুলোর জন্য এই সেকশনটি প্রদর্শন করে।
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1 text-left">
            <p className="font-semibold text-slate-800">রোলের অনুমতি নির্দেশিকা:</p>
            <p>• শিক্ষার্থী কেবলমাত্র তার নিজের প্রোফাইল, রুটিন ও ফলাফল দেখতে পারবেন।</p>
            <p>• শিক্ষক কেবলমাত্র তার নির্ধারিত ব্যাচের হাজিরা ও মূল্যায়ন করতে পারবেন।</p>
            <p>• প্রধান প্রশাসক সামগ্রিক ইনস্টিটিউট পরিচালনা করতে পারেন।</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full bg-[#00636b] hover:bg-[#004f56] gap-2">
                <Home className="h-4 w-4" />
                <span>ড্যাশবোর্ডে ফিরুন</span>
              </Button>
            </Link>

            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>{bn.publicNav.home}</span>
              </Button>
            </Link>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <PhoneCall className="h-3 w-3 text-[#65a30d]" />
            <span>অ্যাডমিন সহায়তা: {bn.institution.phones[0]}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
