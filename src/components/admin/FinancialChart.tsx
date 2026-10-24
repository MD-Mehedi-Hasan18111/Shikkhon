"use client";

import React, { useState } from "react";
import { TrendingUp, AlertCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { toBanglaNumber } from "@/lib/utils";

export interface MonthlyTrendItem {
  month: number;
  monthName: string;
  collection: number;
  due: number;
  payable: number;
}

interface FinancialChartProps {
  data: MonthlyTrendItem[];
  year: number;
  totalYearlyCollection: number;
  totalYearlyDue: number;
}

export function FinancialChart({
  data,
  year,
  totalYearlyCollection,
  totalYearlyDue,
}: FinancialChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.collection, d.due, d.payable)),
    10000 // Minimum scale base
  );

  const totalYearly = totalYearlyCollection + totalYearlyDue;
  const collectionRate =
    totalYearly > 0 ? Math.round((totalYearlyCollection / totalYearly) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Chart Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#00636b]" />
            <span className="text-xs font-medium text-slate-700">
              মোট আদায়:{" "}
              <strong className="text-teal-900 font-bold">
                ৳{toBanglaNumber(totalYearlyCollection.toLocaleString("bn-BD"))}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-xs font-medium text-slate-700">
              মোট বকেয়া:{" "}
              <strong className="text-rose-600 font-bold">
                ৳{toBanglaNumber(totalYearlyDue.toLocaleString("bn-BD"))}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-full text-xs font-bold text-[#00636b]">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>আদায় হার: {toBanglaNumber(collectionRate)}%</span>
        </div>
      </div>

      {/* SVG / Bar Chart Area */}
      <div className="relative pt-6 pb-2">
        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-20 bg-slate-900 text-white text-[11px] rounded-xl px-3 py-2 shadow-xl border border-slate-700 pointer-events-none transition-all duration-100 transform -translate-x-1/2 -top-1"
            style={{
              left: `${((hoveredIndex + 0.5) / 12) * 100}%`,
            }}
          >
            <div className="font-bold text-teal-300 pb-1 border-b border-slate-700 mb-1">
              {data[hoveredIndex].monthName} {toBanglaNumber(year)}
            </div>
            <div className="flex justify-between gap-3 text-emerald-400">
              <span>আদায়:</span>
              <span className="font-bold">
                ৳{toBanglaNumber(data[hoveredIndex].collection.toLocaleString("bn-BD"))}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-rose-300">
              <span>বকেয়া:</span>
              <span className="font-bold">
                ৳{toBanglaNumber(data[hoveredIndex].due.toLocaleString("bn-BD"))}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-slate-300 pt-1 border-t border-slate-800 font-semibold mt-1">
              <span>মোট ডিমান্ড:</span>
              <span>
                ৳{toBanglaNumber(data[hoveredIndex].payable.toLocaleString("bn-BD"))}
              </span>
            </div>
          </div>
        )}

        {/* 12-Month Bar Grid */}
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 items-end h-52 px-1 border-b border-slate-200">
          {data.map((item, idx) => {
            const collectionHeight = Math.max(4, Math.round((item.collection / maxVal) * 100));
            const dueHeight = Math.max(4, Math.round((item.due / maxVal) * 100));
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.month}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group flex flex-col items-center justify-end h-full cursor-pointer relative"
              >
                {/* Bars Container */}
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-1">
                  {/* Collection Bar */}
                  <div
                    style={{ height: `${item.collection > 0 ? collectionHeight : 3}%` }}
                    className={`w-1/2 rounded-t-md transition-all duration-200 ${
                      item.collection > 0
                        ? isHovered
                          ? "bg-teal-700 shadow-md scale-y-105"
                          : "bg-[#00636b] hover:bg-teal-700"
                        : "bg-slate-200/60"
                    }`}
                  />
                  {/* Due Bar */}
                  <div
                    style={{ height: `${item.due > 0 ? dueHeight : 3}%` }}
                    className={`w-1/2 rounded-t-md transition-all duration-200 ${
                      item.due > 0
                        ? isHovered
                          ? "bg-rose-600 shadow-md scale-y-105"
                          : "bg-rose-500 hover:bg-rose-600"
                        : "bg-slate-200/60"
                    }`}
                  />
                </div>

                {/* Month Name Below Bar */}
                <div
                  className={`mt-2 text-[10px] text-center font-medium transition-colors truncate w-full ${
                    isHovered ? "text-[#00636b] font-bold" : "text-slate-500"
                  }`}
                  title={item.monthName}
                >
                  {item.monthName.slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
