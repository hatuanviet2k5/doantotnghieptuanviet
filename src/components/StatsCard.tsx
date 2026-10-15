import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  color?: 'blue' | 'green' | 'amber' | 'rose' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue',
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      glow: 'shadow-blue-500/10',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      glow: 'shadow-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      glow: 'shadow-amber-500/10',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      glow: 'shadow-rose-500/10',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      glow: 'shadow-purple-500/10',
    },
  };

  const style = colorStyles[color];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border ${style.border} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={`rounded-xl p-3 ${style.bg} ${style.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full ${
              trend.isPositive !== false
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'bg-rose-50 text-rose-700 font-semibold'
            }`}
          >
            {trend.value}
          </span>
          {trend.label && <span className="ml-2 text-slate-400">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
