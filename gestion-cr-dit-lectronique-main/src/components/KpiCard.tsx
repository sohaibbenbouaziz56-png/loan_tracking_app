import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDZD, LTR } from '@/lib/formatters';
import { Info } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number;
  tooltip: string;
  type: 'money' | 'percent' | 'count';
  colorVariant?: 'blue' | 'green' | 'amber' | 'red';
}

export default function KpiCard({ label, value, tooltip, type, colorVariant = 'blue' }: KpiCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const accentClass = `kpi-card-accent-${colorVariant}`;

  let displayValue: React.ReactNode;
  if (type === 'money') {
    displayValue = <LTR>{formatDZD(value)}</LTR>;
  } else if (type === 'percent') {
    displayValue = <LTR>{value.toFixed(1)}%</LTR>;
  } else {
    displayValue = <LTR>{value}</LTR>;
  }

  let valueColor = 'text-foreground';
  if (type === 'percent') {
    if (value > 20) valueColor = 'text-success';
    else if (value >= 10) valueColor = 'text-warning';
    else valueColor = 'text-destructive';
  }
  if (type === 'count' && colorVariant === 'red') valueColor = 'text-destructive';
  if (type === 'count' && colorVariant === 'amber') valueColor = 'text-warning';
  if (type === 'count' && colorVariant === 'green') valueColor = 'text-success';

  return (
    <div className={`kpi-card ${accentClass}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          {showTooltip && (
            <div className="absolute z-50 bottom-full right-0 mb-2 w-64 p-3 bg-foreground text-background text-xs rounded-lg shadow-lg" dir="auto">
              {tooltip}
            </div>
          )}
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{displayValue}</p>
    </div>
  );
}
