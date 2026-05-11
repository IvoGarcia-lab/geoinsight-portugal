'use client';

import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Layer, LeafletMouseEvent } from 'leaflet';
import { useMapStore } from '@/store/useMapStore';
import { INDICATOR_MAP } from '@/config/indicators';
import { getSchemeForIndicator, createScale, getBivariateColor } from '@/lib/colors';
import { getNutsName } from '@/lib/nuts';
import { PORTUGAL_VIEW } from '@/types/geo';
import type { NutsFeature, NutsFeatureCollection } from '@/types/geo';
import MapControls from './MapControls';
import MapTooltip from './MapTooltip';
import TimeSlider from './TimeSlider';
import SplitMapView from './SplitMapView';
import { CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapUpdater() {
  const map = useMap();
  const nutsLevel = useMapStore((s) => s.nutsLevel);

  useEffect(() => {
    map.setView(PORTUGAL_VIEW.center, PORTUGAL_VIEW.zoom);
  }, [map, nutsLevel]);

  return null;
}

export default function InteractiveMap() {
  const {
    geoData,
    activeIndicator,
    indicatorValues,
    selectedRegion,
    hoveredRegion,
    nutsLevel,
    isLoading,
    activeYear,
    isSplitView,
    setSelectedRegion,
    setHoveredRegion,
    setGeoData,
    setIndicatorValues,
    setLoading,
    setError,
    scaleType,
    overlayMode,
    secondaryIndicator,
  } = useMapStore();

  // Fetch geo data
  useEffect(() => {
    async function loadGeo() {
      setLoading(true);
      try {
        const res = await fetch(`/api/geo/${nutsLevel}`);
        if (!res.ok) throw new Error('Failed to load geo data');
        const data: NutsFeatureCollection = await res.json();
        setGeoData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Geo load failed');
      } finally {
        setLoading(false);
      }
    }
    loadGeo();
  }, [nutsLevel, setGeoData, setLoading, setError]);

  // Fetch indicator values when indicator, level or year changes
  useEffect(() => {
    async function loadIndicators() {
      const indicatorsToFetch = overlayMode !== 'none' 
        ? [activeIndicator, secondaryIndicator] 
        : [activeIndicator];
        
      setLoading(true);
      try {
        await Promise.all(indicatorsToFetch.map(async (ind) => {
          const res = await fetch(
            `/api/stats/all?indicator=${ind}&level=${nutsLevel}&year=${activeYear}`
          );
          if (!res.ok) throw new Error(`Failed to load indicator ${ind}`);
          const data = await res.json();
          setIndicatorValues(`${ind}-${activeYear}`, data.values);
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Indicator load failed');
      } finally {
        setLoading(false);
      }
    }
    loadIndicators();
  }, [activeIndicator, secondaryIndicator, overlayMode, nutsLevel, activeYear, setIndicatorValues, setLoading, setError]);

  // Build color scale
  const indicatorDef = INDICATOR_MAP.get(activeIndicator);
  const values = indicatorValues[`${activeIndicator}-${activeYear}`] || indicatorValues[activeIndicator] || [];
  const numericValues = values
    .map((v) => v.value)
    .filter((v): v is number => v !== null);

  const scheme = indicatorDef
    ? getSchemeForIndicator(indicatorDef.higherIsBetter, indicatorDef.colorScheme)
    : 'blues';

  const { getColor, breaks } = createScale(numericValues, 6, scheme, scaleType);

  // Value lookup for primary indicator
  const valueMap = new Map(
    values.map((v) => [v.nutsCode, v])
  );
  
  // Secondary Indicator setup (for Bivariate or Bubbles)
  const secondaryValues = indicatorValues[`${secondaryIndicator}-${activeYear}`] || [];
  const secondaryNumericValues = secondaryValues
    .map((v) => v.value)
    .filter((v): v is number => v !== null);
  const secondaryMap = new Map(
    secondaryValues.map((v) => [v.nutsCode, v])
  );
  
  const minSec = Math.min(...(secondaryNumericValues.length ? secondaryNumericValues : [0]));
  const maxSec = Math.max(...(secondaryNumericValues.length ? secondaryNumericValues : [1]));
  const minPrim = Math.min(...(numericValues.length ? numericValues : [0]));
  const maxPrim = Math.max(...(numericValues.length ? numericValues : [1]));

  const onEachFeature = useCallback(
    (feature: NutsFeature, layer: Layer) => {
      const code = feature.properties.NUTS_ID;

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          setHoveredRegion(code);
          const target = e.target;
          target.setStyle({
            weight: 3,
            fillOpacity: 0.85,
          });
          target.bringToFront();
        },
        mouseout: (e: LeafletMouseEvent) => {
          setHoveredRegion(null);
          const target = e.target;
          target.setStyle({
            weight: code === selectedRegion ? 3 : 1.5,
            fillOpacity: code === selectedRegion ? 0.9 : 0.7,
          });
        },
        click: () => {
          setSelectedRegion(code === selectedRegion ? null : code);
        },
      });
    },
    [selectedRegion, setHoveredRegion, setSelectedRegion]
  );

  const style = useCallback(
    (feature: NutsFeature | undefined) => {
      if (!feature) return {};
      const code = feature.properties.NUTS_ID;
      const val = valueMap.get(code);
      const isSelected = code === selectedRegion;
      const isHovered = code === hoveredRegion;

      let fillColor = '#1a1a28';
      
      if (val?.value != null) {
        if (overlayMode === 'bivariate') {
          const valSec = secondaryMap.get(code)?.value;
          if (valSec != null) {
            fillColor = getBivariateColor(val.value, valSec, minPrim, maxPrim, minSec, maxSec);
          } else {
            fillColor = getColor(val.value);
          }
        } else {
          fillColor = getColor(val.value);
        }
      }

      return {
        fillColor,
        weight: isSelected ? 3 : isHovered ? 2.5 : 1.5,
        opacity: 1,
        color: isSelected ? '#4f8cff' : isHovered ? '#8888a0' : '#2a2a3a',
        fillOpacity: isSelected ? 0.9 : isHovered ? 0.85 : 0.7,
      };
    },
    [valueMap, secondaryMap, overlayMode, selectedRegion, hoveredRegion, getColor, minPrim, maxPrim, minSec, maxSec]
  );

  // Tooltip data
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

  if (isSplitView) {
    return <SplitMapView />;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={PORTUGAL_VIEW.center}
        zoom={PORTUGAL_VIEW.zoom}
        className="map-leaflet"
        zoomControl={false}
        attributionControl={false}
        minZoom={5}
        maxZoom={12}
      >
        <MapUpdater />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          pane="shadowPane"
        />

        {geoData && (
          <>
            <GeoJSON
              key={`${nutsLevel}-${activeIndicator}-${secondaryIndicator}-${overlayMode}-${activeYear}-${JSON.stringify(numericValues.slice(0, 3))}`}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data={geoData as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style={style as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onEachFeature={onEachFeature as any}
            />
            {overlayMode === 'bubbles' && geoData.features.map(f => {
              // Only draw bubbles for NUTS2/3 if they have point or center (rough estimation or we use bbox center)
              // For a true dot density or proportional symbol we need coordinates. Let's use a very simplified centroid approximation if unavailable
              // leafet's geojson gives us polygons, we might need a centroid. As a hack, we can use the first coordinate of the first polygon.
              // To make it better, we'd need pre-calculated centroids in the GeoJSON.
              // We will just render if properties has CENTROID or try to estimate
              const secVal = secondaryMap.get(f.properties.NUTS_ID)?.value;
              if (secVal == null || !f.geometry) return null;
              
              let coords: [number, number] | null = null;
              if (f.geometry.type === 'Polygon') {
                coords = [f.geometry.coordinates[0][0][1], f.geometry.coordinates[0][0][0]];
              } else if (f.geometry.type === 'MultiPolygon') {
                coords = [f.geometry.coordinates[0][0][0][1], f.geometry.coordinates[0][0][0][0]];
              }
              
              if (!coords) return null;
              
              // Map secVal to radius (e.g. 5 to 30)
              const radius = 5 + ((secVal - minSec) / (maxSec - minSec)) * 25;
              
              return (
                <CircleMarker 
                  key={`bubble-${f.properties.NUTS_ID}`}
                  center={coords} 
                  radius={Number.isNaN(radius) ? 5 : radius}
                  fillColor="#ffb020"
                  color="#ffffff"
                  weight={1}
                  fillOpacity={0.6}
                  interactive={false}
                />
              );
            })}
          </>
        )}
      </MapContainer>

      <MapControls breaks={breaks} indicatorLabel={indicatorDef?.labelPt || ''} unit={indicatorDef?.unit || ''} />
      
      <TimeSlider />

      {tooltipData && <MapTooltip data={tooltipData} />}

      {isLoading && (
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <span>A carregar dados...</span>
        </div>
      )}
    </div>
  );
}
