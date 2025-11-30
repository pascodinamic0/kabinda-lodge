import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DivideIcon as LucideIcon } from 'lucide-react';

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

// Gradient mapping for Tailwind classes (must be predefined for JIT compiler)
const gradientMap: Record<string, { from: string; to: string }> = {
  'blue-500-blue-600': { from: 'from-blue-500', to: 'to-blue-600' },
  'indigo-500-indigo-600': { from: 'from-indigo-500', to: 'to-indigo-600' },
  'emerald-500-emerald-600': { from: 'from-emerald-500', to: 'to-emerald-600' },
  'orange-400-orange-500': { from: 'from-orange-400', to: 'to-orange-500' },
  'purple-500-purple-600': { from: 'from-purple-500', to: 'to-purple-600' },
  'pink-500-pink-600': { from: 'from-pink-500', to: 'to-pink-600' },
  'red-500-red-600': { from: 'from-red-500', to: 'to-red-600' },
  'green-500-green-600': { from: 'from-green-500', to: 'to-green-600' },
  'yellow-500-yellow-600': { from: 'from-yellow-500', to: 'to-yellow-600' },
  'cyan-500-cyan-600': { from: 'from-cyan-500', to: 'to-cyan-600' },
  'teal-500-teal-600': { from: 'from-teal-500', to: 'to-teal-600' },
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
  // Get gradient classes from mapping
  const gradientKey = `${gradientFrom}-${gradientTo}`;
  const gradientClasses = gradientMap[gradientKey];
  
  // If gradient classes are not in the map, use inline styles
  const gradientStyle = !gradientClasses ? {
    background: `linear-gradient(to bottom right, ${getColorValue(gradientFrom)}, ${getColorValue(gradientTo)})`,
  } as React.CSSProperties : undefined;

  return (
    <Card 
      className={cn(
        "bg-gradient-to-br border-none shadow-lg",
        gradientClasses?.from,
        gradientClasses?.to,
        className
      )}
      style={gradientStyle}
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

// Helper function to convert Tailwind color names to hex values
function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    'blue-500': '#3b82f6',
    'blue-600': '#2563eb',
    'indigo-500': '#6366f1',
    'indigo-600': '#4f46e5',
    'emerald-500': '#10b981',
    'emerald-600': '#059669',
    'orange-400': '#fb923c',
    'orange-500': '#f97316',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'pink-500': '#ec4899',
    'pink-600': '#db2777',
    'red-500': '#ef4444',
    'red-600': '#dc2626',
    'green-500': '#22c55e',
    'green-600': '#16a34a',
    'yellow-500': '#eab308',
    'yellow-600': '#ca8a04',
    'cyan-500': '#06b6d4',
    'cyan-600': '#0891b2',
    'teal-500': '#14b8a6',
    'teal-600': '#0d9488',
  };
  
  return colorMap[color] || '#3b82f6'; // Default to blue-500
}










