import type { NutsLevel } from './indicators';

export interface NutsFeatureProperties {
  NUTS_ID: string;
  LEVL_CODE: NutsLevel;
  CNTR_CODE: string;
  NAME_LATN: string;
  NUTS_NAME: string;
  MOUNT_TYPE?: number;
  URBN_TYPE?: number;
  COAST_TYPE?: number;
  FID: string;
}

export interface NutsFeature {
  type: 'Feature';
  properties: NutsFeatureProperties;
  geometry: GeoJSON.Geometry;
}

export interface NutsFeatureCollection {
  type: 'FeatureCollection';
  features: NutsFeature[];
}

export interface MapViewState {
  center: [number, number];
  zoom: number;
}

export const PORTUGAL_VIEW: MapViewState = {
  center: [39.5, -8.0],
  zoom: 7,
};
