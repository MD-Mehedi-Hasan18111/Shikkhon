import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00636b] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer border border-transparent shadow-xs active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary:
          "bg-[#00636b] text-white hover:bg-[#004f56] active:bg-[#003e44] shadow-sm",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200",
        gold: "bg-[#c27a29] text-white hover:bg-[#aa651d] shadow-sm",
        outline:
          "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900",
        danger: "bg-[#c22126] text-white hover:bg-[#a9171b] shadow-sm",
        ghost:
          "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-none",
        link: "text-[#00636b] underline-offset-4 hover:underline p-0 h-auto shadow-none font-normal",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        xs: "h-7 rounded-md px-2 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, isLoading = false, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
