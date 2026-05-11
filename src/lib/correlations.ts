/**
 * Statistical correlation and regression utilities
 */

export interface CorrelationResult {
  r: number; // Pearson correlation coefficient
  r2: number; // R-squared
  slope: number;
  intercept: number;
  n: number; // number of data points
  significance: 'strong' | 'moderate' | 'weak' | 'none';
}

export interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  code: string;
}

/**
 * Calculate Pearson correlation coefficient and linear regression
 */
export function calculateCorrelation(
  points: ScatterPoint[]
): CorrelationResult {
  const n = points.length;

  if (n < 3) {
    return { r: 0, r2: 0, slope: 0, intercept: 0, n, significance: 'none' };
  }

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  const r = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const r2 = r * r;

  // Linear regression: y = slope * x + intercept
  const slopeD = n * sumX2 - sumX * sumX;
  const slope = slopeD === 0 ? 0 : (n * sumXY - sumX * sumY) / slopeD;
  const intercept = (sumY - slope * sumX) / n;

  const absR = Math.abs(r);
  let significance: CorrelationResult['significance'];
  if (absR >= 0.7) significance = 'strong';
  else if (absR >= 0.4) significance = 'moderate';
  else if (absR >= 0.2) significance = 'weak';
  else significance = 'none';

  return { r, r2, slope, intercept, n, significance };
}

/**
 * Build scatter points from two value maps (same NUTS codes)
 */
export function buildScatterData(
  xValues: Record<string, number>,
  yValues: Record<string, number>,
  labels: Record<string, string>
): ScatterPoint[] {
  const codes = Object.keys(xValues).filter((code) => code in yValues);

  return codes.map((code) => ({
    x: xValues[code],
    y: yValues[code],
    label: labels[code] || code,
    code,
  }));
}

/**
 * Rank regions by a given value map, return sorted array
 */
export function rankRegions(
  values: Record<string, number>,
  labels: Record<string, string>,
  ascending = false
): { code: string; label: string; value: number; rank: number }[] {
  const entries = Object.entries(values)
    .map(([code, value]) => ({
      code,
      label: labels[code] || code,
      value,
      rank: 0,
    }))
    .sort((a, b) => (ascending ? a.value - b.value : b.value - a.value));

  entries.forEach((e, i) => {
    e.rank = i + 1;
  });

  return entries;
}
