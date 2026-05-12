'use client';

import { useMemo } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { INDICATORS } from '@/config/indicators';

interface AIAdvancedChartProps {
  config: {
    type: string;
    xAxis: string;
    yAxis: string;
  };
}

export default function AIAdvancedChart({ config }: AIAdvancedChartProps) {
  const { indicatorValues, nutsLevel } = useMapStore();

  const chartData = useMemo(() => {
    if (!config.xAxis || !config.yAxis) return [];
    
    const xValues = indicatorValues[config.xAxis] || [];
    const yValues = indicatorValues[config.yAxis] || [];

    // Combine data by NUTS code
    const dataMap = new Map<string, any>();
    
    xValues.forEach(v => {
      // Filter by current nuts level
      if (v.nutsCode.length === (nutsLevel === 1 ? 3 : nutsLevel === 2 ? 4 : 5)) {
        dataMap.set(v.nutsCode, { nutsCode: v.nutsCode, x: v.value });
      }
    });

    yValues.forEach(v => {
      const existing = dataMap.get(v.nutsCode);
      if (existing) {
        existing.y = v.value;
      }
    });

    // Filter out items without both x and y
    return Array.from(dataMap.values()).filter(d => d.x !== null && d.x !== undefined && d.y !== null && d.y !== undefined);
  }, [config.xAxis, config.yAxis, indicatorValues, nutsLevel]);

  const xLabel = INDICATORS.find(i => i.id === config.xAxis)?.labelPt || config.xAxis;
  const yLabel = INDICATORS.find(i => i.id === config.yAxis)?.labelPt || config.yAxis;

  if (chartData.length === 0) {
    return <div className="text-xs text-[#8888a0] mt-4 italic">A preparar dados do gráfico...</div>;
  }

  return (
    <div className="mt-4 p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
      <h4 className="text-[11px] font-semibold text-[#e8e8ed] mb-1 uppercase tracking-wider">
        Gráfico de Correlação Gerado por AI
      </h4>
      <p className="text-[10px] text-[#8888a0] mb-4">
        {xLabel} vs {yLabel}
      </p>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name={xLabel}
              tick={{ fill: '#8888a0', fontSize: 10 }}
              axisLine={{ stroke: '#2a2a3a' }}
              tickLine={false}
              tickFormatter={(v) => v > 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={yLabel}
              tick={{ fill: '#8888a0', fontSize: 10 }}
              axisLine={{ stroke: '#2a2a3a' }}
              tickLine={false}
              tickFormatter={(v) => v > 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            <ZAxis type="category" dataKey="nutsCode" name="Região" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '11px' }}
              itemStyle={{ color: '#e8e8ed' }}
            />
            <Scatter name="Correlação" data={chartData} fill="#4f8cff" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
