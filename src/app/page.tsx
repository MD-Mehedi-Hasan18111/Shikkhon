import Link from "next/link";
import Image from "next/image";
import {
  Users,
  CalendarCheck,
  Award,
  Wallet,
  ShieldCheck,
  CheckCircle,
  PhoneCall,
  MapPin,
  ArrowRight,
  BookOpen,
  Sparkles,
  School,
  Clock,
  Bell,
  Calendar,
  MessageCircle,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ClassroomGallery } from "@/components/public/ClassroomGallery";
import { toBanglaNumber, formatBanglaDate } from "@/lib/utils";
import {
  getSiteSettings,
  getActiveTeachers,
  getLatestNotices,
  getRecentBlogPosts,
  getUpcomingEvents,
  getActiveBatchesWithDetails,
} from "@/lib/public-data";

export const revalidate = 60; // ISR Revalidate every 60 seconds

export default async function HomePage() {
  const [settings, teachers, notices, blogPosts, events, batches] = await Promise.all([
    getSiteSettings(),
    getActiveTeachers(),
    getLatestNotices(4),
    getRecentBlogPosts(3),
    getUpcomingEvents(3),
    getActiveBatchesWithDetails(),
  ]);

  const classesList = [
    {
      title: "৬ষ্ঠ থেকে ৮ম শ্রেণি",
      description:
        "বেসিক ফাউন্ডেশন, গণিত ও বিজ্ঞানের নিবিড় যত্ন, ধর্মীয় শিক্ষা ও মাদ্রাসা সিলেবাস সমন্বয়।",
      badge: "জেনারেল ও মাদ্রাসা",
      timing: "সকাল ও বিকাল ব্যাচ",
      href: "/classes#class-6-8",
    },
    {
      title: "৯ম ও ১০ম শ্রেণি (এসএসসি)",
      description:
        "বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখার শতভাগ প্রস্তুতি, অধ্যায়ভিত্তিক পরীক্ষা ও সৃজনশীল প্র্যাকটিস।",
      badge: "এসএসসি স্পেশাল",
      timing: "প্রতিদিন নিয়মিত ক্লাস",
      href: "/classes#class-9-10",
    },
    {
      title: "একাদশ ও দ্বাদশ শ্রেণি (এইচএসসি)",
      description:
        "পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান, আইসিটি ও সাধারণ বিষয়ের বিষয়ভিত্তিক পূর্ণাঙ্গ কেয়ার।",
      badge: "এইচএসসি ব্যাচ",
      timing: "কলেজ সময়ের সাথে সমন্বয়",
      href: "/classes#hsc",
    },
    {
      title: "আলিয়া মাদ্রাসা স্পেশাল কেয়ার",
      description:
        "দাখিল ও আলিম পরীক্ষার্থীদের জন্য বিশেষ পাঠদান, আরবি সাহিত্য, হাদিস ও সাধারণ বিষয়ের সমন্বিত গাইডেন্স।",
      badge: "আলিয়া মাদ্রাসা",
      timing: "বিশেষায়িত শিক্ষক",
      href: "/classes#madrasah",
    },
  ];

  const features = [
    {
      icon: <Users className="h-5 w-5 text-[#00636b]" />,
      title: "অভিজ্ঞ শিক্ষকমণ্ডলী",
      description:
        "চট্টগ্রামের স্বনামধন্য কলেজ ও বিশ্ববিদ্যালয়ের অভিজ্ঞ শিক্ষকদের প্রত্যক্ষ তত্ত্বাবধানে মানসম্মত ক্লাস।",
    },
    {
      icon: <CalendarCheck className="h-5 w-5 text-[#c27a29]" />,
      title: "ডিজিটাল হাজিরা ও সময়ানুবর্তিতা",
      description:
        "প্রতিটি ক্লাসে উপস্থিতি নিশ্চিতকরণ এবং অনুপস্থিত শিক্ষার্থীদের অভিভাবকদের কাছে স্বয়ংক্রিয় তথ্য প্রদান।",
    },
    {
      icon: <Award className="h-5 w-5 text-emerald-700" />,
      title: "সাপ্তাহিক ও মাসিক মডেল টেস্ট",
      description:
        "নিয়মিত মূল্যায়ন পরীক্ষা, ওএমআর শিট মূল্যায়ন এবং মেধা তালিকা প্রকাশের মাধ্যমে শিক্ষার্থীর উন্নতি যাচাই।",
    },
    {
      icon: <Wallet className="h-5 w-5 text-[#00636b]" />,
      title: "স্বচ্ছ ফি ও ডিজিটাল রসিদ",
      description:
        "মাসিক টিউশন ফি ও পরীক্ষা ফির হিসাব সংরক্ষণ, মোবাইল ব্যাংকিং এবং ডিজিটাল মানি রিসিট প্রদান।",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-[#c27a29]" />,
      title: "অভিভাবকদের সার্বক্ষণিক মনিটরিং",
      description:
        "অভিভাবক মিটিং ও নিয়মিত ফিডব্যাকের মাধ্যমে শিক্ষার্থীর দুর্বলতা চিহ্নিত করে বিশেষ ক্লাসের ব্যবস্থা।",
    },
    {
      icon: <BookOpen className="h-5 w-5 text-emerald-700" />,
      title: "প্রিন্টেড লেকচার শিট ও হ্যান্ডনোট",
      description:
        "সহজ ও তথ্যবহুল নিজস্ব লেকচার শিট, হ্যান্ডনোট এবং বোর্ড পরীক্ষার স্ট্যান্ডার্ড প্রশ্নব্যাংক সমাধান।",
    },
  ];

  const stats = [
    { label: "সফল শিক্ষার্থী", value: `${toBanglaNumber(3500)}+` },
    {
      label: "অভিজ্ঞ শিক্ষক",
      value: `${toBanglaNumber(teachers.length > 0 ? teachers.length : 25)}+`,
    },
    {
      label: "সক্রিয় ব্যাচ",
      value: `${toBanglaNumber(batches.length > 0 ? batches.length : 16)}+`,
    },
    { label: "বোর্ড জিপিএ-৫ হার", value: "৯৮%" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="flex-1">
        {/* Admission Alert Ribbon (if admission is open) */}
        {settings.isAdmissionOpen && (
          <div className="bg-[#fef9ee] border-b border-[#fde68a] text-[#aa651d] text-xs py-2.5 px-4 text-center">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap font-medium">
              <span className="inline-flex items-center gap-1 font-bold bg-[#c27a29] text-white px-2 py-0.5 rounded text-[10px]">
                ভর্তি চলছে
              </span>
              <span>
                {settings.admissionNotice ||
                  "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসা স্পেশাল কেয়ারে ভর্তি চলছে।"}
              </span>
              <Link
                href="/admissions"
                className="underline font-bold hover:text-[#78350f] inline-flex items-center gap-0.5 ml-1"
              >
                <span>আবেদন করুন</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Full-Width Edge-to-Edge Hero Banner Section */}
        <section className="w-full bg-slate-900 border-b border-slate-200">
          <div className="relative w-full overflow-hidden bg-slate-900 group">
            <Image
              src={settings.bannerUrl || "/images/banner.png"}
              alt={settings.institutionName || "শিক্ষণ একাডেমিক কেয়ার"}
              width={1920}
              height={600}
              className="w-full h-auto min-h-[260px] max-h-[460px] md:max-h-[560px] object-cover transition-transform duration-1000 group-hover:scale-[1.01]"
              priority
              unoptimized={
                settings.bannerUrl?.startsWith("/uploads/") ||
                settings.bannerUrl?.startsWith("/images/") ||
                settings.bannerUrl?.includes("ibb.co")
              }
            />
            {/* Subtle Gradient & Shimmer Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
            
            {/* Overlay Content */}
            <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 right-4 sm:right-8 flex flex-wrap items-end justify-between gap-4 text-white">
              <div className="space-y-2 max-w-2xl drop-shadow-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/30 animate-pulse-subtle">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" style={{ animationDuration: "8s" }} />
                  <span>{settings.motto || "চলো সেরা হই..."}</span>
                  <span className="text-white/60">•</span>
                  <span>২০২৬ শিক্ষাবর্ষ</span>
                </div>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {settings.institutionName || "শিক্ষণ একাডেমিক কেয়ার"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 hidden sm:block leading-relaxed">
                  {settings.heroSubtitle ||
                    "মানসম্মত শিক্ষা ও আধুনিক পাঠদানের নির্ভরযোগ্য প্রতিষ্ঠান"}
                </p>
              </div>

              <div className="flex items-center gap-2.5 animate-float-slow">
                <Link href="/admissions">
                  <Button
                    size="sm"
                    className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white font-bold gap-1.5 shadow-lg text-xs sm:text-sm"
                  >
                    <School className="h-4 w-4" />
                    <span>ভর্তি নির্দেশিকা</span>
                  </Button>
                </Link>
                <Link href="/classes">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/95 hover:bg-white text-slate-900 font-bold border-white text-xs sm:text-sm shadow-md"
                  >
                    <span>পাঠদান ও ব্যাচসমূহ</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Banner Quick Highlights Bar */}
          <div className="w-full bg-slate-50 border-t border-slate-200 py-3.5 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-[#00636b] shrink-0" />
                <span>
                  {settings.address ||
                    "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০২, বি-ব্লক, হালিশহর, চট্টগ্রাম"}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <CheckCircle className="h-4 w-4 text-[#00636b]" />
                  <span>ডিজিটাল মনিটরিং</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <CheckCircle className="h-4 w-4 text-[#c27a29]" />
                  <span>নিয়মিত ওএমআর পরীক্ষা</span>
                </div>
                {settings.whatsAppNumber && (
                  <a
                    href={`https://wa.me/${settings.whatsAppNumber.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs hover:scale-105"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>হোয়াটসঅ্যাপ: {settings.whatsAppNumber}</span>
                  </a>
                )}
                {settings.phones?.[0] && (
                  <a
                    href={`tel:${settings.phones[0].replace(/[^0-9]/g, "")}`}
                    className="inline-flex items-center gap-1 font-bold text-[#00636b] hover:underline"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>হটলাইন: {settings.phones[0]}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Institution Stats Section */}
        <section className="bg-slate-50 border-b border-slate-200 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1"
                >
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#00636b]">
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Classes Offered Section */}
        <section id="courses" className="py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="primary" size="sm">
                অ্যাকাডেমিক পাঠদান
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                আমাদের পাঠদান বিভাগসমূহ
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                ৬ষ্ঠ থেকে দ্বাদশ শ্রেণি এবং আলিয়া মাদ্রাসা কারিকুলামের আলোকে যুগোপযোগী
                প্রস্তুতি
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {classesList.map((cls, idx) => (
                <Card
                  key={idx}
                  className="border border-slate-200 hover:border-[#00636b] transition-all flex flex-col justify-between"
                >
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="gold" size="sm">
                        {cls.badge}
                      </Badge>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {cls.timing}
                      </span>
                    </div>
                    <CardTitle className="text-base text-slate-900">
                      {cls.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 leading-relaxed">
                      {cls.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href={cls.href} className="block w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs hover:border-[#00636b] hover:text-[#00636b]"
                      >
                        ব্যাচ বিস্তারিত দেখুন
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Modern Classrooms & Facilities Section */}
        <ClassroomGallery />

        {/* Latest Notices & Announcements Section */}
        {notices.length > 0 && (
          <section className="py-14 bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <Badge variant="default" size="sm">
                    বিজ্ঞপ্তি বোর্ড
                  </Badge>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    সাম্প্রতিক নোটিশ ও নোটিফিকেশন
                  </h2>
                </div>
                <Link
                  href="/notices"
                  className="text-xs font-bold text-[#00636b] hover:underline flex items-center gap-1"
                >
                  <span>সকল নোটিশ দেখুন</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notices.map(
                  (n: {
                    _id: string;
                    title: string;
                    slug: string;
                    publishedAt?: string;
                    priority?: string;
                    isPinned?: boolean;
                    content?: string;
                  }) => (
                    <Link key={n._id} href={`/notices/${n.slug}`}>
                      <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-[#00636b] hover:shadow-xs transition group">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatBanglaDate(
                                n.publishedAt || new Date().toISOString()
                              )}
                            </span>
                            {n.isPinned && (
                              <Badge variant="gold" className="text-[10px] py-0 px-1.5">
                                শীর্ষে পিন
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant={n.priority === "urgent" ? "danger" : "default"}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {n.priority === "urgent" ? "জরুরি" : "সাধারণ"}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#00636b] transition line-clamp-1">
                          {n.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {n.content?.replace(/<[^>]+>/g, "").slice(0, 120)}...
                        </p>
                      </div>
                    </Link>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Featured Teachers Directory Preview */}
        {teachers.length > 0 && (
          <section className="py-16 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <Badge variant="primary" size="sm">
                    শিক্ষকমণ্ডলী
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    আমাদের অভিজ্ঞ শিক্ষকবৃন্দ
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    বিষয়ভিত্তিক দক্ষ ও অভিজ্ঞ শিক্ষকদের নিবিড় তত্ত্বাবধান
                  </p>
                </div>
                <Link
                  href="/teachers"
                  className="text-xs font-bold text-[#00636b] hover:underline flex items-center gap-1"
                >
                  <span>সকল শিক্ষক দেখুন</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {teachers
                  .slice(0, 4)
                  .map(
                    (t: {
                      _id: string;
                      fullName: string;
                      designation?: string;
                      educationalQualifications?: string[];
                      subjects?: string[];
                      bio?: string;
                      photoUrl?: string;
                    }) => (
                      <Link key={t._id} href={`/teachers/${t._id}`} className="group">
                        <Card className="border border-slate-200 overflow-hidden hover:border-[#00636b] hover:shadow-xs transition h-full flex flex-col justify-between">
                          <div className="p-5 text-center space-y-3">
                            <div className="h-24 w-24 mx-auto rounded-full bg-slate-100 border-2 border-teal-100 flex items-center justify-center overflow-hidden">
                              {t.photoUrl ? (
                                <Image
                                  src={t.photoUrl}
                                  alt={t.fullName}
                                  width={96}
                                  height={96}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <GraduationCap className="h-10 w-10 text-[#00636b]" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#00636b] transition">
                                {t.fullName}
                              </h3>
                              <p className="text-xs text-[#00636b] font-medium mt-0.5">
                                {t.designation || "বিষয় শিক্ষক"}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {t.educationalQualifications?.[0] || "অভিজ্ঞ শিক্ষক"}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
                            <span className="text-xs font-semibold text-slate-600">
                              {t.subjects?.join(", ") || "সকল বিষয়"}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    )
                  )}
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Us Features Section */}
        <section className="py-16 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="default" size="sm">
                আমাদের বিশেষত্ব
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                শিক্ষণ একাডেমি কেন ব্যতিক্রম?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                প্রতিটি শিক্ষার্থীর মেধা বিকাশ ও নিয়মিত ফলাফলের জন্য প্রয়োজনীয় সকল
                সুযোগ-সুবিধা
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((item, idx) => (
                <Card key={idx} className="border border-slate-200 bg-white">
                  <CardHeader className="space-y-3">
                    <div className="h-10 w-10 rounded-lg bg-[#eff8f9] border border-[#d7eef1] flex items-center justify-center">
                      {item.icon}
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Events Section */}
        {events.length > 0 && (
          <section className="py-16 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <Badge variant="gold" size="sm">
                    ইভেন্ট ও সেমিনার
                  </Badge>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    আসন্ন অ্যাকাডেমিক ইভেন্টসমূহ
                  </h2>
                </div>
                <Link
                  href="/events"
                  className="text-xs font-bold text-[#00636b] hover:underline flex items-center gap-1"
                >
                  <span>সকল ইভেন্ট দেখুন</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.map(
                  (ev: {
                    _id: string;
                    title: string;
                    venue: string;
                    startDate: string;
                    description?: string;
                    isFeatured?: boolean;
                  }) => (
                    <Link key={ev._id} href={`/events/${ev._id}`} className="group">
                      <Card className="border border-slate-200 hover:border-[#00636b] hover:shadow-xs transition h-full flex flex-col justify-between">
                        <CardHeader className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#c27a29] flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatBanglaDate(ev.startDate)}
                            </span>
                            {ev.isFeatured && (
                              <Badge variant="primary" className="text-[10px]">
                                ফিচার্ড
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base text-slate-900 group-hover:text-[#00636b] transition">
                            {ev.title}
                          </CardTitle>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-[#00636b]" />
                            <span>{ev.venue}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Recent Blog Posts Section */}
        {blogPosts.length > 0 && (
          <section className="py-16 bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <Badge variant="primary" size="sm">
                    শিক্ষামূলক ব্লগ
                  </Badge>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    পড়াশোনা ও পরীক্ষার টিপস
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-bold text-[#00636b] hover:underline flex items-center gap-1"
                >
                  <span>সকল ব্লগ দেখুন</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {blogPosts.map(
                  (post: {
                    _id: string;
                    title: string;
                    slug: string;
                    summary?: string;
                    coverImage?: string;
                    publishedAt?: string;
                  }) => (
                    <Link key={post._id} href={`/blog/${post.slug}`} className="group">
                      <Card className="border border-slate-200 overflow-hidden hover:border-[#00636b] hover:shadow-xs transition h-full flex flex-col justify-between">
                        {post.coverImage && (
                          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                        )}
                        <CardHeader className="space-y-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {formatBanglaDate(
                              post.publishedAt || new Date().toISOString()
                            )}
                          </span>
                          <CardTitle className="text-base text-slate-900 group-hover:text-[#00636b] transition line-clamp-2">
                            {post.title}
                          </CardTitle>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {post.summary}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <span className="text-xs font-bold text-[#00636b] flex items-center gap-1 group-hover:underline">
                            <span>সম্পূর্ণ পড়ুন</span>
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Admission CTA Banner */}
        <section className="py-14 bg-[#004f56] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <Badge variant="gold" size="md">
              ভর্তি তথ্য ও সহায়তা
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ২০২৬ শিক্ষাবর্ষে আসন সংখ্যা সীমিত, আজই ভর্তি নিশ্চিত করুন
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto leading-relaxed">
              শিক্ষার্থীকে সরাসরি কোচিং অফিসে এসে প্রয়োজনীয় কাগজপত্রসহ ভর্তি সম্পন্ন করতে
              হবে। যে কোনো তথ্যের জন্য আমাদের হেল্পলাইনে সরাসরি কল করুন।
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/admissions">
                <Button
                  size="lg"
                  className="bg-[#65a30d] hover:bg-[#4d7c0f] text-white text-sm font-bold gap-2"
                >
                  <School className="h-4 w-4" />
                  <span>সরাসরি ভর্তি নির্দেশিকা</span>
                </Button>
              </Link>

              {settings.phones?.[0] && (
                <a
                  href={`tel:${settings.phones[0].replace(/[^0-9]/g, "")}`}
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition"
                >
                  <PhoneCall className="h-4 w-4 text-[#00636b]" />
                  <span>হটলাইন: {settings.phones[0]}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
