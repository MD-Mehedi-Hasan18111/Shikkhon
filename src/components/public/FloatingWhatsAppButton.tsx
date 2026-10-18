"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import {
  generateWhatsAppLink,
  isValidWhatsAppNumber,
  DEFAULT_WHATSAPP_GENERAL_MESSAGE,
} from "@/lib/whatsapp";

interface FloatingWhatsAppButtonProps {
  settings?: {
    whatsAppNumber?: string;
    whatsappNumber?: string;
    whatsAppPrefillMessage?: string;
    isWhatsAppEnabled?: boolean;
    institutionName?: string;
  };
}

export function FloatingWhatsAppButton({ settings }: FloatingWhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Check if disabled by admin settings
  if (settings?.isWhatsAppEnabled === false) {
    return null;
  }

  const phone = settings?.whatsAppNumber || settings?.whatsappNumber || "+880 1866-098078";
  if (!isValidWhatsAppNumber(phone)) {
    return null;
  }

  const prefillMessage =
    settings?.whatsAppPrefillMessage || DEFAULT_WHATSAPP_GENERAL_MESSAGE;
  const link = generateWhatsAppLink({ phone, message: prefillMessage });

  return (
    <aside aria-label="হোয়াটসঅ্যাপ সহায়তা" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Interactive Tooltip Card / Bubble */}
      {isOpen && (
        <div
          role="region"
          aria-label="হোয়াটসঅ্যাপ চ্যাট নোটিশ"
          className="mb-3 w-72 sm:w-80 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                WA
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {settings?.institutionName || "শিক্ষণ একাডেমি"} হেল্পডেস্ক
                </h4>
                <p className="text-[10px] text-emerald-600 font-medium">
                  অনলাইন সহায়তা (হোয়াটসঅ্যাপ)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition"
              aria-label="বন্ধ করুন"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
            ভর্তি, নতুন ব্যাচ অথবা যেকোনো তথ্যের জন্য সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ করুন।
          </p>

          <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 italic">
            &ldquo;{prefillMessage}&rdquo;
          </div>

          <div className="mt-3 pt-2 flex flex-col gap-1.5">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md transition transform active:scale-95"
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              <span>হোয়াটসঅ্যাপে চ্যাট শুরু করুন</span>
            </a>
            <span className="text-[10px] text-slate-400 text-center leading-tight">
              * ক্লিক করলে আপনার ডিভাইসের হোয়াটসঅ্যাপ অ্যাপ বা ওয়েব খুলবে
            </span>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="হোয়াটসঅ্যাপে যোগাযোগ করুন"
          className="relative h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 transform group-hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-emerald-300"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              {/* Pulsing beacon ping */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 border-2 border-white"></span>
              </span>
              <MessageCircle className="h-7 w-7 fill-white text-emerald-500" />
            </>
          )}
        </button>

        {/* Hover Hint Bubble when closed */}
        {!isOpen && (
          <div className="hidden sm:block absolute right-16 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            হোয়াটসঅ্যাপে যোগাযোগ করুন
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        )}
      </div>
    </aside>
  );
}
