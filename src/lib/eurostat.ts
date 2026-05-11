import type { EurostatResponse, EurostatQueryParams } from '@/types/eurostat';

const BASE_URL =
  'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

const memoryCache = new Map<string, { data: EurostatResponse; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function buildUrl(params: EurostatQueryParams): string {
  const url = new URL(`${BASE_URL}/${params.datasetId}`);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('lang', 'en');

  if (params.geo) {
    params.geo.forEach((g) => url.searchParams.append('geo', g));
  }
  if (params.time) {
    params.time.forEach((t) => url.searchParams.append('time', t));
  }
  if (params.sinceTimePeriod) {
    url.searchParams.set('sinceTimePeriod', params.sinceTimePeriod);
  }
  if (params.untilTimePeriod) {
    url.searchParams.set('untilTimePeriod', params.untilTimePeriod);
  }
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, values]) => {
      values.forEach((v) => url.searchParams.append(key, v));
    });
  }

  return url.toString();
}

export async function fetchEurostat(
  params: EurostatQueryParams
): Promise<EurostatResponse> {
  const url = buildUrl(params);
  const cacheKey = url;

  // Check memory cache
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(url, {
    next: { revalidate: 86400 }, // Next.js cache: 1 day
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Dataset ${params.datasetId} not found or no data for the given filters.`);
    }
    throw new Error(`Eurostat API error: ${res.status} ${res.statusText}`);
  }

  const data: EurostatResponse = await res.json();

  memoryCache.set(cacheKey, { data, ts: Date.now() });

  return data;
}

/**
 * Get all Portuguese NUTS codes for a given level
 */
export function getPortugalNutsCodes(level: 1 | 2 | 3): string[] {
  const nuts: Record<number, string[]> = {
    1: ['PT1', 'PT2', 'PT3'],
    2: ['PT11', 'PT15', 'PT16', 'PT17', 'PT18', 'PT20', 'PT30'],
    3: [
      'PT111', 'PT112', 'PT119', 'PT11A', 'PT11B', 'PT11C', 'PT11D', 'PT11E',
      'PT150', 'PT16B', 'PT16D', 'PT16E', 'PT16F', 'PT16G', 'PT16H', 'PT16I', 'PT16J',
      'PT170', 'PT181', 'PT184', 'PT185', 'PT186', 'PT187',
      'PT200', 'PT300',
    ],
  };
  return nuts[level] || nuts[2];
}

/**
 * Fetch a specific indicator for all Portuguese regions at a given NUTS level
 */
export async function fetchIndicatorForPortugal(
  datasetId: string,
  nutsLevel: 1 | 2 | 3,
  options?: { sinceTimePeriod?: string; untilTimePeriod?: string; filters?: Record<string, string[]> }
): Promise<EurostatResponse> {
  const geo = getPortugalNutsCodes(nutsLevel);

  return fetchEurostat({
    datasetId,
    geo,
    sinceTimePeriod: options?.sinceTimePeriod || '2015',
    filters: options?.filters,
  });
}

/**
 * Fetch a specific indicator for all Portuguese regions at a given NUTS level for a specific year
 */
export async function fetchIndicatorByYear(
  datasetId: string,
  nutsLevel: 1 | 2 | 3,
  year: number,
  options?: { filters?: Record<string, string[]> }
): Promise<EurostatResponse> {
  const geo = getPortugalNutsCodes(nutsLevel);

  return fetchEurostat({
    datasetId,
    geo,
    time: [year.toString()],
    filters: options?.filters,
  });
}
