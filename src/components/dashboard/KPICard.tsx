import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  subtext?: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  iconColor?: string;
  textColor?: string;
  subtextColor?: string;
}

// Color mapping for Tailwind colors to hex values
const colorMap: Record<string, string> = {
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'orange-400': '#fb923c',
  'orange-500': '#f97316',
};

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtext,
  className,
  gradientFrom = "blue-500",
  gradientTo = "blue-600",
  iconColor = "text-white/80",
  textColor = "text-white",
  subtextColor = "text-white/80"
}: KPICardProps) {
  // Get hex colors for gradient
  const fromColor = colorMap[gradientFrom] || colorMap['blue-500'];
  const toColor = colorMap[gradientTo] || colorMap['blue-600'];

  return (
    <Card 
      className={cn("border-none shadow-lg", className)}
      style={{
        background: `linear-gradient(to bottom right, ${fromColor}, ${toColor})`
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-sm font-medium flex items-center justify-between", textColor)}>
          <span className="opacity-90">{title}</span>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", textColor)}>{value}</div>
        {(trend || subtext) && (
          <div className={cn("flex items-center gap-2 mt-2 text-sm", subtextColor)}>
            {trend && (
              <span className={cn(
                "flex items-center font-medium",
                trend.isPositive === false ? "text-red-200" : "text-green-200"
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}









