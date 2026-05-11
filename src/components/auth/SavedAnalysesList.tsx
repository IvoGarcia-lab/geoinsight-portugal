'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMapStore } from '@/store/useMapStore';
import { INDICATORS } from '@/config/indicators';

export default function SavedAnalysesList() {
  const { user, session } = useAuthStore();
  const { setActiveIndicator, setSecondaryIndicator, setScaleType, setOverlayMode, setActiveYear } = useMapStore();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalyses = async () => {
    if (!user || !session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analysis/list', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setAnalyses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAnalyses();
  }, [user]);

  const loadAnalysis = (a: any) => {
    setActiveIndicator(a.primaryIndicator);
    if (a.secondaryIndicator) setSecondaryIndicator(a.secondaryIndicator);
    setScaleType(a.scaleType);
    setOverlayMode(a.overlayMode);
    setActiveYear(a.year);
  };

  if (!user) return null;

  return (
    <div className="saved-analyses-section">
      <div className="section-header">
        <h4>As Minhas Análises</h4>
        <button onClick={fetchAnalyses} className="btn-refresh">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="loading-small">A carregar...</div>
      ) : analyses.length === 0 ? (
        <div className="empty-state">Ainda não guardou análises.</div>
      ) : (
        <div className="analyses-grid">
          {analyses.map(a => (
            <div key={a.id} className="analysis-item" onClick={() => loadAnalysis(a)}>
              <div className="analysis-title">{a.title}</div>
              <div className="analysis-meta">
                {a.primaryIndicator} • {a.year}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
