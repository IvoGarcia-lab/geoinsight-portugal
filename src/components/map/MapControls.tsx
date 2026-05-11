'use client';

import { useMapStore } from '@/store/useMapStore';
import type { NutsLevel } from '@/types/indicators';
import { INDICATOR_MAP } from '@/config/indicators';

interface MapControlsProps {
  breaks: { min: number; max: number; color: string }[];
  indicatorLabel: string;
  unit: string;
}

export default function MapControls({
  breaks,
  indicatorLabel,
  unit,
}: MapControlsProps) {
  const { 
    nutsLevel, setNutsLevel, 
    isSplitView, toggleSplitView,
    scaleType, setScaleType,
    overlayMode, setOverlayMode,
    secondaryIndicator, setSecondaryIndicator
  } = useMapStore();

  const levels: { value: NutsLevel; label: string }[] = [
    { value: 2, label: 'NUTS II' },
    { value: 3, label: 'NUTS III' },
  ];

  return (
    <div className="map-controls">
      {/* NUTS Level Toggle */}
      <div className="control-group">
        <span className="control-label">Granularidade</span>
        <div className="control-toggle">
          {levels.map((l) => (
            <button
              key={l.value}
              className={`toggle-btn ${nutsLevel === l.value ? 'active' : ''}`}
              onClick={() => setNutsLevel(l.value)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="control-group">
        <span className="control-label">Vista</span>
        <button
          className={`toggle-btn w-full justify-center ${isSplitView ? 'active' : ''}`}
          onClick={() => toggleSplitView()}
        >
          {isSplitView ? '🗺️🗺️ Comparar' : '🗺️ Mapa Único'}
        </button>
      </div>

      {/* Advanced Map Toggles */}
      <div className="control-group">
        <span className="control-label">Opções de Mapa</span>
        <select 
          className="selector-input text-[10px] w-full mb-2 bg-[#1a1a28] text-gray-300 border border-[#2a2a3a] p-1 rounded"
          value={scaleType} 
          onChange={e => setScaleType(e.target.value as any)}
        >
          <option value="quantile">Escala: Quantil</option>
          <option value="linear">Escala: Linear</option>
          <option value="log">Escala: Logarítmica</option>
        </select>
        
        <select 
          className="selector-input text-[10px] w-full bg-[#1a1a28] text-gray-300 border border-[#2a2a3a] p-1 rounded"
          value={overlayMode} 
          onChange={e => setOverlayMode(e.target.value as any)}
        >
          <option value="none">Modo: Padrão (1 Var)</option>
          <option value="bivariate">Modo: Bivariado (2 Vars)</option>
          <option value="bubbles">Modo: Símbolos/Bolhas</option>
        </select>

        {overlayMode !== 'none' && (
          <div className="mt-2 pt-2 border-t border-[#2a2a3a]">
            <span className="control-label">Indicador Secundário</span>
            <select 
              className="selector-input text-[10px] w-full bg-[#1a1a28] text-[#8888a0] border border-[#2a2a3a] p-1 rounded"
              value={secondaryIndicator} 
              onChange={e => setSecondaryIndicator(e.target.value)}
            >
              {Array.from(INDICATOR_MAP.values()).map(ind => (
                <option key={ind.id} value={ind.id}>{ind.labelPt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Legend */}
      {overlayMode === 'bivariate' ? (
        <div className="control-group legend">
           <span className="control-label">Legenda Bivariada</span>
           <div className="flex text-[9px] text-[#8888a0] items-center gap-2">
             <div className="flex flex-col text-right w-12">
               <span>Alto</span>
               <span className="text-[8px] truncate">{INDICATOR_MAP.get(secondaryIndicator)?.labelPt}</span>
               <span>Baixo</span>
             </div>
             <div className="grid grid-cols-3 grid-rows-3 w-16 h-16 gap-[1px]">
                {/* top row: high Y, low->high X */}
                <div style={{ backgroundColor: '#be64ac' }}></div>
                <div style={{ backgroundColor: '#8c62aa' }}></div>
                <div style={{ backgroundColor: '#3b4994' }}></div>
                {/* middle row: med Y, low->high X */}
                <div style={{ backgroundColor: '#dfb0d6' }}></div>
                <div style={{ backgroundColor: '#a5add3' }}></div>
                <div style={{ backgroundColor: '#5698b9' }}></div>
                {/* bottom row: low Y, low->high X */}
                <div style={{ backgroundColor: '#e8e8e8' }}></div>
                <div style={{ backgroundColor: '#ace4e4' }}></div>
                <div style={{ backgroundColor: '#5ac8c8' }}></div>
             </div>
           </div>
           <div className="text-[9px] text-center text-[#8888a0] mt-1 ml-12">
              Baixo → Alto<br/>
              <span className="text-[8px] truncate">{indicatorLabel}</span>
           </div>
        </div>
      ) : breaks.length > 0 && (
        <div className="control-group legend">
          <span className="control-label">{indicatorLabel}</span>
          <div className="legend-bar">
            {breaks.map((b, i) => (
              <div
                key={i}
                className="legend-segment"
                style={{ backgroundColor: b.color }}
                title={`${formatNumber(b.min)} — ${formatNumber(b.max)} ${unit}`}
              />
            ))}
          </div>
          <div className="legend-labels">
            <span>{formatNumber(breaks[0]?.min ?? 0)}</span>
            <span>{unit}</span>
            <span>{formatNumber(breaks[breaks.length - 1]?.max ?? 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(1);
}
