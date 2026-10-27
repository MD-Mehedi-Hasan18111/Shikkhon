"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionDropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: (e?: React.MouseEvent) => void;
  variant?: "default" | "danger" | "warning" | "primary" | "success";
  disabled?: boolean;
  hidden?: boolean;
  title?: string;
}

export interface ActionDropdownProps {
  items: ActionDropdownItem[];
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export function ActionDropdown({
  items,
  align = "right",
  className,
  buttonClassName,
  ariaLabel = "অ্যাকশন অপশন",
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top?: number; bottom?: number; right?: number; left?: number }>({});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const visibleItems = items.filter((item) => !item.hidden);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 220 && rect.top > 220;

    const newCoords: { top?: number; bottom?: number; right?: number; left?: number } = {};

    if (openUpwards) {
      newCoords.bottom = window.innerHeight - rect.top + 6;
    } else {
      newCoords.top = rect.bottom + 6;
    }

    if (align === "right") {
      newCoords.right = Math.max(8, window.innerWidth - rect.right);
    } else {
      newCoords.left = Math.max(8, rect.left);
    }

    setCoords(newCoords);
  }, [align]);

  React.useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      // If user scrolls within the menu itself, do not close
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  if (visibleItems.length === 0) return null;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const getVariantStyles = (variant?: ActionDropdownItem["variant"], disabled?: boolean) => {
    if (disabled) {
      return "text-slate-400 cursor-not-allowed opacity-60";
    }
    switch (variant) {
      case "danger":
        return "text-rose-600 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100";
      case "warning":
        return "text-amber-600 hover:text-amber-700 hover:bg-amber-50 active:bg-amber-100";
      case "success":
        return "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100";
      case "primary":
        return "text-[#00636b] hover:text-[#004f55] hover:bg-[#00636b]/10 active:bg-[#00636b]/20";
      default:
        return "text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200";
    }
  };

  const getIconColor = (variant?: ActionDropdownItem["variant"], disabled?: boolean) => {
    if (disabled) return "text-slate-400";
    switch (variant) {
      case "danger":
        return "text-rose-500";
      case "warning":
        return "text-amber-500";
      case "success":
        return "text-emerald-600";
      case "primary":
        return "text-[#00636b]";
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className={cn("inline-flex items-center justify-end relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00636b]/20 transition-all",
          isOpen && "bg-slate-100 text-slate-900 shadow-sm",
          buttonClassName
        )}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            style={{
              position: "fixed",
              top: coords.top !== undefined ? `${coords.top}px` : "auto",
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
              left: coords.left !== undefined ? `${coords.left}px` : "auto",
              right: coords.right !== undefined ? `${coords.right}px` : "auto",
              zIndex: 9999,
            }}
            className="w-52 max-w-[90vw] py-1.5 bg-white rounded-xl shadow-xl border border-slate-200/90 text-xs font-medium animate-in fade-in zoom-in-95 duration-100 select-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {visibleItems.map((item, index) => (
              <button
                key={`${item.label}-${index}`}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.title}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.disabled) return;
                  setIsOpen(false);
                  item.onClick(e);
                }}
                className={cn(
                  "w-full px-3.5 py-2.5 flex items-center gap-2.5 transition-colors text-left",
                  getVariantStyles(item.variant, item.disabled)
                )}
              >
                {item.icon && (
                  <span className={cn("w-4 h-4 shrink-0 flex items-center justify-center", getIconColor(item.variant, item.disabled))}>
                    {item.icon}
                  </span>
                )}
                <span className="truncate flex-1">{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
