'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMapStore } from '@/store/useMapStore';

const MIN_YEAR = 2010;
const MAX_YEAR = 2024;
const PLAY_INTERVAL = 600; // ms per frame

export default function TimeSlider() {
  const { activeYear, isPlaying, setActiveYear, togglePlay } = useMapStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveYear((prev: number) => {
          if (prev >= MAX_YEAR) {
            togglePlay();
            return MIN_YEAR;
          }
          return prev + 1;
        });
      }, PLAY_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, setActiveYear, togglePlay]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setActiveYear(parseInt(e.target.value));
    },
    [setActiveYear]
  );

  // Generate year markers
  const markers = [];
  for (let y = MIN_YEAR; y <= MAX_YEAR; y += 2) {
    markers.push(y);
  }

  const progress =
    ((activeYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  return (
    <div className="time-slider">
      <button
        className={`time-play-btn ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pausa' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="time-slider-track">
        <div className="time-year-label">{activeYear}</div>
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          value={activeYear}
          onChange={handleSliderChange}
          className="time-range"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${progress}%, var(--border) ${progress}%, var(--border) 100%)`,
          }}
        />
        <div className="time-markers">
          {markers.map((y) => (
            <span
              key={y}
              className={`time-marker ${y === activeYear ? 'active' : ''}`}
            >
              {y}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
