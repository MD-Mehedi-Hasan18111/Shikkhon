import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Award,
  Users,
  Target,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  GraduationCap,
  BookOpen,
  School,
  MapPin,
  Clock,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ClassroomGallery } from "@/components/public/ClassroomGallery";
import { getSiteSettings, getActiveTeachers } from "@/lib/public-data";
import { toBanglaNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "আমাদের সম্পর্কে | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "শিক্ষণ একাডেমিক কেয়ার চট্টগ্রাম হালিশহরের শীর্ষস্থানীয় কোচিং সেন্টার। আমাদের লক্ষ্য, আদর্শ ও কার্যপদ্ধতি জানুন।",
};

export default async function AboutPage() {
  const [settings, teachers] = await Promise.all([
    getSiteSettings(),
    getActiveTeachers(),
  ]);

  const corePillars = [
    {
      icon: <Target className="h-6 w-6 text-[#00636b]" />,
      title: "আমাদের লক্ষ্য (Mission)",
      description:
        settings.aboutMission ||
        "প্রতিটি শিক্ষার্থীর সুপ্ত মেধার সর্বোত্তম বিকাশ ঘটিয়ে সাধারণ ও আলিয়া মাদ্রাসা কারিকুলামে বোর্ড পরীক্ষায় শ্রেষ্ঠত্ব অর্জন করানো। দুর্বলদের বিশেষ যত্ন ও মেধার যথোপযুক্ত মূল্যায়ন আমাদের অগ্রাধিকার।",
    },
    {
      icon: <Award className="h-6 w-6 text-[#c27a29]" />,
      title: "আমাদের দৃষ্টিভঙ্গি (Vision)",
      description:
        settings.aboutVision ||
        "মুখস্থবিদ্যার বদলে ধারণাগত স্পষ্টতা (Conceptual Clarity), নিয়মিত মূল্যায়ন এবং শৃঙ্খলাবদ্ধ জীবন গঠনের মাধ্যমে শিক্ষার্থীদের ভবিষ্যতের জন্য আত্মবিশ্বাসী ও নীতিবান নাগরিক হিসেবে গড়ে তোলা।",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-700" />,
      title: "আদর্শ ও মূল্যবোধ (Core Values)",
      description:
        settings.aboutValues ||
        "সততা, সময়ানুবর্তিতা, শিক্ষক-শিক্ষার্থী-অভিভাবকের যৌথ সমন্বয় এবং প্রযুক্তিভিত্তিক ডিজিটাল তদারকি। কোনো অবহেলা বা আপস ছাড়াই শিক্ষার মান অক্ষুণ্ণ রাখা।",
    },
  ];

  const highlights: string[] = settings.aboutHighlights?.length
    ? settings.aboutHighlights
    : [
        "চট্টগ্রামের শীর্ষস্থানীয় কলেজ ও বিশ্ববিদ্যালয়ের অভিজ্ঞ বিষয়ভিত্তিক শিক্ষক",
        "৬ষ্ঠ থেকে দ্বাদশ শ্রেণি ও আলিয়া মাদ্রাসা স্পেশাল কেয়ার ব্যাচ",
        "প্রতিটি অধ্যায় শেষে মানসম্মত ওএমআর শিটভিত্তিক মূল্যায়ন পরীক্ষা",
        "ডিজিটাল উপস্থিতি খাতা ও অনুপস্থিতিতে অভিভাবকদের সরাসরি নোটিফিকেশন",
        "আধুনিক শীতাতপ নিয়ন্ত্রিত (AC) ও সিসিটিভি ক্যামেরা সমৃদ্ধ ক্লাসরুম",
        "দুর্বল শিক্ষার্থীদের চিহ্নিত করে আলাদা রিমেডিয়াল / এক্সট্রা ক্লাস",
        "নিজস্ব সমৃদ্ধ লেকচার শিট, হ্যান্ডনোট ও বিগত ১০ বছরের প্রশ্নব্যাংক সল্যুশন",
        "নিয়মিত অভিভাবক সমাবেশ (Parents Meeting) ও প্রগ্রেস কার্ড প্রদান",
      ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PublicHeader settings={settings} />

      <main className="flex-1">
        {/* Page Hero Header */}
        <section className="bg-white border-b border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <Badge variant="primary" size="sm">
              পরিচিতি ও কার্যপদ্ধতি
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              আমাদের সম্পর্কে (About Us)
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {settings.institutionName || "শিক্ষণ একাডেমিক কেয়ার"} — শিক্ষার্থীদের মেধা
              বিকাশ, অধ্যবসায় ও বোর্ড পরীক্ষায় শতভাগ পাসের বিশ্বস্ত ঠিকানা।
            </p>
          </div>
        </section>

        {/* Detailed Introduction Section */}
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <span className="text-xs font-bold text-[#00636b] uppercase tracking-wider">
                  প্রতিষ্ঠান বৃত্তান্ত
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                  {settings.aboutTitle ||
                    "শিক্ষার্থীদের মেধা বিকাশ ও বোর্ড পরীক্ষায় শ্রেষ্ঠত্ব অর্জনে আমরা অঙ্গীকারাবদ্ধ"}
                </h2>
                <div className="text-sm text-slate-600 space-y-4 leading-relaxed">
                  <p>
                    {settings.aboutText ||
                      "শিক্ষণ একাডেমিক কেয়ার চট্টগ্রাম হালিশহরে প্রতিষ্ঠিত একটি প্রথম সারির পাঠদান কেন্দ্র। অভিজ্ঞ শিক্ষকমণ্ডলী, নিয়মিত ওএমআর মডেল টেস্ট এবং দুর্বল শিক্ষার্থীদের জন্য বিশেষ তদারকির মাধ্যমে আমরা প্রতিটি শিক্ষার্থীর কাঙ্ক্ষিত ফলাফল নিশ্চিত করি।"}
                  </p>
                  <p>
                    {settings.aboutStoryParagraph2 ||
                      "আমরা বিশ্বাস করি প্রতিটি শিক্ষার্থীর মধ্যেই বিশেষ মেধা রয়েছে। সঠিক দিকনির্দেশনা, বন্ধুত্বপূর্ণ পাঠদান পরিবেশ এবং নিয়মিত অধ্যাবসায়ের চর্চা নিশ্চিত করার মাধ্যমে আমরা গত এক দশকে হাজারো শিক্ষার্থীকে এসএসসি ও এইচএসসি পরীক্ষায় জিপিএ-৫ ও সর্বোচ্চ সাফল্য এনে দিয়েছি।"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xl font-bold text-[#00636b]">
                      {toBanglaNumber(3500)}+
                    </p>
                    <p className="text-xs font-medium text-slate-600">কৃতী শিক্ষার্থী</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xl font-bold text-amber-700">৯৮%</p>
                    <p className="text-xs font-medium text-slate-600">বোর্ড পাশের হার</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
                  <Image
                    src={settings.bannerUrl || "/images/banner.png"}
                    alt={settings.institutionName || "শিক্ষণ একাডেমিক কেয়ার"}
                    width={800}
                    height={500}
                    className="w-full h-auto object-cover"
                  />
                  <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#00636b]" />
                      <span>{settings.address || "হালিশহর, চট্টগ্রাম"}</span>
                    </p>
                    <p className="text-slate-400 pl-5">
                      অফিস সময়: {settings.officeHours || "সকাল ৮:০০ - রাত ৮:০০ (প্রতিদিন)"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="gold" size="sm">
                আমাদের মূলনীতি
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                যে উদ্দেশ্যে আমরা কাজ করি
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {corePillars.map((pillar, idx) => (
                <Card key={idx} className="bg-white border-slate-200">
                  <CardHeader className="space-y-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      {pillar.icon}
                    </div>
                    <CardTitle className="text-base text-slate-900">
                      {pillar.title}
                    </CardTitle>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Why Shikkhon Academic Care (Checklist) */}
        <section className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="primary" size="sm">
                বিশেষ সুযোগ-সুবিধা
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                আমাদের পাঠদানের বিশেষত্বসমূহ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {highlights.map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Teachers Preview on About Page */}
        {teachers.length > 0 && (
          <section className="py-16 bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="text-center space-y-2">
                <Badge variant="default" size="sm">
                  শিক্ষক প্যানেল
                </Badge>
                <h2 className="text-2xl font-bold text-slate-900">
                  দক্ষ ও নিবেদিতপ্রাণ শিক্ষকবৃন্দ
                </h2>
                <p className="text-xs text-slate-500">
                  চট্টগ্রামের খ্যাতনামা প্রতিষ্ঠানের শিক্ষকবৃন্দের সরাসরি পাঠদান
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {teachers
                  .slice(0, 4)
                  .map(
                    (t: {
                      _id: string;
                      fullName: string;
                      designation?: string;
                      subjects?: string[];
                    }) => (
                      <div
                        key={t._id}
                        className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-1"
                      >
                        <p className="font-bold text-sm text-slate-900">{t.fullName}</p>
                        <p className="text-xs text-[#00636b] font-medium">
                          {t.designation || "বিষয় শিক্ষক"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {t.subjects?.join(", ")}
                        </p>
                      </div>
                    )
                  )}
              </div>

              <div className="text-center pt-2">
                <Link href="/teachers">
                  <Button variant="outline" size="sm">
                    সকল শিক্ষকের প্রোফাইল দেখুন
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Real Classrooms & Campus Infrastructure Showcase */}
        <ClassroomGallery
          items={settings.classroomGallery}
          title="আমাদের সুসজ্জিত ক্লাসরুম ও ক্যাম্পাস পরিবেশ"
          subtitle="চট্টগ্রাম হালিশহর ক্যাম্পাসে প্রতিটি শিক্ষার্থীর জন্য নিরাপদ, আনন্দময় ও একাগ্র পাঠদানের ব্যবস্থা"
        />

        {/* Call to action */}
        <section className="py-12 bg-[#004f56] text-white text-center">
          <div className="max-w-3xl mx-auto px-4 space-y-4">
            <h2 className="text-2xl font-bold">
              আপনার সন্তানের উজ্জ্বল ভবিষ্যৎ নিশ্চিত করুন
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              আজই আমাদের শাখায় এসে শিক্ষক ও উপদেষ্টাদের সাথে কথা বলুন এবং সরাসরি ভর্তি
              সম্পন্ন করুন।
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/admissions">
                <Button
                  size="lg"
                  className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-bold"
                >
                  সরাসরি ভর্তি নির্দেশিকা
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white text-slate-900 border-white font-bold"
                >
                  যোগাযোগের ঠিকানা
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
