import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Pin,
  ArrowLeft,
  Share2,
  Printer,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getNoticeById, getLatestNotices, getSiteSettings } from "@/lib/public-data";
import { formatBanglaDate } from "@/lib/utils";
import { ImageGalleryViewer } from "@/components/public/ImageGalleryViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const notice = await getNoticeById(id);
  if (!notice) return { title: "নোটিশ পাওয়া যায়নি | শিক্ষণ একাডেমিক কেয়ার" };

  return {
    title: `${notice.title} | নোটিশ বোর্ড | শিক্ষণ একাডেমিক কেয়ার`,
    description: notice.summary || (notice.content ? notice.content.slice(0, 160) : ""),
  };
}

export default async function NoticeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [notice, recentNotices, settings] = await Promise.all([
    getNoticeById(id),
    getLatestNotices(4),
    getSiteSettings(),
  ]);

  if (!notice) {
    notFound();
  }

  const priorityLabels: Record<string, { label: string; badgeClass: string }> = {
    urgent: {
      label: "জরুরি বিজ্ঞপ্তি",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    },
    important: {
      label: "গুরুত্বপূর্ণ নোটিশ",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    normal: {
      label: "সাধারণ নোটিশ",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    },
  };

  const pConfig = priorityLabels[notice.priority] || priorityLabels.normal;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <PublicHeader settings={settings} />

      <main className="flex-1">
        {/* Breadcrumb banner */}
        <section className="bg-brand-banner bg-[#002e33] bg-gradient-to-b from-[#001e22] via-[#002e33] to-[#003e44] text-white py-10 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-teal-200 mb-4">
              <Link href="/" className="hover:underline">
                হোম
              </Link>
              <span>/</span>
              <Link href="/notices" className="hover:underline">
                নোটিশ বোর্ড
              </Link>
              <span>/</span>
              <span className="text-white font-medium line-clamp-1">{notice.title}</span>
            </div>

            <Link
              href="/notices"
              className="inline-flex items-center gap-2 text-sm text-primary-200 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>সকল নোটিশ বোর্ডে ফিরুন</span>
            </Link>
          </div>
        </section>

        {/* Notice Reader Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <ImageGalleryViewer
                  images={notice.images}
                  title={notice.title}
                  showCover={false}
                  showGallery={true}
                >
                  <CardContent className="p-6 sm:p-8">
                    {/* Meta badges */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-4">
                      {notice.isPinned && (
                        <Badge className="bg-primary-800 text-white flex items-center gap-1 text-xs">
                          <Pin className="h-3 w-3" />
                          <span>পিন করা</span>
                        </Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${pConfig.badgeClass}`}>
                        {pConfig.label}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {formatBanglaDate(notice.publishedAt || notice.createdAt)}
                        </span>
                      </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-6">
                      {notice.title}
                    </h1>

                    {/* Summary Callout if present */}
                    {notice.summary && (
                      <div className="bg-amber-50/70 border-l-4 border-amber-500 p-4 rounded-r-lg mb-8 text-sm text-amber-950 font-medium leading-relaxed">
                        {notice.summary}
                      </div>
                    )}

                    {/* Full Notice Content */}
                    {/<[a-z][\s\S]*>/i.test(notice.content || "") ? (
                      <div
                        className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base space-y-4"
                        dangerouslySetInnerHTML={{ __html: notice.content }}
                      />
                    ) : (
                      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base whitespace-pre-line space-y-4 font-normal">
                        {notice.content}
                      </div>
                    )}

                    {/* Expiration or Notice Footer */}
                    <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>
                          কর্তৃপক্ষ:{" "}
                          {settings.institutionName || "শিক্ষণ একাডেমিক কেয়ার প্রশাসন"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 print:hidden">
                        <button
                          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-primary-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>প্রিন্ট করুন</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </ImageGalleryViewer>
              </Card>
            </div>

            {/* Sidebar: Recent Notices & Quick Links */}
            <div className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary-600" />
                    <span>অন্যান্য সাম্প্রতিক নোটিশ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {recentNotices
                    .filter((n: any) => String(n._id) !== String(notice._id))
                    .slice(0, 3)
                    .map((item: any) => (
                      <Link
                        key={item._id}
                        href={`/notices/${item._id}`}
                        className="block p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group"
                      >
                        <span className="text-xs text-slate-500 block mb-1">
                          {formatBanglaDate(item.publishedAt || item.createdAt)}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-primary-800 line-clamp-2">
                          {item.title}
                        </h4>
                      </Link>
                    ))}

                  <div className="pt-2">
                    <Link href="/notices" className="w-full block">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        সকল নোটিশ দেখুন
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Admission Support Box */}
              <div className="bg-brand-card-dark bg-[#002e33] bg-gradient-to-br from-[#002e33] to-[#001e22] text-white p-6 rounded-2xl border border-teal-800 shadow-md">
                <h3 className="font-bold text-lg mb-2 text-white">
                  জরুরি তথ্যের জন্য যোগাযোগ
                </h3>
                <p className="text-xs text-teal-100 leading-relaxed mb-4">
                  নোটিশ সংক্রান্ত কোনো অস্পষ্টতা থাকলে সরাসরি আমাদের অফিসে বা হেল্পলাইনে
                  কল করুন।
                </p>
                {settings.contactPhone && (
                  <p className="text-lg font-bold text-emerald-300 font-mono mb-4">
                    {settings.contactPhone}
                  </p>
                )}
                <Link href="/contact" className="block">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-semibold"
                  >
                    যোগাযোগ পেইজ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
