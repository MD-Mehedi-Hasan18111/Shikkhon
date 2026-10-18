"use client";

import React, { useState, useEffect } from "react";
import { Clock, Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePicker12hProps {
  value: string; // e.g. "04:00 PM", "16:00", "10:30 AM"
  onChange: (time12h: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Convert 24h (e.g. "16:00") or 12h (e.g. "4:00 PM") to standard "04:00 PM"
export function formatTo12h(timeStr: string): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim().toUpperCase();

  // If already contains AM or PM
  if (trimmed.includes("AM") || trimmed.includes("PM")) {
    const parts = trimmed.split(/\s+/);
    const timePart = parts[0];
    const period = parts[1] || (trimmed.endsWith("PM") ? "PM" : "AM");
    const [h, m = "00"] = timePart.split(":");
    let hourNum = parseInt(h, 10);
    if (isNaN(hourNum)) return trimmed;
    if (hourNum === 0) hourNum = 12;
    if (hourNum > 12) hourNum = hourNum % 12 || 12;
    const hourStr = hourNum.toString().padStart(2, "0");
    const minStr = (parseInt(m, 10) || 0).toString().padStart(2, "0");
    return `${hourStr}:${minStr} ${period}`;
  }

  // If 24-hour format "HH:mm"
  if (trimmed.includes(":")) {
    const [h, m = "00"] = trimmed.split(":");
    const hourNum = parseInt(h, 10);
    const minNum = parseInt(m, 10) || 0;
    if (isNaN(hourNum)) return timeStr;

    const period = hourNum >= 12 ? "PM" : "AM";
    let hour12 = hourNum % 12;
    if (hour12 === 0) hour12 = 12;

    const hourStr = hour12.toString().padStart(2, "0");
    const minStr = minNum.toString().padStart(2, "0");
    return `${hourStr}:${minStr} ${period}`;
  }

  return timeStr;
}

export function TimePicker12h({
  value,
  onChange,
  placeholder = "04:00 PM",
  className = "",
  disabled = false,
}: TimePicker12hProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"hour" | "minute">("hour");

  const parseTime = (timeStr: string) => {
    const formatted = formatTo12h(timeStr);
    if (formatted && formatted.includes(":") && (formatted.includes("AM") || formatted.includes("PM"))) {
      const [time, period] = formatted.split(/\s+/);
      const [h, m] = time.split(":");
      return {
        hour: (parseInt(h, 10) || 4).toString().padStart(2, "0"),
        minute: (parseInt(m, 10) || 0).toString().padStart(2, "0"),
        period: (period === "AM" ? "AM" : "PM") as "AM" | "PM",
      };
    }
    return { hour: "04", minute: "00", period: "PM" as "AM" | "PM" };
  };

  const [selectedHour, setSelectedHour] = useState("04");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("PM");

  // Keep internal state updated when value prop changes or modal opens
  useEffect(() => {
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
  }, [value, modalOpen]);

  const handleOpenModal = () => {
    if (disabled) return;
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedPeriod(parsed.period);
    setMode("hour");
    setModalOpen(true);
  };

  const handleConfirm = () => {
    const h = (parseInt(selectedHour, 10) || 12).toString().padStart(2, "0");
    const m = (parseInt(selectedMinute, 10) || 0).toString().padStart(2, "0");
    const result = `${h}:${m} ${selectedPeriod}`;
    onChange(result);
    setModalOpen(false);
  };

  // Clock geometry calculations
  const clockSize = 220;
  const center = clockSize / 2; // 110
  const radius = 80;

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const currentHourNum = parseInt(selectedHour, 10) || 12;
  const currentMinuteNum = parseInt(selectedMinute, 10) || 0;

  // Rotation angles for hand
  const hourAngle = (currentHourNum % 12) * 30;
  const minuteAngle = currentMinuteNum * 6;
  const currentAngle = mode === "hour" ? hourAngle : minuteAngle;

  const displayTime = formatTo12h(value) || placeholder;

  return (
    <>
      {/* Trigger Button: Styled as a clean time field with a clock icon */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpenModal}
        className={cn(
          "w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-800",
          "flex items-center justify-between gap-2 hover:border-[#00636b] focus:outline-none focus:ring-1 focus:ring-[#00636b]",
          "transition shadow-2xs group disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#00636b] transition" />
          <span className={cn("font-medium", !value && "text-slate-400")}>
            {value ? formatTo12h(value) : placeholder}
          </span>
        </span>
        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
          ঘড়ি
        </span>
      </button>

      {/* Circle Clock Popup Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xs p-5 animate-in zoom-in-95 duration-150 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-teal-50 text-[#00636b] flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">সময় নির্ধারণ</h4>
                  <p className="text-[10px] text-slate-400">ঘড়ি বা নিচে ম্যানুয়ালি সময় দিন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Time Header with Mode Switcher & AM/PM */}
            <div className="flex items-center justify-center gap-2 mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100 w-full">
              <div className="flex items-center text-2xl font-bold font-mono">
                {/* Hour display */}
                <button
                  type="button"
                  onClick={() => setMode("hour")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition",
                    mode === "hour"
                      ? "bg-[#00636b] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {selectedHour}
                </button>
                <span className="mx-1 text-slate-400 animate-pulse">:</span>
                {/* Minute display */}
                <button
                  type="button"
                  onClick={() => setMode("minute")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition",
                    mode === "minute"
                      ? "bg-[#00636b] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {selectedMinute}
                </button>
              </div>

              {/* AM / PM Toggle */}
              <div className="flex flex-col gap-1 ml-3 border-l border-slate-200 pl-3">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("AM")}
                  className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded transition",
                    selectedPeriod === "AM"
                      ? "bg-[#00636b] text-white shadow-2xs"
                      : "text-slate-500 hover:bg-slate-200"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("PM")}
                  className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded transition",
                    selectedPeriod === "PM"
                      ? "bg-[#00636b] text-white shadow-2xs"
                      : "text-slate-500 hover:bg-slate-200"
                  )}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Circle Clock Face */}
            <div
              className="relative rounded-full bg-slate-100/80 border-2 border-slate-200 shadow-inner select-none mb-4"
              style={{ width: `${clockSize}px`, height: `${clockSize}px` }}
            >
              {/* Center Pin */}
              <div
                className="absolute w-3 h-3 bg-[#00636b] rounded-full z-20 shadow-xs"
                style={{ top: "calc(50% - 6px)", left: "calc(50% - 6px)" }}
              />

              {/* Clock Hand Pointer */}
              <div
                className="absolute z-10 origin-bottom transition-transform duration-200 ease-out"
                style={{
                  width: "2px",
                  height: `${radius}px`,
                  backgroundColor: "#00636b",
                  left: "calc(50% - 1px)",
                  bottom: "50%",
                  transform: `rotate(${currentAngle}deg)`,
                }}
              >
                {/* Pointer tip head */}
                <div
                  className="w-8 h-8 rounded-full bg-[#00636b] -translate-x-[15px] -translate-y-4 shadow-sm"
                />
              </div>

              {/* Hour Numbers on Circle */}
              {mode === "hour" &&
                hoursList.map((h) => {
                  const angleRad = ((h * 30 - 90) * Math.PI) / 180;
                  const x = center + radius * Math.cos(angleRad) - 16;
                  const y = center + radius * Math.sin(angleRad) - 16;
                  const isSelected = currentHourNum === h;

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        const hStr = h.toString().padStart(2, "0");
                        setSelectedHour(hStr);
                        // Auto-advance to minute mode
                        setTimeout(() => setMode("minute"), 150);
                      }}
                      style={{ top: `${y}px`, left: `${x}px` }}
                      className={cn(
                        "absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-20 transition",
                        isSelected
                          ? "text-white font-bold"
                          : "text-slate-700 hover:bg-teal-100/60"
                      )}
                    >
                      {h}
                    </button>
                  );
                })}

              {/* Minute Numbers on Circle */}
              {mode === "minute" &&
                minutesList.map((m) => {
                  const angleRad = ((m * 6 - 90) * Math.PI) / 180;
                  const x = center + radius * Math.cos(angleRad) - 16;
                  const y = center + radius * Math.sin(angleRad) - 16;
                  const isSelected = currentMinuteNum === m;

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMinute(m.toString().padStart(2, "0"));
                      }}
                      style={{ top: `${y}px`, left: `${x}px` }}
                      className={cn(
                        "absolute w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold z-20 transition",
                        isSelected
                          ? "text-white font-bold"
                          : "text-slate-700 hover:bg-teal-100/60"
                      )}
                    >
                      {m.toString().padStart(2, "0")}
                    </button>
                  );
                })}
            </div>

            {/* Manual Input Section Directly Below the Clock */}
            <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>ম্যানুয়াল ইনপুট (ক্লিক বা লিখুন)</span>
                <span className="text-[9px] text-[#00636b] font-medium">
                  {mode === "hour" ? "ঘণ্টা মোড" : "মিনিট মোড"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[9px] text-slate-400 mb-0.5">ঘণ্টা (১-১২)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={parseInt(selectedHour, 10) || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val)) setSelectedHour("01");
                      else if (val >= 1 && val <= 12) setSelectedHour(val.toString().padStart(2, "0"));
                    }}
                    onFocus={() => setMode("hour")}
                    className="w-full h-8 text-center text-xs font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
                  />
                </div>
                <span className="text-slate-400 font-bold text-sm mt-3">:</span>
                <div className="flex-1">
                  <label className="block text-[9px] text-slate-400 mb-0.5">মিনিট (০-৫৯)</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={parseInt(selectedMinute, 10) || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val)) setSelectedMinute("00");
                      else if (val >= 0 && val <= 59) setSelectedMinute(val.toString().padStart(2, "0"));
                    }}
                    onFocus={() => setMode("minute")}
                    className="w-full h-8 text-center text-xs font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[9px] text-slate-400 mb-0.5">সময়কাল</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as "AM" | "PM")}
                    className="w-full h-8 px-1 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#00636b]"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 text-[10px]">
                {["09:00 AM", "10:30 AM", "04:00 PM", "05:30 PM", "06:30 PM"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const parsed = parseTime(preset);
                      setSelectedHour(parsed.hour);
                      setSelectedMinute(parsed.minute);
                      setSelectedPeriod(parsed.period);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-[#00636b] hover:border-teal-300 shrink-0 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-1.5 text-xs font-bold bg-[#00636b] hover:bg-[#004e54] text-white rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
