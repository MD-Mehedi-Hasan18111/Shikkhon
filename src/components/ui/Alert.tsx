import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-xs transition-colors flex items-start gap-3",
  {
    variants: {
      variant: {
        info: "border-[#d7eef1] bg-[#eff8f9] text-[#004f56]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900",
        warning: "border-amber-200 bg-amber-50 text-amber-900",
        danger: "border-rose-200 bg-[#fdf2f2] text-[#991b1b]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  onDismiss,
  ...props
}: AlertProps) {
  const icons = {
    info: <Info className="h-4 w-4 text-[#00636b] shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="h-4 w-4 text-[#c22126] shrink-0 mt-0.5" />,
  };

  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {variant && icons[variant]}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold text-xs mb-0.5">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-0.5 transition"
          aria-label="বন্ধ করুন"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
