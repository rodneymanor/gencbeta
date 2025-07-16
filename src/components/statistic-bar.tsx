"use client";

import { LucideIcon } from "lucide-react";

interface Metric {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface StatisticBarProps {
  metrics: Metric[];
  className?: string;
}

export function StatisticBar({ metrics, className = "" }: StatisticBarProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
            <metric.icon className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-semibold">{metric.value}</span>
            <span className="text-muted-foreground text-xs">{metric.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
