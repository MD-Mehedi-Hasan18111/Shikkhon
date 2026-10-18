import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs = [],
  badge,
  action,
  actions,
  className,
}: PageHeaderProps) {
  const renderedSubtitle = subtitle || description;
  const renderedAction = actions || action;
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6",
        className
      )}
    >
      <div className="space-y-1.5">
        {/* Breadcrumb row */}
        {breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"
          >
            <Link
              href="/dashboard"
              className="hover:text-[#00636b] transition flex items-center gap-1"
            >
              <Home className="h-3 w-3" />
              <span>ড্যাশবোর্ড</span>
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#00636b] transition">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title and optional Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>

        {/* Subtitle */}
        {renderedSubtitle && (
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            {renderedSubtitle}
          </p>
        )}
      </div>

      {/* Action buttons slot */}
      {renderedAction && (
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          {renderedAction}
        </div>
      )}
    </div>
  );
}
