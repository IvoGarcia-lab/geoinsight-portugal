import type { NutsFeatureCollection, NutsFeature } from '@/types/geo';
import type { NutsLevel } from '@/types/indicators';

const GISCO_BASE =
  'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson';

// Use 2024 NUTS classification, 1:1M resolution, EPSG:4326
const NUTS_YEAR = '2024';
const RESOLUTION = '03M'; // 03M = good detail, faster load (~3MB vs 22MB at 01M)
const PROJECTION = '4326';

let geoCache: Record<string, NutsFeatureCollection> = {};

function buildGiscoUrl(level: NutsLevel): string {
  return `${GISCO_BASE}/NUTS_RG_${RESOLUTION}_${NUTS_YEAR}_${PROJECTION}_LEVL_${level}.geojson`;
}

/**
 * Fetch NUTS GeoJSON from GISCO and filter for Portugal only
 */
export async function fetchPortugalGeo(
  level: NutsLevel
): Promise<NutsFeatureCollection> {
  const cacheKey = `pt_nuts_${level}`;

  if (geoCache[cacheKey]) {
    return geoCache[cacheKey];
  }

  const url = buildGiscoUrl(level);
  const res = await fetch(url, {
    next: { revalidate: 604800 }, // Cache 7 days — geometries rarely change
  });

  if (!res.ok) {
    throw new Error(`GISCO fetch error: ${res.status} for NUTS level ${level}`);
  }

  const allData = (await res.json()) as NutsFeatureCollection;

  // Filter only Portuguese regions
  const ptFeatures: NutsFeature[] = allData.features.filter(
    (f) => f.properties.CNTR_CODE === 'PT'
  );

  const ptGeo: NutsFeatureCollection = {
    type: 'FeatureCollection',
    features: ptFeatures,
  };

  geoCache[cacheKey] = ptGeo;
  return ptGeo;
}

/**
 * Clear the geo cache (useful for testing)
 */
export function clearGeoCache() {
  geoCache = {};
}
