/**
 * Eurostat JSON-stat response types
 */
export interface EurostatResponse {
  version: string;
  label: string;
  href: string;
  source: string;
  updated: string;
  status?: Record<string, string>;
  extension?: {
    datasetId: string;
    lang: string;
    description?: string;
  };
  value: Record<string, number | null>;
  dimension: Record<string, EurostatDimension>;
  id: string[];
  size: number[];
}

export interface EurostatDimension {
  label: string;
  category: {
    index: Record<string, number>;
    label: Record<string, string>;
  };
}

export interface EurostatQueryParams {
  datasetId: string;
  geo?: string[];
  time?: string[];
  sinceTimePeriod?: string;
  untilTimePeriod?: string;
  filters?: Record<string, string[]>;
}
