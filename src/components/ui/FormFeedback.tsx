import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormErrorMessage({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-1.5 text-xs text-[#c22126] font-medium mt-1 animate-in fade-in duration-150",
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function FormSuccessMessage({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-1 animate-in fade-in duration-150",
        className
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      <span>{message}</span>
    </div>
  );
}

export function FormHelperNote({
  note,
  className,
}: {
  note?: string;
  className?: string;
}) {
  if (!note) return null;
  return (
    <div
      className={cn("flex items-center gap-1.5 text-xs text-slate-500 mt-1", className)}
    >
      <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span>{note}</span>
    </div>
  );
}
