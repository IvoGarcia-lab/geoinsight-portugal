import {
  scaleSequential,
  scaleQuantize,
  scaleLinear,
  scaleLog,
} from 'd3-scale';
import {
  interpolateBlues,
  interpolateRdYlGn,
  interpolateYlOrRd,
  interpolatePurples,
  interpolateGreens,
  interpolateOranges,
} from 'd3-scale-chromatic';

export type ColorSchemeId =
  | 'blues'
  | 'greens'
  | 'oranges'
  | 'purples'
  | 'rdylgn'
  | 'ylorrd';

const INTERPOLATORS: Record<ColorSchemeId, (t: number) => string> = {
  blues: interpolateBlues,
  greens: interpolateGreens,
  oranges: interpolateOranges,
  purples: interpolatePurples,
  rdylgn: interpolateRdYlGn,
  ylorrd: interpolateYlOrRd,
};

export type ScaleType = 'quantile' | 'linear' | 'log';

export interface ScaleResult {
  getColor: (value: number) => string;
  breaks: { min: number; max: number; color: string }[];
}

export function createScale(
  values: number[],
  steps: number = 6,
  scheme: ColorSchemeId = 'blues',
  scaleType: ScaleType = 'quantile'
): ScaleResult {
  if (values.length === 0) {
    return { getColor: () => '#333', breaks: [] };
  }

  // Filter out invalid values for log scale
  const validValues = scaleType === 'log' ? values.filter(v => v > 0) : values;
  if (validValues.length === 0) {
     return { getColor: () => '#333', breaks: [] };
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const interpolator = INTERPOLATORS[scheme];

  const colors = Array.from({ length: steps }, (_, i) =>
    interpolator((i + 0.5) / steps)
  );

  let getColor: (val: number) => string;
  let breaks: { min: number; max: number; color: string }[] = [];

  if (scaleType === 'quantile') {
    const scale = scaleQuantize<string>().domain([min, max]).range(colors);
    getColor = (val) => scale(val) || '#333';
    
    const step = (max - min) / steps;
    breaks = colors.map((color, i) => ({
      min: min + step * i,
      max: min + step * (i + 1),
      color,
    }));
  } else if (scaleType === 'linear') {
    const scale = scaleLinear<string, string>()
      .domain(colors.map((_, i) => min + (i * (max - min)) / (steps - 1)))
      .range(colors)
      .clamp(true);
      
    getColor = (val) => scale(val) || '#333';
    const step = (max - min) / steps;
    breaks = colors.map((color, i) => ({
      min: min + step * i,
      max: min + step * (i + 1),
      color,
    }));
  } else {
    // Logarithmic
    // Ensure min > 0 for log
    const safeMin = min <= 0 ? 0.001 : min;
    const scale = scaleLog<string, string>()
      .domain(colors.map((_, i) => safeMin * Math.pow(max / safeMin, i / (steps - 1))))
      .range(colors)
      .clamp(true);
      
    getColor = (val) => val > 0 ? (scale(val) || '#333') : '#333';
    
    // Generate approximate log breaks
    const ratio = Math.pow(max / safeMin, 1 / steps);
    breaks = colors.map((color, i) => ({
      min: safeMin * Math.pow(ratio, i),
      max: safeMin * Math.pow(ratio, i + 1),
      color,
    }));
  }

  return { getColor, breaks };
}

// Keep the old function signature for backwards compatibility but route it to our new one
export function createQuantizedScale(
  values: number[],
  steps = 6,
  scheme: ColorSchemeId = 'blues'
) {
  return createScale(values, steps, scheme, 'quantile');
}


/**
 * Get Bivariate Color
 * Uses a standard 3x3 color matrix (Teal to Pink grid)
 */
export function getBivariateColor(
  x: number,
  y: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): string {
  if (x == null || y == null) return '#333';

  // 3x3 grid colors (bottom-left to top-right)
  const colors = [
    '#e8e8e8', '#ace4e4', '#5ac8c8', // low y
    '#dfb0d6', '#a5add3', '#5698b9', // med y
    '#be64ac', '#8c62aa', '#3b4994'  // high y
  ];

  // Map value to 0, 1, 2 index
  const getIndex = (val: number, min: number, max: number) => {
    if (val <= min) return 0;
    if (val >= max) return 2;
    const ratio = (val - min) / (max - min);
    if (ratio < 0.33) return 0;
    if (ratio < 0.66) return 1;
    return 2;
  };

  const xi = getIndex(x, xMin, xMax);
  const yi = getIndex(y, yMin, yMax);
  
  // Flatten 2D index to 1D array index (yi * 3 + xi)
  return colors[yi * 3 + xi] || '#333';
}

export function getSchemeForIndicator(
  higherIsBetter: boolean,
  colorScheme: 'sequential' | 'diverging'
): ColorSchemeId {
  if (colorScheme === 'diverging') {
    return higherIsBetter ? 'rdylgn' : 'ylorrd';
  }
  return 'blues';
}

export function withOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}
