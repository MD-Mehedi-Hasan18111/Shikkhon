"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Images,
  ExternalLink,
  ZoomIn,
} from "lucide-react";
import { toBanglaNumber } from "@/lib/utils";

interface ImageGalleryViewerProps {
  coverImage?: string;
  images?: string[];
  title?: string;
  children?: React.ReactNode;
  showCover?: boolean;
  showGallery?: boolean;
  coverAspect?: "video" | "banner" | "wide";
  className?: string;
}

export function ImageGalleryViewer({
  coverImage,
  images = [],
  title,
  children,
  showCover = true,
  showGallery = true,
  coverAspect = "wide",
  className = "",
}: ImageGalleryViewerProps) {
  // Consolidate unique list of all images
  const allImages: string[] = [];
  if (coverImage?.trim()) {
    allImages.push(coverImage.trim());
  }
  if (Array.isArray(images)) {
    images.forEach((img) => {
      const trimmed = img?.trim();
      if (trimmed && !allImages.includes(trimmed)) {
        allImages.push(trimmed);
      }
    });
  }

  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  const openModal = (index: number) => {
    setActiveModalIndex(index);
  };

  const closeModal = () => {
    setActiveModalIndex(null);
  };

  const showNext = useCallback(() => {
    if (activeModalIndex === null || allImages.length === 0) return;
    setActiveModalIndex((prev) => ((prev ?? 0) + 1) % allImages.length);
  }, [activeModalIndex, allImages.length]);

  const showPrev = useCallback(() => {
    if (activeModalIndex === null || allImages.length === 0) return;
    setActiveModalIndex((prev) => ((prev ?? 0) - 1 + allImages.length) % allImages.length);
  }, [activeModalIndex, allImages.length]);

  // Keyboard navigation: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    if (activeModalIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "ArrowRight") {
        showNext();
      } else if (e.key === "ArrowLeft") {
        showPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeModalIndex, showNext, showPrev]);

  if (allImages.length === 0) {
    return <>{children}</>;
  }

  const primaryCover = allImages[0];
  const galleryImages = allImages; // All images accessible in gallery

  const coverHeightClass = {
    video: "h-64 sm:h-80 md:h-96",
    banner: "h-56 sm:h-72 md:h-88",
    wide: "h-72 sm:h-96 md:h-[420px]",
  }[coverAspect];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Main Cover Image (Clickable) */}
      {showCover && (
        <div
          onClick={() => openModal(0)}
          className={`relative w-full ${coverHeightClass} rounded-2xl overflow-hidden bg-slate-900 group cursor-pointer shadow-xs border border-slate-200 select-none`}
          title="বড় করে দেখতে ক্লিক করুন"
        >
          <Image
            src={primaryCover}
            alt={title || "Cover Image"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 1024px) 100vw, 800px"
            priority
            unoptimized={
              primaryCover.startsWith("/uploads/") ||
              primaryCover.startsWith("/images/") ||
              primaryCover.includes("ibb.co")
            }
          />

          {/* Gradient Overlay & Hover Hint */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity" />

          {/* Top-Right Badge: Total Photos */}
          {allImages.length > 1 && (
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <Images className="h-3.5 w-3.5 text-teal-300" />
              <span>{toBanglaNumber(allImages.length)} টি ছবি</span>
            </div>
          )}

          {/* Bottom Overlay Hint */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white pointer-events-none">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20">
              <ZoomIn className="h-4 w-4 text-teal-300" />
              <span>বড় করে দেখতে ক্লিক করুন</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-white/80 bg-black/40 px-2.5 py-1 rounded-md">
              <Maximize2 className="h-3.5 w-3.5" />
              <span>ফুল স্ক্রিন ভিউ</span>
            </span>
          </div>
        </div>
      )}

      {/* Children content (Title, author, main article/event/notice body) */}
      {children}

      {/* 2. Multiple Images Gallery Grid */}
      {showGallery && (allImages.length > 1 || !showCover) && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Images className="h-4.5 w-4.5 text-[#00636b]" />
              <span>
                সংযুক্ত ছবিসমূহ ({toBanglaNumber(allImages.length)} টি)
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              যেকোনো ছবিতে ক্লিক করে ফুল-স্ক্রিনে দেখুন
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {galleryImages.map((imgUrl, index) => (
              <div
                key={`${imgUrl}-${index}`}
                onClick={() => openModal(index)}
                className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md hover:border-[#00636b] transition-all select-none"
              >
                <Image
                  src={imgUrl}
                  alt={title ? `${title} - ছবি ${index + 1}` : `ছবি ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized={
                    imgUrl.startsWith("/uploads/") ||
                    imgUrl.startsWith("/images/") ||
                    imgUrl.includes("ibb.co")
                  }
                />

                {/* Hover overlay with zoom icon */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                    <Maximize2 className="h-4 w-4 text-[#00636b]" />
                  </div>
                </div>

                {/* Index badge */}
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                  {toBanglaNumber(index + 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Interactive Fullscreen Lightbox Modal */}
      {activeModalIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={closeModal}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white w-full max-w-6xl mx-auto py-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-semibold shrink-0">
                ছবি {toBanglaNumber(activeModalIndex + 1)} /{" "}
                {toBanglaNumber(allImages.length)}
              </span>
              {title && (
                <h4 className="text-sm sm:text-base font-semibold text-slate-200 truncate">
                  {title}
                </h4>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={allImages[activeModalIndex]}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition"
                title="আসল সাইজে নতুন ট্যাবে খুলুন"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-200 hover:text-white transition"
                aria-label="বন্ধ করুন"
                title="বন্ধ করুন (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Central Image View with Left & Right Arrows */}
          <div
            className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto my-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={showPrev}
                className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-teal-600 text-white shadow-xl transition border border-white/20 hover:scale-105"
                aria-label="পূর্ববর্তী ছবি"
                title="পূর্ববর্তী (বাম তীর)"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Displayed Image */}
            <div className="relative max-h-[75vh] sm:max-h-[80vh] w-full h-full flex items-center justify-center">
              <img
                src={allImages[activeModalIndex]}
                alt={title ? `${title} - ছবি ${activeModalIndex + 1}` : "Full view"}
                className="max-h-[75vh] sm:max-h-[80vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-xl shadow-2xl transition-all"
              />
            </div>

            {/* Next Button */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-teal-600 text-white shadow-xl transition border border-white/20 hover:scale-105"
                aria-label="পরবর্তী ছবি"
                title="পরবর্তী (ডান তীর)"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Ribbon */}
          {allImages.length > 1 && (
            <div
              className="w-full max-w-4xl mx-auto pt-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2">
                {allImages.map((thumbUrl, idx) => {
                  const isActive = idx === activeModalIndex;
                  return (
                    <button
                      key={`modal-thumb-${thumbUrl}-${idx}`}
                      type="button"
                      onClick={() => setActiveModalIndex(idx)}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        isActive
                          ? "border-teal-400 scale-105 ring-2 ring-teal-400/50 shadow-lg"
                          : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/70"
                      }`}
                    >
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
