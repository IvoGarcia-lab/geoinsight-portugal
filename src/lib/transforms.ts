import type { EurostatResponse } from '@/types/eurostat';
import type { IndicatorValue, IndicatorTimeSeries } from '@/types/indicators';
import { getNutsName } from './nuts';

/**
 * Parse Eurostat JSON-stat response into a flat array of values.
 * Extracts the most recent value per geo code.
 */
export function parseLatestValues(
  response: EurostatResponse
): IndicatorValue[] {
  const geoDim = response.dimension.geo;
  const timeDim = response.dimension.time;

  if (!geoDim || !timeDim) return [];

  const geoIndex = response.id.indexOf('geo');
  const timeIndex = response.id.indexOf('time');

  const geoEntries = Object.entries(geoDim.category.index);
  const timeEntries = Object.entries(timeDim.category.index).sort(
    (a, b) => b[1] - a[1]
  ); // Most recent first

  const results: IndicatorValue[] = [];

  for (const [geoCode, geoIdx] of geoEntries) {
    // Find the most recent non-null value
    for (const [timeCode, timeIdx] of timeEntries) {
      const flatIndex = calculateFlatIndex(
        response.id,
        response.size,
        { geo: geoIdx, time: timeIdx },
        geoIndex,
        timeIndex
      );

      const value = response.value[flatIndex.toString()];

      if (value !== undefined && value !== null) {
        results.push({
          nutsCode: geoCode,
          nutsLabel: getNutsName(geoCode),
          value,
          year: parseInt(timeCode),
        });
        break;
      }
    }
  }

  return results;
}

/**
 * Parse Eurostat response into time series per region
 */
export function parseTimeSeries(
  response: EurostatResponse,
  targetGeo?: string
): IndicatorTimeSeries[] {
  const geoDim = response.dimension.geo;
  const timeDim = response.dimension.time;

  if (!geoDim || !timeDim) return [];

  const geoIndex = response.id.indexOf('geo');
  const timeIndex = response.id.indexOf('time');

  const geoEntries = Object.entries(geoDim.category.index).filter(
    ([code]) => !targetGeo || code === targetGeo
  );
  const timeEntries = Object.entries(timeDim.category.index).sort(
    (a, b) => a[1] - b[1]
  );

  const results: IndicatorTimeSeries[] = [];

  for (const [geoCode, geoIdx] of geoEntries) {
    const values: { year: number; value: number | null }[] = [];

    for (const [timeCode, timeIdx] of timeEntries) {
      const flatIndex = calculateFlatIndex(
        response.id,
        response.size,
        { geo: geoIdx, time: timeIdx },
        geoIndex,
        timeIndex
      );

      const val = response.value[flatIndex.toString()] ?? null;
      values.push({ year: parseInt(timeCode), value: val });
    }

    results.push({
      nutsCode: geoCode,
      nutsLabel: getNutsName(geoCode),
      values,
    });
  }

  return results;
}

/**
 * Calculate flat index for multi-dimensional JSON-stat data.
 * The JSON-stat format stores values in a flat object keyed by stringified index.
 */
function calculateFlatIndex(
  dimIds: string[],
  dimSizes: number[],
  indices: Record<string, number>,
  geoPos: number,
  timePos: number
): number {
  let flatIndex = 0;
  let multiplier = 1;

  for (let i = dimIds.length - 1; i >= 0; i--) {
    const dimId = dimIds[i];
    let idx = 0;

    if (dimId === 'geo') {
      idx = indices.geo;
    } else if (dimId === 'time') {
      idx = indices.time;
    }
    // For other dimensions (sex, age, unit, etc.), use index 0

    flatIndex += idx * multiplier;
    multiplier *= dimSizes[i];
  }

  return flatIndex;
}

/**
 * Extract a single numeric value map: nutsCode → value
 */
export function toValueMap(
  values: IndicatorValue[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const v of values) {
    if (v.value !== null) {
      map[v.nutsCode] = v.value;
    }
  }
  return map;
}
