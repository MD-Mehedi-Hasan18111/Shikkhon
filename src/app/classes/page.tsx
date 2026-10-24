import Link from "next/link";
import {
  BookOpen,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  School,
  Wallet,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { ClassroomGallery } from "@/components/public/ClassroomGallery";
import { getActiveBatchesWithDetails, getSiteSettings } from "@/lib/public-data";
import { toBanglaNumber } from "@/lib/utils";

export const metadata = {
  title: "পাঠদান বিভাগ ও সক্রিয় ব্যাচসমূহ | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "৬ষ্ঠ থেকে দ্বাদশ শ্রেণি ও আলিয়া মাদ্রাসা স্পেশাল কেয়ারের সময়সূচী, আসন সংখ্যা ও বিষয়ভিত্তিক ব্যাচ তালিকা।",
};

export default async function ClassesPage() {
  const [batches, settings] = await Promise.all([
    getActiveBatchesWithDetails(),
    getSiteSettings(),
  ]);

  const classPrograms = [
    {
      id: "class-6-8",
      title: "৬ষ্ঠ থেকে ৮ম শ্রেণি (জুনিয়র ফাউন্ডেশন)",
      badge: "জেনারেল ও মাদ্রাসা",
      description:
        "নতুন শিক্ষাক্রমের আলোকে ধারণাগত স্পষ্টতা, গণিত ও বিজ্ঞানের নিয়মিত প্র্যাকটিস, ইংরেজি ব্যাকরণ এবং আলিয়া মাদ্রাসার জন্য আরবি ও ধর্মীয় বিষয়ের বিশেষ কেয়ার।",
      features: [
        "সপ্তাহে ৪ দিন নিয়মিত ক্লাস",
        "প্রতিটি বিষয়ের নিজস্ব লেকচার শিট",
        "সাপ্তাহিক মূল্যায়ন পরীক্ষা",
        "দুর্বলদের জন্য এক্সট্রা রিমেডিয়াল ক্লাস",
      ],
    },
    {
      id: "class-9-10",
      title: "৯ম ও ১০ম শ্রেণি (এসএসসি প্রস্তুতি)",
      badge: "এসএসসি স্পেশাল",
      description:
        "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখার শিক্ষার্থীদের বোর্ড পরীক্ষায় এ+ (A+) নিশ্চিতকরণে সাজানো পূর্ণাঙ্গ কোর্স। সৃজনশীল প্রশ্নের কাঠামো ও ওএমআর প্র্যাকটিস।",
      features: [
        "পদার্থ, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞানের বিশেষ কেয়ার",
        "অধ্যায়ভিত্তিক মডেল টেস্ট ও বোর্ড প্রশ্ন সমাধান",
        "ওএমআর (OMR) শিটভিত্তিক নৈর্ব্যক্তিক পরীক্ষা",
        "মেধা তালিকা ও প্রগ্রেস রিপোর্ট প্রদান",
      ],
    },
    {
      id: "hsc",
      title: "একাদশ ও দ্বাদশ শ্রেণি (এইচএসসি)",
      badge: "এইচএসসি ব্যাচ",
      description:
        "কলেজের সময়ের সাথে সমন্বয় করে বিজ্ঞান ও বাণিজ্য বিভাগের বিষয়ভিত্তিক গভীর পাঠদান। জটিল বিষয়ের সহজ সমাধান এবং বিশ্ববিদ্যালয় ভর্তি পরীক্ষার পূর্বপ্রস্তুতি।",
      features: [
        "অভিজ্ঞ কলেজ শিক্ষকদের নিবিড় তত্ত্বাবধান",
        "নিয়মিত ল্যাব ও প্র্যাকটিক্যাল ভিত্তিক ধারণা",
        "অধ্যায়ভিত্তিক সৃজনশীল প্রশ্ন সলভিং",
        "টেস্ট ও প্রি-টেস্ট স্পেশাল মডেল টেস্ট সিরিজ",
      ],
    },
    {
      id: "madrasah",
      title: "দাখিল ও আলিম মাদ্রাসা স্পেশাল কেয়ার",
      badge: "আলিয়া মাদ্রাসা",
      description:
        "মাদ্রাসা বোর্ডের শিক্ষার্থীদের সাধারণ বিষয়ের পাশাপাশি আরবি সাহিত্য, কাওয়ায়েদ, হাদিস ও ফিকহ শাস্ত্রে দক্ষ করে গড়ে তুলতে বিশেষায়িত শিক্ষক প্যানেল।",
      features: [
        "আরবি ১ম ও ২য় পত্রের বিশেষ অনুবাদ ও ব্যাকরণ ক্লাস",
        "দাখিল ও আলিম পরীক্ষার পূর্ণাঙ্গ মডেল টেস্ট",
        "সাধারণ গণিত ও বিজ্ঞানের সমন্বিত ক্লাস",
        "পরীক্ষার খাতা পুঙ্খানুপুঙ্খ মূল্যায়ন",
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PublicHeader settings={settings} />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-white border-b border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <Badge variant="primary" size="sm">
              অ্যাকাডেমিক পাঠদান ও রুটিন
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              পাঠদান বিভাগ ও সক্রিয় ব্যাচসমূহ
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসার শিক্ষার্থীদের জন্য বিষয়ভিত্তিক
              মানসম্মত ব্যাচ এবং সময়সূচী।
            </p>
          </div>
        </section>

        {/* Programs Overview Section */}
        <section className="py-14 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900">আমাদের পাঠদান কাঠামো</h2>
              <p className="text-xs text-slate-500 mt-1">
                প্রতিটি স্তরের জন্য আলাদা কারিকুলাম ও নিবেদিত শিক্ষক
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classPrograms.map((prog) => (
                <div
                  key={prog.id}
                  id={prog.id}
                  className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-[#00636b] transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="gold" size="sm">
                      {prog.badge}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">
                      ২০২৬ শিক্ষাবর্ষ
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{prog.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {prog.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                    {prog.features.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-xs text-slate-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Active Batches from Database */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <Badge variant="primary" size="sm">
                  লাইভ ব্যাচ তালিকা
                </Badge>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  চলমান ও আসন্ন সক্রিয় ব্যাচসমূহ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  রুটিন, বিষয় এবং আসন সংখ্যা যাচাই করে আপনার পছন্দের ব্যাচে ভর্তি নিশ্চিত
                  করুন
                </p>
              </div>
              <Link href="/admissions">
                <Button size="sm" className="bg-[#00636b] hover:bg-[#004f56] gap-1.5">
                  <School className="h-4 w-4" />
                  <span>ভর্তি নির্দেশিকা ও তথ্য</span>
                </Button>
              </Link>
            </div>

            {batches.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  বর্তমানে কোনো সক্রিয় ব্যাচ প্রদর্শিত নেই।
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ভর্তি সংক্রান্ত তথ্যের জন্য সরাসরি আমাদের হেল্পলাইনে যোগাযোগ করুন।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map(
                  (b: {
                    _id: string;
                    name: string;
                    code: string;
                    classLevel: string;
                    subjects?: string[];
                    capacity: number;
                    monthlyFee?: number;
                    schedule?: Array<{
                      day: string;
                      startTime: string;
                      endTime: string;
                      roomNo?: string;
                    }>;
                    assignedTeachers?: Array<{ fullName: string; designation?: string }>;
                    academicSession?: { name: string };
                  }) => (
                    <Card
                      key={b._id}
                      className="border border-slate-200 hover:border-[#00636b] transition flex flex-col justify-between bg-white"
                    >
                      <CardHeader className="space-y-3 pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="primary" size="sm">
                            {b.classLevel}
                          </Badge>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {b.code}
                          </span>
                        </div>
                        <CardTitle className="text-base text-slate-900">
                          {b.name}
                        </CardTitle>
                        <div className="text-xs text-slate-600 space-y-1">
                          <p>
                            <span className="font-semibold text-slate-700">বিষয়: </span>
                            {b.subjects?.join(", ") || "সকল বিষয়"}
                          </p>
                          {b.assignedTeachers && b.assignedTeachers.length > 0 && (
                            <p>
                              <span className="font-semibold text-slate-700">
                                শিক্ষক:{" "}
                              </span>
                              {b.assignedTeachers.map((t) => t.fullName).join(", ")}
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0">
                        {/* Schedule Snippet */}
                        {b.schedule && b.schedule.length > 0 && (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1">
                            <span className="font-bold text-slate-700 block">
                              ক্লাস শিডিউল:
                            </span>
                            {b.schedule.slice(0, 2).map((s, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="capitalize">{s.day}</span>
                                <span className="font-mono">
                                  {s.startTime} - {s.endTime}
                                </span>
                                {s.roomNo && (
                                  <span className="text-slate-400">({s.roomNo})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fee and Capacity */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-semibold text-slate-700">
                            সর্বোচ্চ আসন: {toBanglaNumber(b.capacity)} জন
                          </span>
                          {b.monthlyFee !== undefined && b.monthlyFee > 0 && (
                            <span className="font-bold text-[#00636b]">
                              ফি: ৳{toBanglaNumber(b.monthlyFee)}
                            </span>
                          )}
                        </div>

                        <Link href="/admissions" className="block w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs hover:border-[#00636b] hover:text-[#00636b]"
                          >
                            ভর্তি তথ্য ও নিয়মাবলী
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* Real Classrooms and Infrastructure Showcase */}
        <ClassroomGallery
          title="আমাদের ক্লাসরুম ও পাঠদান অবকাঠামো"
          subtitle="নিয়মিত পাঠদান, ওএমআর পরীক্ষা ও স্পেশাল কেয়ার ব্যাচের জন্য সম্পূর্ণ প্রস্তুত শ্রেণিকক্ষ"
        />

        {/* Admission Inquiry CTA */}
        <section className="py-12 bg-[#004f56] text-white text-center">
          <div className="max-w-3xl mx-auto px-4 space-y-4">
            <h2 className="text-2xl font-bold">
              আপনার পছন্দসই ব্যাচ সম্পর্কে আরও জানতে চান?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              আমাদের শিক্ষণ পরামর্শকদের সাথে কথা বলুন অথবা সরাসরি ক্যাম্পাসে এসে ভর্তি
              সম্পন্ন করুন।
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/admissions">
                <Button
                  size="lg"
                  className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-bold"
                >
                  ভর্তি নির্দেশিকা
                </Button>
              </Link>
              {settings.phones?.[0] && (
                <a
                  href={`tel:${settings.phones[0].replace(/[^0-9]/g, "")}`}
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition"
                >
                  <Clock className="h-4 w-4 text-[#00636b]" />
                  <span>কল করুন: {settings.phones[0]}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
