'use client';

import dynamic from 'next/dynamic';
import StatsPanel from '@/components/panel/StatsPanel';
import LayerSelector from '@/components/ui/LayerSelector';
import UserAccount from '@/components/auth/UserAccount';
import SaveAnalysis from '@/components/ui/SaveAnalysis';

// Leaflet must be loaded client-side only (no SSR)
const InteractiveMap = dynamic(
  () => import('@/components/map/InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <span>A inicializar mapa...</span>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">G</div>
          <span className="app-logo-text">GeoInsight</span>
          <span className="app-logo-tag">Portugal</span>
        </div>

        <div className="header-actions">
          <SaveAnalysis />
          <LayerSelector />
          <UserAccount />
        </div>
      </header>

      {/* Main — Map + Panel */}
      <main className="app-main">
        <InteractiveMap />
        <StatsPanel />
      </main>
    </div>
  );
}
