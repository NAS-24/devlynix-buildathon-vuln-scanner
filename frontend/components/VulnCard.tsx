'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import TierBadge from './TierBadge';
import SolvePanel from './SolvePanel';

interface ScanResult {
  check_name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Pass';
  status: 'PASS' | 'FAIL' | 'WARNING';
  description: string;
  tier: 1 | 2 | 3;
}

export default function VulnCard({ result: initialResult }: { result: ScanResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(initialResult);
  const [flash, setFlash] = useState(false);

  // Left border accent colors
  const borderColors = {
    Critical: 'border-l-recon-critRed',
    High: 'border-l-recon-highOrange',
    Medium: 'border-l-recon-medYellow',
    Low: 'border-l-recon-lowGreen',
    Pass: 'border-l-recon-lowGreen',
  };

  // Mock the Re-check loop (Blueprint Section 5.5)
  const handleRecheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setIsOpen(false);
      setResult({ ...result, status: 'PASS', severity: 'Pass' });
      setFlash(true);
      setTimeout(() => setFlash(false), 800); // Remove flash class after animation
    }, 1500);
  };

  return (
    <div
      onClick={() => setIsOpen(true)}
      className={`relative h-full min-h-[180px] p-5 rounded-xl border border-recon-borderDefault hover:border-recon-borderHover cursor-pointer overflow-hidden border-l-[3px] transition-all duration-300 ${borderColors[result.severity]} ${
        flash ? 'bg-[#1E3A1E]' : 'bg-recon-bgCard hover:bg-[#1E2A20]'
      }`}
    >
      {/* Top Row */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-recon-textPrimary font-medium text-[14px] leading-tight pr-2">{result.check_name}</h3>
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
      <p className="text-recon-textMuted text-[11px] leading-relaxed line-clamp-3">
        {result.description}
      </p>

      {/* The Solve System Overlay */}
      {isOpen && (
        <SolvePanel 
          checkName={result.check_name}
          description={result.description}
          onClose={() => setIsOpen(false)}
          onRecheck={handleRecheck}
          isChecking={isChecking}
        />
      )}
    </div>
  );
}