"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  size?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  size,
}: DialogProps) {
  const effectiveMaxWidth = size || maxWidth;
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }[effectiveMaxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          "relative z-10 w-full rounded-2xl bg-white shadow-2xl border border-slate-200 transition-all animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[90vh]",
          maxWidthClass
        )}
      >
        {/* Header - Fixed Top */}
        <div className="flex items-start justify-between px-6 py-4.5 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h3 id="dialog-title" className="text-base font-bold text-slate-900">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition -mr-1"
            aria-label="বন্ধ করুন"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body - Scrollable flush with outer edge */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 modal-scroll-body">
          {children}
        </div>

        {/* Footer - Fixed Bottom */}
        {footer && (
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/95 backdrop-blur-2xs">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
