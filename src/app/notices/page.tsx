import Link from "next/link";
import {
  Bell,
  Calendar,
  Pin,
  AlertCircle,
  Search,
  ArrowRight,
  Filter,
  FileText,
  Images,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getAllPublishedNotices, getSiteSettings } from "@/lib/public-data";
import { formatBanglaDate, toBanglaNumber } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ q?: string; priority?: string }>;
}

export const revalidate = 60;

export const metadata = {
  title: "নোটিশ বোর্ড | অফিসিয়াল বিজ্ঞপ্তি | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "শিক্ষণ একাডেমিক কেয়ারের ক্লাস রুটিন, পরীক্ষার সময়সূচী, ফলাফল প্রকাশ ও সাধারণ নোটিশ বোর্ড।",
};

export default async function NoticesPage({ searchParams }: PageProps) {
  const { q, priority } = await searchParams;
  const [notices, settings] = await Promise.all([
    getAllPublishedNotices(q, priority),
    getSiteSettings(),
  ]);

  const priorityLabels: Record<string, { label: string; badgeClass: string }> = {
    urgent: {
      label: "জরুরি",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    },
    important: {
      label: "গুরুত্বপূর্ণ",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    normal: {
      label: "সাধারণ",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <PublicHeader settings={settings} />

      <main className="flex-1">
        {/* Banner */}
        <section className="bg-brand-banner bg-[#002e33] bg-gradient-to-b from-[#001e22] via-[#002e33] to-[#003e44] text-white py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-teal-200 mb-4">
              <Link href="/" className="hover:underline">
                হোম
              </Link>
              <span>/</span>
              <span className="text-white font-medium">নোটিশ বোর্ড</span>
            </div>

            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="text-teal-200 border-teal-400 bg-white/10 mb-3"
              >
                অফিসিয়াল নোটিশ বোর্ড
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
                বিজ্ঞপ্তি ও জরুরি নোটিশসমূহ
              </h1>
              <p className="text-base sm:text-lg text-teal-100 leading-relaxed">
                ক্লাস সূচী, সাপ্তাহিক পরীক্ষার শিডিউল, ফলাফল ঘোষণা, ভর্তি সংক্রান্ত আপডেট
                ও প্রাতিষ্ঠানিক সকল আনুষ্ঠানিক বিজ্ঞপ্তি।
              </p>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="border-b border-slate-200 bg-white py-4 shadow-xs sticky top-16 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/notices">
                  <Badge
                    variant={!priority ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm ${
                      !priority
                        ? "bg-primary-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    সকল নোটিশ
                  </Badge>
                </Link>
                <Link href="/notices?priority=urgent">
                  <Badge
                    variant={priority === "urgent" ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm ${
                      priority === "urgent"
                        ? "bg-red-600 text-white"
                        : "text-red-700 border-red-200 hover:bg-red-50"
                    }`}
                  >
                    জরুরি বিজ্ঞপ্তি
                  </Badge>
                </Link>
                <Link href="/notices?priority=important">
                  <Badge
                    variant={priority === "important" ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm ${
                      priority === "important"
                        ? "bg-amber-600 text-white"
                        : "text-amber-700 border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    গুরুত্বপূর্ণ
                  </Badge>
                </Link>
                <Link href="/notices?priority=normal">
                  <Badge
                    variant={priority === "normal" ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-xs sm:text-sm ${
                      priority === "normal"
                        ? "bg-slate-700 text-white"
                        : "text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    সাধারণ
                  </Badge>
                </Link>
              </div>

              {/* Search Form */}
              <form method="GET" action="/notices" className="flex items-center gap-2">
                {priority && <input type="hidden" name="priority" value={priority} />}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q || ""}
                    placeholder="নোটিশ খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" className="h-9 px-3">
                  খুঁজুন
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Notices List */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                বিজ্ঞপ্তিসমূহ ({toBanglaNumber(notices.length)} টি নোটিশ)
              </h2>
            </div>

            {notices.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  কোনো নোটিশ পাওয়া যায়নি
                </h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  {q || priority
                    ? "আপনার খোঁজের সাথে মেলে এমন কোনো বিজ্ঞপ্তি খুঁজে পাওয়া যায়নি। অনুসন্ধান শব্দ পরিবর্তন করে আবার চেষ্টা করুন।"
                    : "বর্তমানে কোনো নতুন বিজ্ঞপ্তি নেই। নিয়মিত আপডেট পেতে আমাদের ফেসবুক পেজ বা হটলাইনে যোগাযোগ রাখুন।"}
                </p>
                {(q || priority) && (
                  <Link href="/notices">
                    <Button variant="outline">সকল নোটিশ দেখুন</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice: any) => {
                  const pConfig =
                    priorityLabels[notice.priority] || priorityLabels.normal;
                  const hasImages = notice.images && notice.images.length > 0;

                  return (
                    <Card
                      key={notice._id}
                      className={`bg-white border-slate-200 hover:border-primary-300 hover:shadow-md transition-all ${
                        notice.isPinned
                          ? "ring-2 ring-primary-500/20 bg-primary-50/20"
                          : ""
                      }`}
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          {hasImages && (
                            <Link
                              href={`/notices/${notice.slug}`}
                              className="relative shrink-0 w-full sm:w-28 h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group/img block"
                            >
                              <img
                                src={notice.images[0]}
                                alt={notice.title}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                                <Images className="h-3 w-3" />
                                <span>{toBanglaNumber(notice.images.length)}</span>
                              </span>
                            </Link>
                          )}

                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {notice.isPinned && (
                                <Badge className="bg-primary-800 text-white flex items-center gap-1 text-xs">
                                  <Pin className="h-3 w-3" />
                                  <span>পিন করা</span>
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs ${pConfig.badgeClass}`}
                              >
                                {pConfig.label}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatBanglaDate(notice.publishedAt || notice.createdAt)}
                              </span>
                            </div>

                            <Link
                              href={`/notices/${notice.slug}`}
                              className="block group"
                            >
                              <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                                {notice.title}
                              </h3>
                            </Link>

                            {notice.summary ? (
                              <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                                {notice.summary}
                              </p>
                            ) : (
                              <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                                {notice.content.slice(0, 150)}...
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 pt-2 sm:pt-0 self-start sm:self-center">
                            <Link href={`/notices/${notice.slug}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto flex items-center gap-1.5 group hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                              >
                                <span>সম্পূর্ণ পড়ুন</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
