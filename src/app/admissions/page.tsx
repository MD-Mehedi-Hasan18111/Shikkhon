import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Phone,
  FileCheck,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  School,
  MessageCircle,
  MapPin,
  AlertCircle,
  UserCheck,
  BookOpen,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { getSiteSettings } from "@/lib/public-data";
import {
  generateWhatsAppLink,
  isValidWhatsAppNumber,
  DEFAULT_WHATSAPP_ADMISSION_MESSAGE,
} from "@/lib/whatsapp";

export const revalidate = 60;

export const metadata = {
  title: "সরাসরি ভর্তি নির্দেশিকা ও তথ্য | শিক্ষণ একাডেমিক কেয়ার",
  description:
    "শিক্ষণ একাডেমিক কেয়ারে সরাসরি ক্যাম্পাসে উপস্থিত হয়ে ভর্তির নিয়মাবলী, প্রয়োজনীয় কাগজপত্র, অফিস সময়সূচী ও ব্যাচ তথ্য।",
};

export default async function AdmissionsPage() {
  const settings = await getSiteSettings();

  const whatsAppPhone =
    settings.whatsAppNumber || settings.whatsappNumber || "+8801859787399";
  const whatsAppAdmissionLink = generateWhatsAppLink({
    phone: whatsAppPhone,
    message: settings.whatsAppPrefillMessage || DEFAULT_WHATSAPP_ADMISSION_MESSAGE,
  });
  const hasValidWhatsApp = isValidWhatsAppNumber(whatsAppPhone);

  const steps = [
    {
      num: "১",
      title: "ক্যাম্পাসে সরাসরি আগমন ও কাউন্সিলিং",
      desc: "শিক্ষার্থী অথবা অভিভাবককে সরাসরি আমাদের কোচিং সেন্টারে উপস্থিত হতে হবে। অভিজ্ঞ শিক্ষক ও কাউন্সিলর শিক্ষার্থীর পূর্ববর্তী ফলাফল ও শিখন ঘাটতি বিশ্লেষণ করে সঠিক ব্যাচ নির্ধারণ করে দেবেন।",
      icon: School,
    },
    {
      num: "২",
      title: "প্রয়োজনীয় কাগজপত্র যাচাই ও জমা",
      desc: "শিক্ষার্থীর ২ কপি পাসপোর্ট ছবি, পূর্ববর্তী শ্রেণির সর্বশেষ পরীক্ষার মার্কশিটের কপি এবং অভিভাবকের পরিচয়পত্রের তথ্য অফিসে সরাসরি জমা দিতে হবে।",
      icon: FileCheck,
    },
    {
      num: "৩",
      title: "অ্যাডমিন কর্তৃক সফটওয়্যারে রেজিস্ট্রেশন",
      desc: "কোচিংয়ের প্রধান অ্যাডমিন বা অনুমোদিত কর্মকর্তা সরাসরি আমাদের সেন্ট্রাল ম্যানেজমেন্ট সফটওয়্যারে শিক্ষার্থীর যাবতীয় তথ্য এন্ট্রি করে একটি ইউনিক ডিজিটাল স্টুডেন্ট আইডি জেনারেট করবেন।",
      icon: UserCheck,
    },
    {
      num: "৪",
      title: "ফি প্রদান, আইডি কার্ড ও শিট সংগ্রহ",
      desc: "অফিস কাউন্টারে ভর্তি ফি ও প্রথম মাসের টিউশন ফি পরিশোধ করে ডিজিটাল স্টুডেন্ট আইডি কার্ড, ক্লাস রুটিন এবং প্রথম মাসের লেকচার শিট সংগ্রহ করে ক্লাস শুরু করা যাবে।",
      icon: BookOpen,
    },
  ];

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
              <span className="text-white font-medium">ভর্তি নির্দেশিকা</span>
            </div>

            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="text-teal-200 border-teal-400 bg-white/10 mb-3"
              >
                ভর্তি নির্দেশিকা ২০২৬
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
                সরাসরি ক্যাম্পাসে ভর্তির সম্পূর্ণ নির্দেশিকা
              </h1>
              <p className="text-base sm:text-lg text-teal-100 leading-relaxed">
                প্রতিটি ব্যাচে সীমিত আসন থাকায় গুণগত মান অক্ষুণ্ণ রাখা হয়। শিক্ষার্থীর
                সঠিক মূল্যায়ন ও ব্যাচ নিশ্চিত করতে সরাসরি অফিসে এসে ভর্তি সম্পন্ন করুন।
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Notice Callout Box: Physical Admission Only */}
            <div className="p-5 sm:p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1 text-xs sm:text-sm">
                <h3 className="font-bold text-base text-amber-950">
                  ভর্তি সংক্রান্ত প্রাতিষ্ঠানিক নিয়মাবলী (সরাসরি ভর্তি বাধ্যতামূলক)
                </h3>
                <p className="text-amber-800 leading-relaxed">
                  আমাদের কোচিং সেন্টারে গুণগত মান বজায় রাখা এবং উপযুক্ত ব্যাচ নির্বাচনের
                  স্বার্থে কোনো অনলাইন ভর্তি আবেদন ফরম রাখা হয়নি। শিক্ষার্থী বা সম্মানিত
                  অভিভাবককে <strong>সরাসরি আমাদের শাখায় উপস্থিত হয়ে</strong> ভর্তি
                  কার্যক্রম সম্পন্ন করতে হবে। কোচিংয়ের প্রধান অ্যাডমিন বা অনুমোদিত
                  কর্মকর্তা সরাসরি সফটওয়্যারে শিক্ষার্থীর তথ্য এন্ট্রি করে ভর্তি সম্পন্ন
                  করবেন।
                </p>
              </div>
              <div className="shrink-0 pt-2 sm:pt-0">
                <Link href="/contact">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>ক্যাম্পাস লোকেশন</span>
                  </span>
                </Link>
              </div>
            </div>

            {/* Step-by-Step Walkthrough (4 Steps) */}
            <div>
              <div className="text-center max-w-2xl mx-auto mb-8">
                <Badge variant="primary" size="sm" className="mb-2">
                  ধাপভিত্তিক পদ্ধতি
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  সরাসরি ভর্তি সম্পন্ন করার ৪টি সহজ ধাপ
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  অফিসে আসার পর কীভাবে খুব দ্রুত ভর্তি সম্পন্ন হবে তা নিচে উল্লেখ করা হলো
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((st) => {
                  const Icon = st.icon;
                  return (
                    <Card
                      key={st.num}
                      className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="h-1.5 bg-[#00636b] w-full absolute top-0 left-0" />
                      <CardContent className="p-6 space-y-3 pt-7">
                        <div className="flex items-center justify-between">
                          <span className="h-9 w-9 rounded-full bg-[#eff8f9] text-[#00636b] font-extrabold text-sm flex items-center justify-center border border-[#d7eef1]">
                            {st.num}
                          </span>
                          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {st.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {st.desc}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Two-Column Grid: Documents & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Requirements & Verification */}
              <div className="lg:col-span-7 space-y-6">
                {/* Documents Checklist */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-[#00636b]" />
                      <span>ভর্তির জন্য প্রয়োজনীয় কাগজপত্র</span>
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      অফিসে আসার সময় নিচের নথিপত্র সঙ্গে নিয়ে আসুন
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3.5 pt-5 text-sm text-slate-700">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 text-sm">
                          শিক্ষার্থীর ২ কপি পাসপোর্ট সাইজের রঙিন ছবি
                        </strong>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ডিজিটাল স্টুডেন্ট আইডি ও অফিশিয়াল ফাইলে সংযুক্ত করার জন্য।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 text-sm">
                          বিগত শ্রেণির সর্বশেষ পরীক্ষার ফলাফল বা মার্কশিট
                        </strong>
                        <p className="text-xs text-slate-500 mt-0.5">
                          শিক্ষার্থীর মেধা ও শিখন স্তর মূল্যায়নের জন্য মূল মার্কশিট বা
                          ফটোকপি।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 text-sm">
                          পিতা / মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি
                        </strong>
                        <p className="text-xs text-slate-500 mt-0.5">
                          অভিভাবকের প্রাতিষ্ঠানিক রেকর্ড সংরক্ষণের জন্য।
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 text-sm">
                          সচল অভিভাবক ও শিক্ষার্থীর মোবাইল নম্বর
                        </strong>
                        <p className="text-xs text-slate-500 mt-0.5">
                          দৈনিক ক্লাসরুম হাজিরা, পরীক্ষার নম্বর ও নোটিফিকেশন এসএমএসের
                          জন্য।
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scholarship / Discount Info */}
                <Card className="bg-brand-card-dark bg-[#002e33] bg-gradient-to-br from-[#002e33] to-[#001e22] text-white border-teal-800 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm mb-2">
                      <Award className="h-5 w-5 text-amber-400" />
                      <span>মেধাভিত্তিক শিক্ষাবৃত্তি ও ফি মওকুফ</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">
                      মেধাবীদের জন্য বিশেষ ছাড়
                    </h3>
                    <p className="text-xs text-teal-100 leading-relaxed mb-4">
                      পিইসি, জেএসসি বা বিগত বার্ষিক পরীক্ষায় গোল্ডেন জিপিএ-৫ প্রাপ্ত
                      শিক্ষার্থীদের জন্য রয়েছে টিউশন ফিতে ৩০% পর্যন্ত বিশেষ ছাড়। এছাড়া
                      অসচ্ছল ও এতিম শিক্ষার্থীদের জন্য রয়েছে বিশেষ বিবেচনা।
                    </p>
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-xs text-xs text-teal-200">
                      * বৃত্তি বা ছাড় প্রাপ্তির জন্য মার্কশিটের মূল কপি নিয়ে অফিসে সরাসরি
                      যোগাযোগ করতে হবে।
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Office Hours & Location */}
              <div className="lg:col-span-5 space-y-6">
                {/* Office Hours */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#00636b]" />
                      <span>অফিস ও ভিজিটিং সময়সূচী</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4 text-xs sm:text-sm text-slate-700">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="font-semibold text-slate-800">
                        শনিবার – বৃহস্পতিবার:
                      </span>
                      <span className="text-[#00636b] font-bold font-mono">
                        সকাল ৯:০০ – রাত ৮:৩০
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="font-semibold text-slate-800">
                        শুক্রবার (ভর্তি সেবা চালু):
                      </span>
                      <span className="text-amber-700 font-bold font-mono">
                        সকাল ৯:৩০ – সন্ধ্যা ৭:০০
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                      * ছুটির দিনেও আমাদের ভর্তি ও তথ্য পরামর্শ ডেস্ক খোলা থাকে। যেকোনো
                      সময় সরাসরি চলে আসতে পারেন।
                    </p>
                  </CardContent>
                </Card>

                {/* Campus Address Card */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#00636b]" />
                      <span>ক্যাম্পাসের ঠিকানা ও দিকনির্দেশনা</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4 text-xs sm:text-sm">
                    <div>
                      <strong className="text-slate-900 block text-sm">
                        {settings.institutionName || "শিক্ষণ একাডেমিক কেয়ার"}
                      </strong>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {settings.address ||
                          "এস ক্লাব মোড় (এর পশ্চিম পার্শ্বে), রোড-০১, বি-ব্লক, হালিশহর, চট্টগ্রাম"}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link href="/contact" className="block w-full">
                        <span className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition">
                          <MapPin className="h-4 w-4 text-[#00636b]" />
                          <span>গুগল ম্যাপে লোকেশন দেখুন</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Direct Helpline / WhatsApp */}
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-[#eff8f9] text-[#00636b] rounded-full flex items-center justify-center mx-auto border border-[#d7eef1]">
                      <Phone className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">
                      ভর্তি সংক্রান্ত যেকোনো তথ্যের জন্য
                    </h4>
                    <p className="text-xs text-slate-500">
                      সরাসরি আমাদের ভর্তি হেল্পডেস্কে কথা বলতে কল করুন
                    </p>
                    {settings.contactPhone && (
                      <p className="text-xl font-bold font-mono text-[#00636b]">
                        {settings.contactPhone}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      সকাল ৯:০০ টা থেকে রাত ৮:৩০ টা পর্যন্ত (শুক্রবার খোলা)
                    </p>

                    {hasValidWhatsApp && whatsAppAdmissionLink && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                        <a
                          href={whatsAppAdmissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition"
                        >
                          <MessageCircle className="h-4 w-4 fill-white" />
                          <span>হোয়াটসঅ্যাপে ভর্তি পরামর্শ নিন</span>
                        </a>
                        <span className="text-[10px] text-slate-400">
                          * ক্লিক করলে সরাসরি হোয়াটসঅ্যাপ চ্যাট চালু হবে
                        </span>
                      </div>
                    )}
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
