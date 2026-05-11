'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts';
import { useMapStore } from '@/store/useMapStore';
import { INDICATORS } from '@/config/indicators';

interface RadarData {
  indicator: string;
  region: number;
  national: number;
  fullMark: number;
}

export default function RadarComparison() {
  const { nutsLevel, selectedRegion, activeYear } = useMapStore();
  const [data, setData] = useState<RadarData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedRegion) {
      setData([]);
      return;
    }

    async function fetchRadarData() {
      setLoading(true);
      try {
        // Fetch values for a fixed set of comprehensive indicators to build the profile
        const radarIndicators = ['population', 'unemployment', 'gdp', 'rd_expenditure', 'life_expectancy'];
        
        const regionScores: Record<string, number> = {};
        const nationalScores: Record<string, number> = {};
        const maxScores: Record<string, number> = {};

        // In a real scenario we'd do a batch API call. Doing serial or parallel calls here.
        await Promise.all(
          radarIndicators.map(async (ind) => {
            const res = await fetch(`/api/stats/all?indicator=${ind}&level=${nutsLevel}&year=${activeYear}`);
            if (res.ok) {
              const resData = await res.json();
              const values = resData.values.filter((v: any) => v.value !== null);
              
              if (values.length > 0) {
                const numericVals = values.map((v: any) => v.value);
                const max = Math.max(...numericVals);
                const avg = numericVals.reduce((a: number, b: number) => a + b, 0) / numericVals.length;
                const regionVal = values.find((v: any) => v.nutsCode === selectedRegion)?.value || 0;

                // Normalize scores to 0-100 scale for radar comparison
                regionScores[ind] = max > 0 ? (regionVal / max) * 100 : 0;
                nationalScores[ind] = max > 0 ? (avg / max) * 100 : 0;
                maxScores[ind] = 100;
              }
            }
          })
        );

        const formattedData: RadarData[] = radarIndicators.map((ind) => {
          const label = INDICATORS.find(i => i.id === ind)?.labelPt || ind;
          return {
            indicator: label,
            region: regionScores[ind] || 0,
            national: nationalScores[ind] || 0,
            fullMark: 100
          };
        });

        setData(formattedData);
      } catch (err) {
        console.error('Failed to load radar data', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRadarData();
  }, [selectedRegion, nutsLevel, activeYear]);

  if (!selectedRegion) return null;

  return (
    <div className="radar-section mt-6 pt-6 border-t border-[#2a2a3a]">
      <h3 className="section-title text-[14px] font-semibold text-[#e8e8ed] mb-1">Perfil da Região</h3>
      <p className="section-desc text-[11px] text-[#8888a0] mb-4">
        Comparação percentual contra o máximo e média Nacional
      </p>

      {loading ? (
        <div className="h-[250px] w-full animate-pulse bg-[#1a1a28] rounded-lg"></div>
      ) : data.length > 0 ? (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#2a2a3a" />
              <PolarAngleAxis 
                dataKey="indicator" 
                tick={{ fill: '#8888a0', fontSize: 10 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={false} 
                axisLine={false} 
              />
              <Radar
                name="Região Selecionada"
                dataKey="region"
                stroke="#4f8cff"
                fill="#4f8cff"
                fillOpacity={0.5}
              />
              <Radar
                name="Média Nacional"
                dataKey="national"
                stroke="#a78bfa"
                fill="#a78bfa"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  background: '#12121a',
                  border: '1px solid #2a2a3a',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#e8e8ed',
                }}
                formatter={(val: any) => [`${Number(val).toFixed(1)}% (relativo ao máx)`]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#8888a0' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-[11px] text-center text-[#8888a0] py-4">Sem dados para este ano.</p>
      )}
    </div>
  );
}
