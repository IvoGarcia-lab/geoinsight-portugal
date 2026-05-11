export interface IndicatorDefinition {
  id: string;
  datasetId: string;
  label: string;
  labelPt: string;
  unit: string;
  description: string;
  category: IndicatorCategory;
  colorScheme: 'sequential' | 'diverging';
  higherIsBetter: boolean;
  decimals: number;
}

export type IndicatorCategory =
  | 'demographics'
  | 'economy'
  | 'labor'
  | 'health'
  | 'education'
  | 'income';

export interface IndicatorValue {
  nutsCode: string;
  nutsLabel: string;
  value: number | null;
  year: number;
}

export interface IndicatorTimeSeries {
  nutsCode: string;
  nutsLabel: string;
  values: { year: number; value: number | null }[];
}

export interface RegionStats {
  nutsCode: string;
  nutsLabel: string;
  level: NutsLevel;
  indicators: Record<string, IndicatorValue>;
}

export type NutsLevel = 1 | 2 | 3;
