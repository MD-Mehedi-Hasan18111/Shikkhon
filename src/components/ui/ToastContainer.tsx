"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { removeNotification, ToastNotification } from "@/store/slices/notificationSlice";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

function ToastItem({ toast }: { toast: ToastNotification }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(toast.id));
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      borderAccent: "border-l-4 border-l-emerald-600",
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200",
      borderAccent: "border-l-4 border-l-rose-600",
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
      borderAccent: "border-l-4 border-l-amber-500",
    },
    info: {
      icon: <Info className="h-5 w-5 text-[#00636b] shrink-0" />,
      iconBg: "bg-teal-50 text-[#00636b] border border-teal-200",
      borderAccent: "border-l-4 border-l-[#00636b]",
    },
  };

  const config = typeConfig[toast.type] || typeConfig.info;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm p-4 rounded-xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/20 transition-all animate-in fade-in-0 slide-in-from-top-3 duration-200 select-none",
        config.borderAccent
      )}
    >
      <div className={cn("p-1.5 rounded-lg shrink-0", config.iconBg)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h4 className="text-sm font-bold text-slate-900 mb-0.5 leading-snug">
            {toast.title}
          </h4>
        )}
        <p className="text-xs font-semibold text-slate-700 leading-relaxed">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => dispatch(removeNotification(toast.id))}
        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition shrink-0"
        aria-label="বন্ধ করুন"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const notifications = useAppSelector((state) => state.notifications.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto">
      {notifications.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
