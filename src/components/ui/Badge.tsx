import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium border transition-colors select-none",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-slate-100 text-slate-700",
        secondary: "border-slate-200 bg-slate-100 text-slate-700",
        primary: "border-[#d7eef1] bg-[#eff8f9] text-[#00636b]",
        gold: "border-[#fde68a] bg-[#fef9ee] text-[#aa651d]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        danger: "border-rose-200 bg-[#fdf2f2] text-[#c22126]",
        lime: "border-lime-200 bg-lime-50 text-lime-800",
        outline: "border-slate-300 bg-white text-slate-700",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            variant === "primary" && "bg-[#00636b]",
            variant === "success" && "bg-emerald-600",
            variant === "gold" && "bg-[#aa651d]",
            variant === "danger" && "bg-[#c22126]",
            variant === "warning" && "bg-amber-500",
            (!variant || variant === "default" || variant === "outline") && "bg-slate-400"
          )}
        />
      )}
      {children}
    </div>
  );
}
