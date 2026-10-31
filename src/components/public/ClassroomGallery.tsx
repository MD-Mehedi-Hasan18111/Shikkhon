"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Users,
  Eye,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export interface ClassroomItem {
  id: number;
  title: string;
  badge: string;
  description: string;
  features: string[];
  imageSrc: string;
}

export const defaultClassrooms: ClassroomItem[] = [
  {
    id: 1,
    title: "আধুনিক ক্লাসরুম - ১ (মডেল টেস্ট ও লেকচার রুম)",
    badge: "পর্যাপ্ত আলো-বাতাস",
    description:
      "সুপরিসর ক্লাসরুম, বড় হোয়াইটবোর্ড এবং আরামদায়ক রাইটিং-ট্যাবলেট চেয়ার যা দীর্ঘ সময় ক্লাস ও পরীক্ষায় শিক্ষার্থীদের স্বাচ্ছন্দ্য বজায় রাখে।",
    features: ["ব্যক্তিগত চেয়ার-টেবিল", "প্রশস্ত হোয়াইটবোর্ড", "পর্দাযুক্ত জানালা"],
    imageSrc: "/images/classrooms/classroom-1.jpg",
  },
  {
    id: 2,
    title: "একাডেমিক ক্লাসরুম - ২ (নিয়মিত ব্যাচ পাঠদান)",
    badge: "একাগ্র পরিবেশ",
    description:
      "শিক্ষার্থীর মনোযোগ অক্ষুণ্ণ রাখতে সুশৃঙ্খল বিন্যাস এবং প্রতিটি শিক্ষার্থীর দিকে শিক্ষকের সরাসরি নজরদারির উপযুক্ত পাঠদান সুবিধা।",
    features: ["সারিবদ্ধ বসার ব্যবস্থা", "দৃষ্টিগোচর বোর্ড ভিউ", "নিরিবিলি পরিবেশ"],
    imageSrc: "/images/classrooms/classroom-2.jpg",
  },
  {
    id: 3,
    title: "উন্মুক্ত আলোযুক্ত ক্লাসরুম - ৩ (প্রাকৃতিক ভেন্টিলেশন)",
    badge: "স্বাস্থ্যকর পরিবেশ",
    description:
      "বড় জানালা সমৃদ্ধ ক্লাসরুমে পর্যাপ্ত প্রাকৃতিক দিনের আলো ও বাতাস প্রবেশের ব্যবস্থা, যা শিক্ষার্থীদের ক্লান্তিহীন পড়াশোনায় সহায়তা করে।",
    features: ["প্রাকৃতিক পর্যাপ্ত আলো", "প্রশস্ত স্পেস", "গ্রিল ও সুরক্ষা ব্যবস্থা"],
    imageSrc: "/images/classrooms/classroom-3.jpg",
  },
  {
    id: 4,
    title: "স্পেশাল কেয়ার ক্লাসরুম - ৪ (নিবিড় পরিচর্যা ও রিভিশন)",
    badge: "বিশেষ তদারকি",
    description:
      "দুর্বল শিক্ষার্থীদের পৃথকভাবে যত্ন নেওয়া, নিয়মিত সমাধান ক্লাস এবং মডেল টেস্টের মূল্যায়নের জন্য প্রস্তুত সুসজ্জিত কক্ষ।",
    features: ["ছোট গ্রুপ পাঠদান", "আকর্ষণীয় রঙের বিন্যাস", "সুশৃঙ্খল ব্যবস্থাপনা"],
    imageSrc: "/images/classrooms/classroom-4.jpg",
  },
];

interface ClassroomGalleryProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  className?: string;
  items?: ClassroomItem[];
}

