import { create } from 'zustand';
import type { NutsLevel, IndicatorValue } from '@/types/indicators';
import type { NutsFeatureCollection } from '@/types/geo';

interface MapState {
  // Selected region
  selectedRegion: string | null;
  hoveredRegion: string | null;

  // Active indicator for choropleth
  activeIndicator: string;

  // NUTS level
  nutsLevel: NutsLevel;

  // Cached data
  geoData: NutsFeatureCollection | null;
  indicatorValues: Record<string, IndicatorValue[]>; // indicatorId → values
  isLoading: boolean;
  error: string | null;

  // Panel
  isPanelOpen: boolean;

  // Temporal
  activeYear: number;
  isPlaying: boolean;

  // Split View
  isSplitView: boolean;
  activeIndicatorRight: string;

  // Comparison / correlation
  compareRegions: string[];
  correlationX: string | null;
  correlationY: string | null;

  // Advanced Visualization Modes
  scaleType: 'quantile' | 'linear' | 'log';
  overlayMode: 'none' | 'bivariate' | 'bubbles';
  secondaryIndicator: string;

  // Actions
  setSelectedRegion: (code: string | null) => void;
  setHoveredRegion: (code: string | null) => void;
  setActiveIndicator: (id: string) => void;
  setActiveIndicatorRight: (id: string) => void;
  setNutsLevel: (level: NutsLevel) => void;
  setGeoData: (data: NutsFeatureCollection) => void;
  setIndicatorValues: (indicatorId: string, values: IndicatorValue[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  setActiveYear: (year: number | ((prev: number) => number)) => void;
  togglePlay: () => void;
  toggleSplitView: () => void;
  toggleCompareRegion: (code: string) => void;
  setCorrelationAxes: (x: string | null, y: string | null) => void;
  clearCompare: () => void;
  
  setScaleType: (type: 'quantile' | 'linear' | 'log') => void;
  setOverlayMode: (mode: 'none' | 'bivariate' | 'bubbles') => void;
  setSecondaryIndicator: (id: string) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  selectedRegion: null,
  hoveredRegion: null,
  activeIndicator: 'population',
  activeIndicatorRight: 'gdp',
  nutsLevel: 2,
  geoData: null,
  indicatorValues: {},
  isLoading: false,
  error: null,
  isPanelOpen: false,
  activeYear: 2022, // Default to a recent year with good data
  isPlaying: false,
  isSplitView: false,
  compareRegions: [],
  correlationX: null,
  correlationY: null,
  scaleType: 'quantile',
  overlayMode: 'none',
  secondaryIndicator: 'unemployment',

  setSelectedRegion: (code) =>
    set({ selectedRegion: code, isPanelOpen: code !== null }),

  setHoveredRegion: (code) => set({ hoveredRegion: code }),

  setActiveIndicator: (id) => set({ activeIndicator: id }),
  
  setActiveIndicatorRight: (id) => set({ activeIndicatorRight: id }),

  setNutsLevel: (level) =>
    set({
      nutsLevel: level,
      geoData: null,
      indicatorValues: {},
      selectedRegion: null,
      isPanelOpen: false,
    }),

  setGeoData: (data) => set({ geoData: data }),

  setIndicatorValues: (indicatorId, values) =>
    set((state) => ({
      indicatorValues: { ...state.indicatorValues, [indicatorId]: values },
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setPanelOpen: (open) =>
    set({ isPanelOpen: open, selectedRegion: open ? get().selectedRegion : null }),

  setActiveYear: (year) => 
    set((state) => ({ activeYear: typeof year === 'function' ? year(state.activeYear) : year })),
    
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  toggleSplitView: () => set((state) => ({ isSplitView: !state.isSplitView })),

  toggleCompareRegion: (code) =>
    set((state) => {
      const exists = state.compareRegions.includes(code);
      return {
        compareRegions: exists
          ? state.compareRegions.filter((c) => c !== code)
          : [...state.compareRegions, code].slice(0, 5), // Max 5 regions
      };
    }),

  setCorrelationAxes: (x, y) => set({ correlationX: x, correlationY: y }),

  clearCompare: () => set({ compareRegions: [], correlationX: null, correlationY: null }),

  setScaleType: (type) => set({ scaleType: type }),
  
  setOverlayMode: (mode) => set({ overlayMode: mode }),
  
  setSecondaryIndicator: (id) => set({ secondaryIndicator: id }),
}));
