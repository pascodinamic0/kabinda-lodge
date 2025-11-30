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
  return (
    <Card className={cn(
      `bg-gradient-to-br from-${gradientFrom} to-${gradientTo} border-none shadow-lg`,
      className
    )}>
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









