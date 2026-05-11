'use client';

interface MapTooltipProps {
  data: {
    name: string;
    code: string;
    value: number | null;
    year: number;
    unit: string;
    indicator: string;
  };
}

export default function MapTooltip({ data }: MapTooltipProps) {
  return (
    <div className="map-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-name">{data.name}</span>
        <span className="tooltip-code">{data.code}</span>
      </div>
      <div className="tooltip-body">
        <span className="tooltip-indicator">{data.indicator}</span>
        <span className="tooltip-value">
          {data.value !== null ? formatValue(data.value, data.unit) : 'N/D'}
        </span>
        {data.year > 0 && (
          <span className="tooltip-year">{data.year}</span>
        )}
      </div>
    </div>
  );
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit.includes('per capita') || unit.includes('per 100k')) {
    return `${value.toLocaleString('pt-PT')} ${unit}`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ${unit}`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K ${unit}`;
  }
  return `${value.toLocaleString('pt-PT')} ${unit}`;
}
