import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getAllPublishedEvents, getSiteSettings } from "@/lib/public-data";
import { formatBanglaDate, toBanglaNumber } from "@/lib/utils";

export const revalidate = 60;

export const metadata = {
  title: "ইভেন্ট ও সেমিনারসমূহ | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "অভিভাবক সমাবেশ, ক্যারিয়ার ও মেধাভিত্তিক বৃত্তি পরীক্ষা, বিষয়ভিত্তিক স্পেশাল কর্মশালা এবং সেমিনার সূচী।",
};

export default async function EventsPage() {
  const [events, settings] = await Promise.all([
    getAllPublishedEvents(),
    getSiteSettings(),
  ]);

  const now = new Date();
  const upcomingEvents = events.filter((e: any) => new Date(e.startDate) >= now);
  const pastEvents = events.filter((e: any) => new Date(e.startDate) < now);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <PublicHeader settings={settings} />

      <main className="flex-1">
        {/* Banner Section */}
        <section className="bg-brand-banner bg-[#002e33] bg-gradient-to-b from-[#001e22] via-[#002e33] to-[#003e44] text-white py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-teal-200 mb-4">
              <Link href="/" className="hover:underline">
                হোম
              </Link>
              <span>/</span>
              <span className="text-white font-medium">ইভেন্ট ও সেমিনার</span>
            </div>

            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="text-teal-200 border-teal-400 bg-white/10 mb-3"
              >
                একাডেমিক ও মোটিভেশনাল ইভেন্ট
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
                আসন্ন সেমিনার, কর্মশালা ও ইভেন্ট
              </h1>
              <p className="text-base sm:text-lg text-teal-100 leading-relaxed">
                শিক্ষার্থীদের মেধা বিকাশ, ক্যারিয়ার প্ল্যানিং, স্কলারশিপ পরীক্ষা এবং
                অভিভাবকদের সাথে মতবিনিময় সভার নিয়মিত আপডেট।
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary-600" />
                    <span>আসন্ন সেমিনার ও কর্মসূচি</span>
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    অংশগ্রহণের জন্য রেজিস্ট্রেশন বা নির্ধারিত সময়ে উপস্থিত থাকুন
                  </p>
                </div>
                <Badge variant="outline">
                  {toBanglaNumber(upcomingEvents.length)} টি আসন্ন
                </Badge>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <CalendarDays className="h-14 w-14 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    বর্তমানে কোনো আসন্ন সেমিনার নির্ধারিত নেই
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto text-sm mb-4">
                    নতুন সেমিনার বা কর্মশালার সময়সূচী নির্ধারণ করা মাত্রই এখানে প্রকাশিত
                    হবে।
                  </p>
                  <Link href="/contact">
                    <Button variant="outline" size="sm">
                      যোগাযোগ করুন
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((evt: any) => (
                    <Card
                      key={evt._id}
                      className="flex flex-col h-full bg-white hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden group"
                    >
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        {evt.coverImage ? (
                          <img
                            src={evt.coverImage}
                            alt={evt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-primary-800 to-primary-600 flex items-center justify-center text-white">
                            <Calendar className="h-12 w-12 text-white/50" />
                          </div>
                        )}
                        {evt.isFeatured && (
                          <span className="absolute top-3 left-3 bg-amber-500 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            <span>বিশেষ ইভেন্ট</span>
                          </span>
                        )}
                      </div>

                      <CardContent className="flex flex-col flex-1 p-5 sm:p-6 justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-primary-700 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatBanglaDate(evt.startDate)}</span>
                          </div>

                          <Link href={`/events/${evt._id}`} className="block">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-2 leading-snug">
                              {evt.title}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{evt.venue}</span>
                          </div>

                          <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed pt-1">
                            {evt.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <Link href={`/events/${evt._id}`} className="w-full">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-1.5 group hover:bg-primary-50 hover:text-primary-800"
                            >
                              <span>বিস্তারিত ও অংশগ্রহণ</span>
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Events / Archive */}
            {pastEvents.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    পূর্ববর্তী সফল কার্যক্রম ও সেমিনারসমূহ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ইতিপূর্বে সফলভাবে অনুষ্ঠিত হওয়া বিভিন্ন ওয়ার্কশপ ও সেমিনারের তালিকা
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((evt: any) => (
                    <Card
                      key={evt._id}
                      className="bg-white border-slate-200 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <CardContent className="p-5">
                        <Badge variant="secondary" className="text-xs mb-2">
                          সম্পন্ন হয়েছে
                        </Badge>
                        <h4 className="text-base font-bold text-slate-800 line-clamp-1 mb-1">
                          {evt.title}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatBanglaDate(evt.startDate)}</span>
                          <span>•</span>
                          <span>{evt.venue}</span>
                        </div>
                        <Link
                          href={`/events/${evt._id}`}
                          className="text-xs text-primary-700 hover:underline font-medium"
                        >
                          বিস্তারিত বিবরণ দেখুন →
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
