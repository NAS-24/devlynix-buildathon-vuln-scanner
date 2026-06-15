'use client';
import React from 'react';

interface CategoryScores {
  headers: number;
  injection: number;
  deps: number;
  auth: number;
  tls: number;
}

export default function RadarChart({ scores }: { scores: CategoryScores }) {
  const categories = [
    { label: 'Headers', score: scores.headers },
    { label: 'Injection', score: scores.injection },
    { label: 'Deps', score: scores.deps },
    { label: 'Auth', score: scores.auth },
    { label: 'TLS', score: scores.tls },
  ];

  // INCREASED SIZE from 160 to 220 for a much larger visual footprint
  const size = 220; 
  const center = size / 2;
  const radius = 70; // Increased radius for more detail

  const getPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  const outerPolygon = categories.map((_, i) => getPoint(100, i, 5)).join(' ');
  const midPolygon = categories.map((_, i) => getPoint(50, i, 5)).join(' ');
  const dataPolygon = categories.map((cat, i) => getPoint(cat.score, i, 5)).join(' ');

  return (
    <div className="relative w-full flex justify-center items-center py-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Webs: Darker borders for higher contrast */}
        <polygon points={outerPolygon} fill="#111111" stroke="#333333" strokeWidth="2" />
        <polygon points={midPolygon} fill="none" stroke="#222222" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Spokes */}
        {categories.map((_, i) => (
          <line 
            key={`spoke-${i}`}
            x1={center} y1={center} 
            x2={getPoint(100, i, 5).split(',')[0]} 
            y2={getPoint(100, i, 5).split(',')[1]} 
            stroke="#333333" strokeWidth="2" 
          />
        ))}

        {/* Data Shape: Brighter Green with a glow filter effect */}
        <polygon 
          points={dataPolygon} 
          fill="#10b981" fillOpacity="0.3" 
          stroke="#10b981" strokeWidth="3" 
          className="transition-all duration-1000 ease-out"
        />

        {/* Axis Labels: BOLD white text */}
        {categories.map((cat, i) => {
        // Increase multiplier from 125 to 145 to move labels outside the web
        const labelPoint = getPoint(145, i, 5).split(','); 
        return (
          <text
            key={`label-${i}`}
            x={labelPoint[0]}
            y={labelPoint[1]}
            textAnchor="middle"
            dominantBaseline="middle"
            // Make text even smaller so it doesn't clip
            className="fill-white font-bold text-[8px] uppercase tracking-widest"
          >
            {cat.label}
          </text>
        );
      })}
      </svg>
    </div>
  );
}