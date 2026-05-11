'use client';

interface RegionHeaderProps {
  name: string;
  code: string;
  loading: boolean;
}

export default function RegionHeader({ name, code, loading }: RegionHeaderProps) {
  return (
    <div className="region-header">
      <div className="region-header-top">
        <h2 className="region-name">{name}</h2>
        <span className="region-badge">{code}</span>
      </div>
      {loading && (
        <div className="region-loading-bar">
          <div className="region-loading-fill" />
        </div>
      )}
    </div>
  );
}
