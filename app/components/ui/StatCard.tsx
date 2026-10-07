"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "./Card";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNegative?: boolean;
    label?: string;
  };
  subtitle?: string;
  badgeColor?: "indigo" | "teal" | "emerald" | "amber" | "rose";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  badgeColor = "indigo",
}) => {
  const iconBgClasses = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50",
  };

  return (
    <Card hoverable className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className={`p-2.5 rounded-xl ${iconBgClasses[badgeColor]}`}>
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </span>

          {trend && (
            <div
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : trend.isNegative
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1 stroke-[2.5]" />
              ) : trend.isNegative ? (
                <TrendingDown className="w-3 h-3 mr-1 stroke-[2.5]" />
              ) : (
                <Minus className="w-3 h-3 mr-1 stroke-[2.5]" />
              )}
              {trend.value}
            </div>
          )}
        </div>

        {(subtitle || trend?.label) && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {trend?.label || subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
