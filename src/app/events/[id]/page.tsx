import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Share2,
  Phone,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getEventById, getSiteSettings } from "@/lib/public-data";
import { formatBanglaDate, toBanglaNumber } from "@/lib/utils";
import { ImageGalleryViewer } from "@/components/public/ImageGalleryViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return { title: "ইভেন্ট পাওয়া যায়নি | শিক্ষণ একাডেমিক কেয়ার" };

  return {
    title: `${event.title} | ইভেন্ট ও সেমিনার | শিক্ষণ একাডেমিক কেয়ার`,
    description: event.description.slice(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 160),
      images: event.coverImage ? [event.coverImage] : [],
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [event, settings] = await Promise.all([getEventById(id), getSiteSettings()]);

  if (!event) {
    notFound();
  }

  const isPast = new Date(event.startDate) < new Date();

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
              <Link href="/events" className="hover:underline">
                ইভেন্টসমূহ
              </Link>
              <span>/</span>
              <span className="text-white font-medium line-clamp-1">{event.title}</span>
            </div>

            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm text-teal-200 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>সকল ইভেন্ট তালিকায় ফিরুন</span>
            </Link>
          </div>
        </section>

        {/* Event Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <ImageGalleryViewer
                  coverImage={event.coverImage}
                  images={event.images}
                  title={event.title}
                  coverAspect="wide"
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2.5 mb-4">
                      {event.isFeatured && (
                        <Badge className="bg-amber-500 text-white flex items-center gap-1 text-xs">
                          <Sparkles className="h-3 w-3" />
                          <span>বিশেষ ইভেন্ট</span>
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          isPast
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isPast ? "সম্পন্ন হয়েছে" : "আসন্ন ইভেন্ট"}
                      </Badge>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-6">
                      {event.title}
                    </h1>

                    {/* Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-8">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs text-slate-500 block">তারিখ ও সময়</span>
                          <span className="text-sm font-semibold text-slate-800">
                            {formatBanglaDate(event.startDate)}
                          </span>
                          {event.endDate && (
                            <span className="text-xs text-slate-500 block">
                              সমাপ্তি: {formatBanglaDate(event.endDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs text-slate-500 block">
                            অনুষ্ঠানস্থল / ভেন্যু
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {event.venue}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/<[a-z][\s\S]*>/i.test(event.description) ? (
                      <div
                        className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base space-y-4"
                        dangerouslySetInnerHTML={{ __html: event.description }}
                      />
                    ) : (
                      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base whitespace-pre-line">
                        {event.description}
                      </div>
                    )}
                  </CardContent>
                </ImageGalleryViewer>
              </Card>
            </div>

            {/* Sidebar: Registration / Inquiry Box */}
            <div className="space-y-6">
              <Card className="bg-white border-slate-200 shadow-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary-600" />
                    <span>অংশগ্রহণ ও আসন তথ্য</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>সকল শিক্ষার্থী ও অভিভাবক অংশ নিতে পারবেন</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>আসন সংখ্যা সীমিত, আগে আসলে আগে পাবেন</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>প্রবেশ সম্পূর্ণ উন্মুক্ত ও ফ্রি</span>
                    </p>
                  </div>

                  {!isPast ? (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <Link href="/admissions" className="w-full block">
                        <Button variant="primary" className="w-full text-sm">
                          অংশগ্রহণে আগ্রহ প্রকাশ করুন
                        </Button>
                      </Link>
                      <Link href="/contact" className="w-full block">
                        <Button variant="outline" className="w-full text-sm">
                          অনুষ্ঠানস্থল সম্পর্কে জানুন
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                      এই কর্মসূচি ইতিমধ্যে সফলভাবে সম্পন্ন হয়েছে। পরবর্তী আয়োজনের তথ্যের
                      জন্য আমাদের নোটিশ বোর্ডে নজর রাখুন।
                    </div>
                  )}

                  {settings.contactPhone && (
                    <div className="pt-4 border-t border-slate-100 text-center">
                      <span className="text-xs text-slate-500 block mb-1">
                        হেল্পলাইন ও দিকনির্দেশনা:
                      </span>
                      <a
                        href={`tel:${settings.contactPhone}`}
                        className="text-base font-bold text-primary-700 font-mono hover:underline inline-flex items-center gap-1.5"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{settings.contactPhone}</span>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
