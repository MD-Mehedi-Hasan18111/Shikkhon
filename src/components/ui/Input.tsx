import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || (label ? `input-${generatedId}` : undefined);
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const isDate = type === "date";
    const effectiveLeftIcon =
      leftIcon || (isDate ? <Calendar className="h-4 w-4 text-[#00636b]" /> : null);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 select-none"
          >
            {label}
          </label>
        )}
        <div
          onClick={() => {
            if (isDate && innerRef.current && typeof innerRef.current.showPicker === "function") {
              innerRef.current.showPicker();
            }
          }}
          className={cn("relative flex items-center", isDate && "cursor-pointer")}
        >
          {effectiveLeftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {effectiveLeftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors shadow-2xs focus:border-[#00636b] focus:outline-none focus:ring-1 focus:ring-[#00636b] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
              effectiveLeftIcon && "pl-9",
              rightIcon && "pr-9",
              isDate && "cursor-pointer",
              error && "border-[#c22126] focus:border-[#c22126] focus:ring-[#c22126]",
              className
            )}
            ref={(node) => {
              innerRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            aria-invalid={error ? "true" : "false"}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-[#c22126] font-medium" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
