"use client";

import React, { useRef } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "তারিখ নির্বাচন করুন",
  className = "",
  disabled = false,
  required = false,
  min,
  max,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 select-none">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        onClick={handleOpenPicker}
        className="relative flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs hover:border-[#00636b] focus-within:border-[#00636b] focus-within:ring-1 focus-within:ring-[#00636b] cursor-pointer transition"
      >
        <div className="absolute left-3 pointer-events-none text-[#00636b]">
          <CalendarIcon className="h-4 w-4" />
        </div>

        <input
          ref={inputRef}
          type="date"
          value={value || ""}
          disabled={disabled}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-transparent border-0 text-slate-800 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 cursor-pointer"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            title="মুছুন"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
