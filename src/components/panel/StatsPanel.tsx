'use client';

import { useEffect, useState } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { getNutsName } from '@/lib/nuts';
import RegionHeader from './RegionHeader';
import IndicatorCard from './IndicatorCard';
import CorrelationPlot from './CorrelationPlot';
import AIInsights from './AIInsights';
import RadarComparison from './RadarComparison';
import SavedAnalysesList from '@/components/auth/SavedAnalysesList';

interface RegionData {
  nutsCode: string;
  indicators: Record<
    string,
    {
      id: string;
      value: number | null;
      year: number;
      unit: string;
      labelPt: string;
      timeSeries: { year: number; value: number | null }[];
    }
  >;
}

export default function StatsPanel() {
  const { selectedRegion, isPanelOpen, setPanelOpen, nutsLevel } = useMapStore();
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'archive'>('overview');

  useEffect(() => {
    if (!selectedRegion) {
      setRegionData(null);
      return;
    }

    async function fetchRegionStats() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/stats/${selectedRegion}?level=${nutsLevel}`
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRegionData(data);
      } catch (err) {
        console.error('Failed to fetch region stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRegionStats();
  }, [selectedRegion, nutsLevel]);

  if (!isPanelOpen || !selectedRegion) return null;

  return (
    <div className={`stats-panel ${isPanelOpen ? 'open' : ''}`}>
      <button
        className="panel-close"
        onClick={() => setPanelOpen(false)}
        aria-label="Fechar painel"
      >
        ✕
      </button>

      <RegionHeader
        name={getNutsName(selectedRegion)}
        code={selectedRegion}
        loading={loading}
      />

      {loading && (
        <div className="panel-loading">
          <div className="panel-skeleton" />
          <div className="panel-skeleton short" />
          <div className="panel-skeleton" />
          <div className="panel-skeleton short" />
        </div>
      )}

      {!loading && regionData && (
        <>
          <div className="flex border-b border-[#2a2a3a] mb-4 mt-2">
            <button 
              className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-[#4f8cff] text-[#e8e8ed]' : 'border-transparent text-[#8888a0] hover:text-[#e8e8ed]'}`}
              onClick={() => setActiveTab('overview')}
            >
              Visão Geral
            </button>
            <button 
              className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${activeTab === 'compare' ? 'border-[#4f8cff] text-[#e8e8ed]' : 'border-transparent text-[#8888a0] hover:text-[#e8e8ed]'}`}
              onClick={() => setActiveTab('compare')}
            >
              Análise Avançada
            </button>
            <button 
              className={`flex-1 py-2 text-[11px] font-medium transition-colors border-b-2 ${activeTab === 'archive' ? 'border-[#4f8cff] text-[#e8e8ed]' : 'border-transparent text-[#8888a0] hover:text-[#e8e8ed]'}`}
              onClick={() => setActiveTab('archive')}
            >
              Arquivo
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <AIInsights />
              <div className="panel-divider" />
              <div className="indicator-grid">
                {Object.values(regionData.indicators).map((ind) => (
                  <IndicatorCard
                    key={ind.id}
                    id={ind.id}
                    label={ind.labelPt}
                    value={ind.value}
                    unit={ind.unit}
                    year={ind.year}
                    timeSeries={ind.timeSeries}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === 'compare' && (
            <>
              <RadarComparison />
              <div className="panel-divider" />
              <CorrelationPlot />
            </>
          )}

          {activeTab === 'archive' && (
            <SavedAnalysesList />
          )}
        </>
      )}
    </div>
  );
}
