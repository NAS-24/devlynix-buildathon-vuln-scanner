'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import TierBadge from './TierBadge';


interface ScanResult {
  check_name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Pass';
  status: 'PASS' | 'FAIL' | 'WARNING';
  description: string;
  tier: 1 | 2 | 3;
}

export default function VulnCard({ result }: { result: ScanResult }) {
  const [isOpen, setIsOpen] = useState(false);

  
  const borderColors = {
    Critical: 'border-l-recon-critRed',
    High: 'border-l-recon-highOrange',
    Medium: 'border-l-recon-medYellow',
    Low: 'border-l-recon-lowGreen',
    Pass: 'border-l-recon-lowGreen',
  };

  return (
    <div
      onClick={() => setIsOpen(true)}
      className={`relative h-full min-h-[180px] p-5 rounded-xl bg-recon-bgCard border border-recon-borderDefault hover:border-recon-borderHover hover:bg-[#1E2A20] transition-all duration-200 cursor-pointer overflow-hidden border-l-[3px] ${borderColors[result.severity]}`}
    >
      {/* Top Row */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-recon-textPrimary font-medium text-[15px]">{result.check_name}</h3>
        <TierBadge tier={result.tier} />
      </div>

      {/* Middle Row */}
      <div className="flex justify-between items-center mb-3">
        <span className={`font-mono text-sm font-semibold tracking-wider ${result.status === 'PASS' ? 'text-recon-lowGreen' : 'text-recon-critRed'}`}>
          {result.status}
        </span>
        <SeverityBadge severity={result.severity} />
      </div>

      {/* Bottom Row */}
      <p className="text-recon-textMuted text-xs leading-relaxed line-clamp-3">
        {result.description}
      </p>

      {/* Detail Panel Overlay (The "Solve" System) */}
      {isOpen && (
        <div
          className="absolute inset-0 z-10 bg-[#1A2A1E] border border-recon-accentGreen p-5 flex flex-col cursor-default"
          onClick={(e) => e.stopPropagation()} // Prevent clicks from bleeding through
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-recon-textPrimary font-medium text-[15px]">{result.check_name}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="text-recon-textMuted hover:text-recon-textPrimary transition-colors"
            >
              ✕
            </button>
          </div>
          
          <p className="text-xs text-recon-textMuted mb-auto leading-relaxed">
            Detailed explanation and OWASP references will appear here. The Solve modes (Guide Me / Direct Me / Fix It For Me) are coming next.
          </p>

          <button className="mt-4 w-full bg-recon-accentGreen text-white text-xs font-bold tracking-widest uppercase py-3 rounded uppercase hover:bg-recon-accentGreenLight transition-colors flex items-center justify-center gap-2">
            <span>🔧</span> SOLVE THIS
          </button>
        </div>
      )}
    </div>
  );
}