'use client';

import { useMapStore } from '@/store/useMapStore';
import { INDICATORS, CATEGORIES } from '@/config/indicators';

export default function LayerSelector() {
  const { activeIndicator, setActiveIndicator } = useMapStore();

  return (
    <div className="layer-selector">
      <select
        className="layer-select"
        value={activeIndicator}
        onChange={(e) => setActiveIndicator(e.target.value)}
      >
        {CATEGORIES.map((cat) => (
          <optgroup key={cat.id} label={`${cat.icon} ${cat.label}`}>
            {INDICATORS.filter((ind) => ind.category === cat.id).map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.labelPt} ({ind.unit})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
