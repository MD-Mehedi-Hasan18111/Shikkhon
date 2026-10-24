import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Building,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getSiteSettings } from "@/lib/public-data";
import { toBanglaNumber } from "@/lib/utils";
import { generateWhatsAppLink, isValidWhatsAppNumber } from "@/lib/whatsapp";

export const revalidate = 60;

export const metadata = {
  title: "যোগাযোগ ও ক্যাম্পাস ঠিকানা | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "শিক্ষণ একাডেমিক কেয়ারের অফিস ঠিকানা, যোগাযোগ নম্বর, ইমেইল, সরাসরি হোয়াটসঅ্যাপ ও পরামর্শ কেন্দ্র।",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const whatsAppPhone =
    settings.whatsAppNumber || settings.whatsappNumber || "+8801859787399";
  const whatsAppLink = generateWhatsAppLink({
    phone: whatsAppPhone,
    message:
      settings.whatsAppPrefillMessage ||
      "আসসালামু আলাইকুম, আমি কোচিং সংক্রান্ত তথ্য জানতে যোগাযোগ করছি।",
  });
  const hasValidWhatsApp = isValidWhatsAppNumber(whatsAppPhone);

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
              <span className="text-white font-medium">যোগাযোগ</span>
            </div>

            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="text-teal-200 border-teal-400 bg-white/10 mb-3"
              >
                হেল্পডেস্ক ও ক্যাম্পাস
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
                আমাদের সাথে যোগাযোগের উপায়
              </h1>
              <p className="text-base sm:text-lg text-teal-100 leading-relaxed">
                ভর্তি, ব্যাচ তথ্য বা অ্যাকাডেমিক যেকোনো পরামর্শের জন্য সরাসরি আমাদের
                ক্যাম্পাসে চলে আসুন অথবা ফোনে যোগাযোগ করুন।
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Address */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-800 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  ক্যাম্পাস ঠিকানা
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {settings.address || "ঢাকা, বাংলাদেশ"}
                </p>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-800 rounded-xl flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">হটলাইন ও ফোন</h3>
                {settings.contactPhone ? (
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="text-sm font-semibold font-mono text-primary-700 hover:underline block"
                  >
                    {settings.contactPhone}
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">নম্বর শীঘ্রই যুক্ত হবে</p>
                )}
                <span className="text-[11px] text-slate-400 block mt-1">
                  সকাল ৯টা থেকে রাত ৮টা
                </span>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-800 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">ইমেইল ঠিকানা</h3>
                {settings.contactEmail ? (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-xs font-medium text-primary-700 hover:underline block break-all"
                  >
                    {settings.contactEmail}
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">info@shikkhon.edu.bd</p>
                )}
                <span className="text-[11px] text-slate-400 block mt-1">
                  অফিসিয়াল যোগাযোগ ও ক্যারিয়ার
                </span>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  সরাসরি হোয়াটসঅ্যাপ
                </h3>
                {hasValidWhatsApp && whatsAppLink ? (
                  <div className="space-y-1">
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5"
                    >
                      <span>মেসেজ পাঠান ({whatsAppPhone})</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-[10px] text-slate-400 block">
                      * ক্লিক করলে ডিভাইসের হোয়াটসঅ্যাপ অ্যাপ/ওয়েব চালু হবে
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">হোয়াটসঅ্যাপ অনলাইন হেল্পডেস্ক</p>
                )}
                <span className="text-[11px] text-slate-400 block mt-1">
                  তাৎক্ষণিক উত্তরের জন্য
                </span>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form and Map Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Campus Counseling & In-Person Admission Info (7 cols) */}
              <div className="lg:col-span-7">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary-600" />
                      <span>ক্যাম্পাস পরিদর্শন ও সরাসরি পরামর্শ সেবা</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      ভর্তি, বিষয়ভিত্তিক প্রস্তুতি ও শিক্ষক নির্দেশনার জন্য যেকোনো
                      কার্যদিবসে সরাসরি আমাদের অফিসে আসুন।
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>ভর্তি সংক্রান্ত জরুরি নীতিমালা: সরাসরি ভর্তি প্রযোজ্য</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        আমাদের কোচিং সেন্টারে অনলাইনে কোনো সরাসরি ভর্তি আবেদন গ্রহণ করা হয়
                        না। শিক্ষার্থী ও অভিভাবককে স্বশরীরে ক্যাম্পাসে উপস্থিত হয়ে তথ্য
                        যাচাইপূর্বক অ্যাডমিন বা সুপার অ্যাডমিনের মাধ্যমে সফটওয়্যারে
                        শিক্ষার্থী হিসেবে রেজিস্ট্রেশন সম্পন্ন করতে হবে।
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900">
                        সরাসরি ক্যাম্পাসে এসে যেভাবে ভর্তি হবেন:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-[#00636b] block mb-1">
                            ১. কাউন্সেলিং ও ব্যাচ নির্বাচন
                          </span>
                          <span className="text-slate-600">
                            শিক্ষক ও উপদেষ্টাদের সাথে কথা বলে শিক্ষার্থীর উপযুক্ত ব্যাচ
                            নির্ধারণ করুন।
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-[#00636b] block mb-1">
                            ২. কাগজপত্র জমা দিন
                          </span>
                          <span className="text-slate-600">
                            ২ কপি পাসপোর্ট ছবি ও পূর্ববর্তী পরীক্ষার ফলাফল/মার্কশিট নিয়ে
                            আসুন।
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-[#00636b] block mb-1">
                            ৩. সফটওয়্যার রেজিস্ট্রেশন
                          </span>
                          <span className="text-slate-600">
                            কোচিং অ্যাডমিন আপনার সকল তথ্য সরাসরি ম্যানেজমেন্ট পোর্টালে
                            এন্ট্রি করবেন।
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-[#00636b] block mb-1">
                            ৪. আইডি কার্ড ও রুটিন
                          </span>
                          <span className="text-slate-600">
                            ভর্তি ফি প্রদান করে স্টুডেন্ট আইডি ও নির্ধারিত ক্লাসের রুটিন
                            সংগ্রহ করুন।
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                      <Link href="/admissions">
                        <Button className="bg-[#00636b] hover:bg-[#004f56] text-white text-xs gap-1.5">
                          <span>সম্পূর্ণ ভর্তি নির্দেশিকা পড়ুন</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      {hasValidWhatsApp && whatsAppLink && (
                        <a
                          href={whatsAppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-lg border border-emerald-200 transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>হোয়াটসঅ্যাপে পরামর্শ নিন</span>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Map and Office Info (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Office Hours */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary-600" />
                      <span>অফিস ও ভিজিটিং সূচী</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0 text-xs sm:text-sm text-slate-700">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="font-medium text-slate-800">
                        শনিবার – বৃহস্পতিবার:
                      </span>
                      <span className="text-slate-600 font-mono">
                        সকাল ৯:০০ – রাত ৮:৩০
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="font-medium text-slate-800">
                        শুক্রবার (বিশেষ সেবা):
                      </span>
                      <span className="text-slate-600 font-mono">
                        সকাল ৯:০০ – রাত ৭:০০
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 pt-1">
                      * অভিভাবকগণ যেকোনো দিন সরাসরি অফিসে এসে শিক্ষকদের সাথে সাক্ষাৎ করতে
                      পারেন।
                    </p>
                  </CardContent>
                </Card>

                {/* Map Representation */}
                <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary-600" />
                      <span>লোকেশন ম্যাপ ও দিকনির্দেশনা</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <MapPin className="h-10 w-10 text-primary-600 animate-bounce" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {settings.institutionName || "শিক্ষণ একাডেমি ক্যাম্পাস"}
                        </h4>
                        <p className="text-xs text-slate-600 max-w-xs mt-1">
                          {settings.address || "ঢাকা, বাংলাদেশ"}
                        </p>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          settings.address || "Dhaka, Bangladesh"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50 transition"
                      >
                        <span>গুগল ম্যাপে দেখুন</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter settings={settings} />
    </div>
  );
}
