"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { toBanglaNumber } from "@/lib/utils";
import { bn } from "@/config/bangla-strings";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  // Generate page numbers
  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-200 bg-white rounded-b-xl text-xs text-slate-600">
      {/* Range summary */}
      <div>
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            {bn.pagination.showing}{" "}
            <span className="font-semibold text-slate-800">
              {toBanglaNumber(startItem)}
            </span>{" "}
            {bn.pagination.to}{" "}
            <span className="font-semibold text-slate-800">
              {toBanglaNumber(endItem)}
            </span>{" "}
            {bn.pagination.of}{" "}
            <span className="font-semibold text-slate-800">
              {toBanglaNumber(totalItems)}
            </span>{" "}
            {bn.pagination.results}
          </span>
        ) : (
          <span>
            {bn.pagination.page}{" "}
            <span className="font-semibold text-slate-800">
              {toBanglaNumber(currentPage)}
            </span>{" "}
            {bn.pagination.of}{" "}
            <span className="font-semibold text-slate-800">
              {toBanglaNumber(totalPages)}
            </span>
          </span>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label={bn.pagination.previous}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>{bn.pagination.previous}</span>
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`dots-${idx}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                  p === currentPage
                    ? "bg-[#00636b] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-current={p === currentPage ? "page" : undefined}
              >
                {toBanglaNumber(p)}
              </button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label={bn.pagination.next}
        >
          <span>{bn.pagination.next}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