export function ClassroomGallery({
  title = "আমাদের আধুনিক ক্লাসরুম ও পাঠদান পরিবেশ",
  subtitle = "শিক্ষার্থীদের পড়াশোনায় গভীর মনোযোগ, আরামদায়ক বসার ব্যবস্থা ও স্বাস্থ্যকর ভেন্টিলেশন নিশ্চিত করতে আমাদের সুসজ্জিত শ্রেণিকক্ষসমূহ",
  badgeText = "ক্যাম্পাস ও ক্লাসরুম পরিদর্শন",
  className = "",
  items,
}: ClassroomGalleryProps) {
  const displayItems = items && items.length > 0 ? items : defaultClassrooms;
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
  };

  const closeLightbox = () => {
    setActiveImageIndex(null);
  };

  const showNext = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex((activeImageIndex + 1) % displayItems.length);
  };

  const showPrev = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex((activeImageIndex - 1 + displayItems.length) % displayItems.length);
  };

  const activeItem = activeImageIndex !== null ? displayItems[activeImageIndex] : null;

  return (
    <section className={`py-16 bg-white border-b border-slate-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff8f9] border border-[#d7eef1] text-xs font-semibold text-[#00636b]">
            <Sparkles className="h-3.5 w-3.5 text-[#c27a29]" />
            <span>{badgeText}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-100 text-[#00636b] flex items-center justify-center shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">ব্যক্তিগত সিটিং</p>
              <p className="text-[10px] text-slate-500">রাইটিং-ট্যাবলেট চেয়ার</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-[#c27a29] flex items-center justify-center shrink-0">
              <Sun className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">পর্যাপ্ত আলো-বাতাস</p>
              <p className="text-[10px] text-slate-500">স্বাস্থ্যকর ভেন্টিলেশন</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">বড় হোয়াইটবোর্ড</p>
              <p className="text-[10px] text-slate-500">স্পষ্ট দৃশ্যমান পাঠদান</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">শৃঙ্খলা ও নিরাপত্তা</p>
              <p className="text-[10px] text-slate-500">সম্পূর্ণ সুরক্ষিত ক্যাম্পাস</p>
            </div>
          </div>
        </div>

        {/* 4 Classrooms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map((room, idx) => (
            <Card
              key={room.id}
              className="group overflow-hidden border border-slate-200 hover:border-[#00636b] hover:shadow-lg transition-all duration-300 flex flex-col justify-between bg-white rounded-2xl"
            >
              {/* Photo Container */}
              <div
                className="relative h-56 w-full overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <Image
                  src={room.imageSrc}
                  alt={room.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#00636b] text-white shadow-sm">
                    {room.badge}
                  </span>
                </div>

                {/* Zoom Hint Icon */}
                <div className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-xs text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Maximize2 className="h-4 w-4 text-[#00636b]" />
                </div>
              </div>

              {/* Details Content */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#00636b] transition leading-snug">
                    {room.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                    {room.description}
                  </p>
                </div>

                {/* Feature Tags */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  {room.features.map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-1.5 text-[11px] text-slate-600"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Fullscreen Action */}
              <div className="px-4 pb-4 pt-1">
                <button
                  onClick={() => openLightbox(idx)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-700 group-hover:border-[#00636b] group-hover:text-[#00636b] hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>ছবিটি বড় করে দেখুন</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {activeItem && activeImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-60 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-hidden"
            aria-label="বন্ধ করুন"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Previous */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-60 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition focus:outline-hidden hidden sm:flex items-center justify-center"
            aria-label="পূর্ববর্তী ছবি"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Navigation Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-60 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition focus:outline-hidden hidden sm:flex items-center justify-center"
            aria-label="পরবর্তী ছবি"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Image & Caption Card Container */}
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main High-Res Image Display */}
            <div className="relative w-full h-[55vh] sm:h-[65vh] bg-black">
              <Image
                src={activeItem.imageSrc}
                alt={activeItem.title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-contain"
              />
            </div>

            {/* Caption & Details Footer */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00636b] text-white">
                    {activeItem.badge}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    {activeItem.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {activeItem.description}
                </p>
              </div>

              {/* Photo Counter */}
              <div className="text-xs font-semibold text-slate-400 shrink-0">
                ছবি {activeImageIndex + 1} / {displayItems.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
