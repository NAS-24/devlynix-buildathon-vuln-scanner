import React from 'react';

interface CategoryScores {
  headers: number;
  injection: number;
  deps: number;
  auth: number;
  tls: number;
}

export default function RadarChart({ scores }: { scores: CategoryScores }) {
  // Map our 5 categories to angles (starting top, going clockwise)
  const categories = [
    { label: 'Headers', score: scores.headers },
    { label: 'Injection', score: scores.injection },
    { label: 'Deps', score: scores.deps },
    { label: 'Auth', score: scores.auth },
    { label: 'TLS', score: scores.tls },
  ];

  const size = 160;
  const center = size / 2;
  const radius = 50;

  // Helper to convert polar coordinates to Cartesian for the SVG
  const getPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  // Generate the outer web (100% boundary)
  const outerPolygon = categories.map((_, i) => getPoint(100, i, 5)).join(' ');
  // Generate the inner web (50% boundary)
  const midPolygon = categories.map((_, i) => getPoint(50, i, 5)).join(' ');
  // Generate the actual data shape
  const dataPolygon = categories.map((cat, i) => getPoint(cat.score, i, 5)).join(' ');

  return (
    <div className="relative w-full flex justify-center items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Webs */}
        <polygon points={outerPolygon} fill="none" stroke="#2A2A2A" strokeWidth="1" />
        <polygon points={midPolygon} fill="none" stroke="#2A2A2A" strokeWidth="0.5" strokeDasharray="2 2" />
        
        {/* Spokes */}
        {categories.map((_, i) => (
          <line 
            key={`spoke-${i}`}
            x1={center} y1={center} 
            x2={getPoint(100, i, 5).split(',')[0]} 
            y2={getPoint(100, i, 5).split(',')[1]} 
            stroke="#2A2A2A" strokeWidth="1" 
          />
        ))}

        {/* Data Shape */}
        <polygon 
          points={dataPolygon} 
          fill="#1A6B3A" fillOpacity="0.2" 
          stroke="#1A6B3A" strokeWidth="1.5" 
          className="transition-all duration-1000 ease-out"
        />

        {/* Axis Labels */}
        {categories.map((cat, i) => {
          // Push labels slightly further out than the 100% boundary
          const labelPoint = getPoint(135, i, 5).split(',');
          return (
            <text
              key={`label-${i}`}
              x={labelPoint[0]}
              y={labelPoint[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-recon-textHint text-[9px] uppercase tracking-widest"
            >
              {cat.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}