'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useMapStore } from '@/store/useMapStore';

interface IndicatorCardProps {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  year: number;
  timeSeries: { year: number; value: number | null }[];
}

export default function IndicatorCard({
  id,
  label,
  value,
  unit,
  year,
  timeSeries,
}: IndicatorCardProps) {
  const { activeIndicator, setActiveIndicator } = useMapStore();
  const isActive = activeIndicator === id;

  // Calculate trend
  const trend = useMemo(() => {
    const validValues = timeSeries.filter((v) => v.value !== null);
    if (validValues.length < 2) return null;
    const recent = validValues[validValues.length - 1].value!;
    const previous = validValues[validValues.length - 2].value!;
    if (previous === 0) return null;
    const change = ((recent - previous) / Math.abs(previous)) * 100;
    return change;
  }, [timeSeries]);

  const chartData = timeSeries.filter((v) => v.value !== null);

  return (
    <button
      className={`indicator-card ${isActive ? 'active' : ''}`}
      onClick={() => setActiveIndicator(id)}
      title={`Pintar mapa por: ${label}`}
    >
      <div className="card-top">
        <span className="card-label">{label}</span>
        {trend !== null && (
          <span
            className={`card-trend ${trend >= 0 ? 'positive' : 'negative'}`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="card-value-row">
        <span className="card-value">
          {value !== null ? formatValue(value) : 'N/D'}
        </span>
        <span className="card-unit">{unit}</span>
      </div>

      <span className="card-year">{year || '—'}</span>

      {chartData.length > 2 && (
        <div className="card-sparkline">
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isActive ? '#4f8cff' : '#555570'} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={isActive ? '#4f8cff' : '#555570'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isActive ? '#4f8cff' : '#555570'}
                strokeWidth={1.5}
                fill={`url(#grad-${id})`}
                dot={false}
                isAnimationActive={false}
              />
              <RechartsTooltip
                contentStyle={{
                  background: '#12121a',
                  border: '1px solid #2a2a3a',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#e8e8ed',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(val: any) => [typeof val === 'number' ? formatValue(val) : String(val), label]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={(l: any) => `${l}`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </button>
  );
}

function formatValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Number.isInteger(value)) return value.toLocaleString('pt-PT');
  return value.toFixed(1);
}
