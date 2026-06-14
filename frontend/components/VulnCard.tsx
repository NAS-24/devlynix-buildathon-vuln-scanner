'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import TierBadge from './TierBadge';
import SolvePanel from './SolvePanel';

// 1. Updated Interface to support the 'WAITING' state
interface ScanResult {
  check_name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Pass' | 'Info';
  status: 'PASS' | 'FAIL' | 'WARNING' | 'WAITING';
  description: string;
  tier: 1 | 2 | 3;
}

export default function VulnCard({ result: initialResult }: { result: ScanResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(initialResult);
  const [flash, setFlash] = useState(false);

  // Status color mapping for the new bold look
  const statusColors = {
    PASS: 'text-recon-lowGreen',
    FAIL: 'text-recon-critRed',
    WARNING: 'text-recon-highOrange',
    WAITING: 'text-recon-textMuted'
  };

  const handleRecheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setIsOpen(false);
      setResult({ ...result, status: 'PASS', severity: 'Pass' });
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }, 1500);
  };

  return (
    <div
      onClick={() => result.status !== 'WAITING' && setIsOpen(true)}
      className={`relative h-full p-6 rounded-xl border border-recon-borderDefault bg-[#111111] flex flex-col transition-all duration-300 shadow-lg ${
        result.status !== 'WAITING' ? 'hover:border-[#333333] cursor-pointer' : 'opacity-80'
      } ${flash ? 'bg-[#1E3A1E]' : ''}`}
    >
      {/* Top Row: Title & Tier */}
      <div className="flex justify-between items-start mb-5 gap-3">
        <h3 className="text-white font-bold text-xl leading-snug tracking-tight">
          {result.check_name}
        </h3>
        <TierBadge tier={result.tier} />
      </div>

      {/* Middle Row: Status & Severity */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#222222]">
        <span className={`font-black text-[11px] tracking-[0.2em] uppercase ${statusColors[result.status]}`}>
          {result.status}
        </span>
        <SeverityBadge severity={result.severity} />
      </div>

      {/* Bottom Row: Description */}
      <p className="text-gray-300 font-medium text-sm leading-relaxed mt-auto">
        {result.description}
      </p>

      {/* Solve System Overlay */}
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