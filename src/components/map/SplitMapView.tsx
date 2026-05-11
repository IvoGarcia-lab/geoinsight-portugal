'use client';

import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Layer, LeafletMouseEvent } from 'leaflet';
import { useMapStore } from '@/store/useMapStore';
import { INDICATOR_MAP } from '@/config/indicators';
import { createQuantizedScale, getSchemeForIndicator } from '@/lib/colors';
import { getNutsName } from '@/lib/nuts';
import { PORTUGAL_VIEW } from '@/types/geo';
import type { NutsFeature, NutsFeatureCollection } from '@/types/geo';
import MapControls from './MapControls';
import MapTooltip from './MapTooltip';
import TimeSlider from './TimeSlider';
import 'leaflet/dist/leaflet.css';

function MapUpdater({ nutsLevel }: { nutsLevel: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(PORTUGAL_VIEW.center, PORTUGAL_VIEW.zoom);
  }, [map, nutsLevel]);

  return null;
}

export default function SplitMapView() {
  const {
    geoData,
    activeIndicator,
    activeIndicatorRight,
    indicatorValues,
    selectedRegion,
    hoveredRegion,
    nutsLevel,
    isLoading,
    activeYear,
    setSelectedRegion,
    setHoveredRegion,
    setGeoData,
    setIndicatorValues,
    setLoading,
    setError,
    setActiveIndicatorRight,
    toggleSplitView,
  } = useMapStore();

  // Load Geo
  useEffect(() => {
    async function loadGeo() {
      if (!geoData || geoData.features.length === 0 || nutsLevel !== geoData.features[0].properties.LEVL_CODE) {
        setLoading(true);
        try {
          const res = await fetch(`/api/geo/${nutsLevel}`);
          if (!res.ok) throw new Error('Failed to load geo data');
          const data = await res.json();
          setGeoData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Geo load failed');
        } finally {
          setLoading(false);
        }
      }
    }
    loadGeo();
  }, [nutsLevel, setGeoData, setLoading, setError, geoData]);

  // Load both indicators
  useEffect(() => {
    async function loadIndicators() {
      const needed = [activeIndicator, activeIndicatorRight];
      
      for (const indicator of needed) {
        const cacheKey = `${indicator}-${activeYear}`;
        
        // We always fetch if we don't have this exact year
        setLoading(true);
        try {
          const res = await fetch(
            `/api/stats/all?indicator=${indicator}&level=${nutsLevel}&year=${activeYear}`
          );
          if (!res.ok) throw new Error(`Failed to load indicator ${indicator}`);
          const data = await res.json();
          setIndicatorValues(cacheKey, data.values);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Indicator load failed');
        } finally {
          setLoading(false);
        }
      }
    }
    loadIndicators();
  }, [activeIndicator, activeIndicatorRight, nutsLevel, activeYear, setIndicatorValues, setLoading, setError]);

  // Create props for a specific side
  const createMapProps = (indicatorId: string) => {
    const indicatorDef = INDICATOR_MAP.get(indicatorId);
    const cacheKey = `${indicatorId}-${activeYear}`;
    const values = indicatorValues[cacheKey] || indicatorValues[indicatorId] || [];
    
    const numericValues = values
      .map((v) => v.value)
      .filter((v): v is number => v !== null);

    const scheme = indicatorDef
      ? getSchemeForIndicator(indicatorDef.higherIsBetter, indicatorDef.colorScheme)
      : 'blues';

    const { getColor, breaks } = createQuantizedScale(numericValues, 6, scheme);

    const valueMap = new Map(values.map((v) => [v.nutsCode, v]));

    const onEachFeature = (feature: NutsFeature, layer: Layer) => {
      const code = feature.properties.NUTS_ID;
      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          setHoveredRegion(code);
          e.target.setStyle({ weight: 3, fillOpacity: 0.85 }).bringToFront();
        },
        mouseout: (e: LeafletMouseEvent) => {
          setHoveredRegion(null);
          e.target.setStyle({
            weight: code === selectedRegion ? 3 : 1.5,
            fillOpacity: code === selectedRegion ? 0.9 : 0.7,
          });
        },
        click: () => {
          setSelectedRegion(code === selectedRegion ? null : code);
        },
      });
    };

    const style = (feature: NutsFeature | undefined) => {
      if (!feature) return {};
      const code = feature.properties.NUTS_ID;
      const val = valueMap.get(code);
      const isSelected = code === selectedRegion;
      const isHovered = code === hoveredRegion;

      return {
        fillColor: val?.value != null ? getColor(val.value) : '#1a1a28',
        weight: isSelected ? 3 : isHovered ? 2.5 : 1.5,
        opacity: 1,
        color: isSelected ? '#4f8cff' : isHovered ? '#8888a0' : '#2a2a3a',
        fillOpacity: isSelected ? 0.9 : isHovered ? 0.85 : 0.7,
      };
    };

    const tooltipData = hoveredRegion
      ? {
          name: getNutsName(hoveredRegion),
          code: hoveredRegion,
          value: valueMap.get(hoveredRegion)?.value ?? null,
          year: valueMap.get(hoveredRegion)?.year ?? activeYear,
          unit: indicatorDef?.unit || '',
          indicator: indicatorDef?.labelPt || '',
        }
      : null;

    return { indicatorDef, breaks, onEachFeature, style, tooltipData, valueMap };
  };

  const leftProps = createMapProps(activeIndicator);
  const rightProps = createMapProps(activeIndicatorRight);

  return (
    <div className="split-view-container">
      <div className="split-header">
        <button className="exit-split-btn" onClick={toggleSplitView}>
          ← Fechar comparação
        </button>
        <div className="split-selectors">
          <div className="selector-group">
            <span className="selector-label">Mapa Esquerdo:</span>
            <span className="selector-value">{leftProps.indicatorDef?.labelPt}</span>
          </div>
          <div className="selector-group right-selector">
            <span className="selector-label">Mapa Direito:</span>
            <select 
              value={activeIndicatorRight}
              onChange={(e) => setActiveIndicatorRight(e.target.value)}
              className="split-select"
            >
              {Array.from(INDICATOR_MAP.values()).map(ind => (
                <option key={ind.id} value={ind.id}>{ind.labelPt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="split-maps-wrapper">
        {/* LEFT MAP */}
        <div className="split-map-pane">
          <MapContainer
            center={PORTUGAL_VIEW.center}
            zoom={PORTUGAL_VIEW.zoom}
            className="map-leaflet"
            zoomControl={false}
            attributionControl={false}
            minZoom={5}
            maxZoom={12}
          >
            <MapUpdater nutsLevel={nutsLevel} />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" pane="shadowPane" />
            {geoData && (
              <GeoJSON
                key={`left-${nutsLevel}-${activeIndicator}-${activeYear}`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={geoData as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={leftProps.style as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onEachFeature={leftProps.onEachFeature as any}
              />
            )}
          </MapContainer>
          <div className="split-controls-container">
            <MapControls breaks={leftProps.breaks} indicatorLabel={leftProps.indicatorDef?.labelPt || ''} unit={leftProps.indicatorDef?.unit || ''} />
          </div>
          {leftProps.tooltipData && <MapTooltip data={leftProps.tooltipData} />}
        </div>

        {/* RIGHT MAP */}
        <div className="split-map-pane">
          <MapContainer
            center={PORTUGAL_VIEW.center}
            zoom={PORTUGAL_VIEW.zoom}
            className="map-leaflet"
            zoomControl={false}
            attributionControl={false}
            minZoom={5}
            maxZoom={12}
          >
            <MapUpdater nutsLevel={nutsLevel} />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" pane="shadowPane" />
            {geoData && (
              <GeoJSON
                key={`right-${nutsLevel}-${activeIndicatorRight}-${activeYear}`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={geoData as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={rightProps.style as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onEachFeature={rightProps.onEachFeature as any}
              />
            )}
          </MapContainer>
          <div className="split-controls-container">
            <MapControls breaks={rightProps.breaks} indicatorLabel={rightProps.indicatorDef?.labelPt || ''} unit={rightProps.indicatorDef?.unit || ''} />
          </div>
          {rightProps.tooltipData && <MapTooltip data={rightProps.tooltipData} />}
        </div>
      </div>

      <div className="split-time-slider">
        <TimeSlider />
      </div>

      {isLoading && (
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <span>A carregar dados...</span>
        </div>
      )}
    </div>
  );
}
