'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useMapStore } from '@/store/useMapStore';
import { INDICATORS } from '@/config/indicators';
import type { CorrelationResult, ScatterPoint } from '@/lib/correlations';

interface CompareResponse {
  xIndicator: { id: string; label: string; unit: string };
  yIndicator: { id: string; label: string; unit: string };
  scatterData: ScatterPoint[];
  correlation: CorrelationResult;
}

export default function CorrelationPlot() {
  const { nutsLevel, selectedRegion } = useMapStore();
  const [xIndicator, setXIndicator] = useState('population');
  const [yIndicator, setYIndicator] = useState('unemployment');
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (xIndicator === yIndicator) return;

    async function fetchCorrelation() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/compare?x=${xIndicator}&y=${yIndicator}&level=${nutsLevel}`
        );
        if (!res.ok) throw new Error('Correlation fetch failed');
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCorrelation();
  }, [xIndicator, yIndicator, nutsLevel]);

  const significanceColor = (sig: string) => {
    switch (sig) {
      case 'strong': return '#4ade80';
      case 'moderate': return '#fbbf24';
      case 'weak': return '#f87171';
      default: return '#555570';
    }
  };

  const significanceLabel = (sig: string) => {
    switch (sig) {
      case 'strong': return 'Forte';
      case 'moderate': return 'Moderada';
      case 'weak': return 'Fraca';
      default: return 'Nenhuma';
    }
  };

  return (
    <div className="correlation-section">
      <h3 className="section-title">Correlação</h3>
      <p className="section-desc">Compare dois indicadores entre regiões</p>

      <div className="correlation-selectors">
        <div className="selector-group">
          <label className="selector-label">Eixo X</label>
          <select
            className="selector-input"
            value={xIndicator}
            onChange={(e) => setXIndicator(e.target.value)}
          >
            {INDICATORS.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.labelPt}
              </option>
            ))}
          </select>
        </div>

        <span className="selector-vs">vs</span>

        <div className="selector-group">
          <label className="selector-label">Eixo Y</label>
          <select
            className="selector-input"
            value={yIndicator}
            onChange={(e) => setYIndicator(e.target.value)}
          >
            {INDICATORS.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.labelPt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {xIndicator === yIndicator && (
        <p className="correlation-warning">Selecione indicadores diferentes.</p>
      )}

      {loading && (
        <div className="correlation-loading">
          <div className="panel-skeleton" />
        </div>
      )}

      {!loading && data && xIndicator !== yIndicator && (
        <>
          {/* Correlation badge */}
          <div className="correlation-badge">
            <span className="corr-label">Pearson r =</span>
            <span
              className="corr-value"
              style={{ color: significanceColor(data.correlation.significance) }}
            >
              {data.correlation.r.toFixed(3)}
            </span>
            <span
              className="corr-sig"
              style={{ color: significanceColor(data.correlation.significance) }}
            >
              {significanceLabel(data.correlation.significance)}
            </span>
          </div>

          {/* Scatter chart */}
          <div className="correlation-chart">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a1a28"
                />
                <XAxis
                  dataKey="x"
                  type="number"
                  name={data.xIndicator.label}
                  tick={{ fill: '#8888a0', fontSize: 10 }}
                  axisLine={{ stroke: '#2a2a3a' }}
                  tickLine={false}
                  label={{
                    value: data.xIndicator.label,
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#8888a0',
                    fontSize: 10,
                  }}
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  name={data.yIndicator.label}
                  tick={{ fill: '#8888a0', fontSize: 10 }}
                  axisLine={{ stroke: '#2a2a3a' }}
                  tickLine={false}
                  width={50}
                  label={{
                    value: data.yIndicator.label,
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    fill: '#8888a0',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#12121a',
                    border: '1px solid #2a2a3a',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#e8e8ed',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any, name: any) => [
                    typeof val === 'number' ? val.toLocaleString('pt-PT') : String(val),
                    name,
                  ]}
                  labelFormatter={() => ''}
                  cursor={{ strokeDasharray: '3 3', stroke: '#555570' }}
                />
                <Scatter
                  data={data.scatterData}
                  fill="#4f8cff"
                  fillOpacity={0.8}
                  r={5}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  shape={(props: any) => {
                    const isSelected = props.payload?.code === selectedRegion;
                    return (
                      <circle
                        cx={props.cx || 0}
                        cy={props.cy || 0}
                        r={isSelected ? 8 : 5}
                        fill={isSelected ? '#ff6b4a' : '#4f8cff'}
                        fillOpacity={0.85}
                        stroke={isSelected ? '#ff6b4a' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  }}
                />
                {data.correlation.significance !== 'none' && (
                  <ReferenceLine
                    segment={getRegressionLine(data.scatterData, data.correlation)}
                    stroke="#a78bfa"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    ifOverflow="extendDomain"
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function getRegressionLine(
  points: ScatterPoint[],
  corr: CorrelationResult
): [{ x: number; y: number }, { x: number; y: number }] {
  const xVals = points.map((p) => p.x);
  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);

  return [
    { x: minX, y: corr.slope * minX + corr.intercept },
    { x: maxX, y: corr.slope * maxX + corr.intercept },
  ];
}
