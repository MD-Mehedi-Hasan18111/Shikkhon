import Link from "next/link";
import Image from "next/image";
import { PhoneCall, MapPin, Mail, ChevronRight, ShieldCheck, Heart } from "lucide-react";
import { bn } from "@/config/bangla-strings";
import { FloatingWhatsAppButton } from "@/components/public/FloatingWhatsAppButton";

interface PublicFooterProps {
  settings?: any;
}

export function PublicFooter({ settings }: PublicFooterProps = {}) {
  const institutionName = settings?.institutionName || bn.institution.name;
  const institutionMotto = settings?.motto || bn.institution.motto;
  const institutionAddress = settings?.address || bn.institution.address;
  const contactPhone = settings?.contactPhone || bn.institution.phones[0];
  const contactEmail = settings?.contactEmail || bn.institution.email;
  const institutionTagline = settings?.tagline || bn.institution.subTitle;

  return (
    <>
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
        {/* Top Banner Accent Line */}
        <div className="h-1 bg-gradient-to-r from-[#00636b] via-[#c27a29] to-[#00636b]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Institute Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                  <Image
                    src="/images/logo.png"
                    alt={institutionName}
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h4 className="text-white font-bold text-base leading-tight">
                    {institutionName}
                  </h4>
                  <p className="text-[#fde68a] text-[11px] font-medium">
                    {institutionMotto}
                  </p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">
                {institutionTagline}। আধুনিক পাঠদান পদ্ধতি, নিয়মিত মডেল টেস্ট এবং অভিজ্ঞ
                শিক্ষকমণ্ডলীর নিবিড় তত্ত্বাবধান।
              </p>

              <div className="flex items-center gap-2 text-[11px] text-[#d7eef1]">
                <ShieldCheck className="h-4 w-4 text-[#007a85]" />
                <span>{bn.institution.classesOffer}</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h5 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">
                গুরুত্বপূর্ণ লিংকসমূহ
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>হোম পেজ</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>আমাদের সম্পর্কে</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/classes"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>পাঠদান ও ব্যাচ</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/teachers"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>শিক্ষকমণ্ডলী</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/notices"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>বিজ্ঞপ্তি বোর্ড</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>ইভেন্ট ও সেমিনার</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>ব্লগ ও পরামর্শ</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admissions"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>সরাসরি ভর্তি নির্দেশিকা</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-[#007a85]" />
                    <span>যোগাযোগ</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Academic Programs */}
            <div className="space-y-3">
              <h5 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">
                অ্যাকাডেমিক বিভাগ
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c27a29] mt-1.5 shrink-0" />
                  <span>৬ষ্ঠ থেকে ৮ম শ্রেণি (সকল বিষয়)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c27a29] mt-1.5 shrink-0" />
                  <span>এসএসসি প্রস্তুতি (৯ম ও ১০ম শ্রেণি)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c27a29] mt-1.5 shrink-0" />
                  <span>এইচএসসি বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c27a29] mt-1.5 shrink-0" />
                  <span>দাখিল ও আলিম মাদ্রাসা স্পেশাল কেয়ার</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c27a29] mt-1.5 shrink-0" />
                  <span>সাপ্তাহিক মডেল টেস্ট ও মূল্যায়ন</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact & Location */}
            <div className="space-y-3">
              <h5 className="text-white font-semibold text-sm border-b border-slate-800 pb-2">
                ঠিকানা ও যোগাযোগ
              </h5>
              <div className="space-y-3 text-slate-400">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#007a85] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{institutionAddress}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="h-4 w-4 text-[#65a30d] shrink-0" />
                  <div className="flex flex-col">
                    <a
                      href={`tel:${contactPhone}`}
                      className="hover:text-white transition"
                    >
                      {contactPhone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-[#c27a29] shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-white transition"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>সর্বস্বত্ব সংরক্ষিত © ২০২৬ {institutionName}।</p>
            <p className="flex items-center gap-1">
              <span>চট্টগ্রাম, বাংলাদেশে</span>
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
              <span>শিক্ষার মানোন্নয়নে নিবেদিত</span>
            </p>
          </div>
        </div>
      </footer>
      <FloatingWhatsAppButton settings={settings} />
    </>
  );
}
