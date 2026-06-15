'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import TierBadge from './TierBadge';
import SolvePanel from './SolvePanel';

interface ScanResult {
  vulnerability_name?: string;
  check_name?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Pass' | 'Info';
  passed: boolean;
  description: string;
  remediation?: string;
  owasp_ref?: string;
  tier: 1 | 2 | 3;
}

const SEVERITY_BORDER: Record<string, string> = {
  Critical: 'border-l-recon-critRed',
  High:     'border-l-recon-highOrange',
  Medium:   'border-l-recon-medYellow',
  Low:      'border-l-recon-lowGreen',
  Pass:     'border-l-recon-accentGreen',
  Info:     'border-l-[#333333]',
};

export default function VulnCard({ result }: { result: ScanResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [passed, setPassed] = useState(result.passed);
  const [flash, setFlash] = useState(false);

  const displayName = result.vulnerability_name || result.check_name || 'Unknown Check';
  const borderAccent = SEVERITY_BORDER[result.severity] ?? 'border-l-[#333]';

  const handleRecheck = () => {
    setIsChecking(true);
    // Simulate backend re-scan
    setTimeout(() => {
      setIsChecking(false);
      setIsOpen(false);
      setPassed(true);
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }, 1500);
  };

  return (
    <div
      onClick={() => setIsOpen(true)}
      className={`relative h-full p-6 rounded-xl border border-recon-borderDefault border-l-4 ${borderAccent} bg-[#111111] flex flex-col gap-4 transition-all duration-300 shadow-lg cursor-pointer hover:border-recon-accentGreen/50 hover:shadow-2xl ${
        flash ? 'bg-[#1E3A1E]' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-white font-black text-sm tracking-wide leading-tight">
          {displayName}
        </h3>
        <TierBadge tier={result.tier} />
      </div>

      <div className="flex justify-between items-center pb-2 border-b border-[#222222]">
        <span className={`font-black text-[9px] tracking-[0.2em] uppercase ${
          passed ? 'text-recon-lowGreen' : 'text-recon-critRed'
        }`}>
          {passed ? 'PASS' : 'FAIL'}
        </span>
        <SeverityBadge severity={result.severity} />
      </div>

      <p className="text-gray-400 text-[11px] leading-relaxed flex-1 overflow-hidden line-clamp-4">
        {result.description}
      </p>

      {result.owasp_ref && (
        <p className="text-[9px] text-[#333] font-mono mt-auto pt-2 uppercase">
          {result.owasp_ref}
        </p>
      )}

      {!passed && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          className="mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-recon-accentGreen border border-recon-accentGreen/20 bg-recon-accentGreen/5 hover:bg-recon-accentGreen/10 px-4 py-2 rounded-md transition-colors w-full justify-center"
        >
          ⚙ Resolve
        </button>
      )}

      {isOpen && (
        <SolvePanel
          checkName={displayName}
          description={result.description}
          owasp={result.owasp_ref}
          remediation={result.remediation}
          onClose={() => setIsOpen(false)}
          onRecheck={handleRecheck}
          isChecking={isChecking}
        />
      )}
    </div>
  );
}