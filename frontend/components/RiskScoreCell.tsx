'use client';

import React from 'react';
import RadarChart from './RadarChart';

interface RiskScoreProps {
  realScore?: number;
  realRadar?: any;
  vulnerabilities?: any[];
}

export default function RiskScoreCell({ realScore, realRadar, vulnerabilities = [] }: RiskScoreProps) {
  const score = realScore !== undefined ? realScore : 100;
  
  // Dynamically count the severities of ONLY the failed checks
  const counts = vulnerabilities.reduce((acc, vuln) => {
    if (!vuln.passed && vuln.severity) {
      const sev = vuln.severity.toLowerCase();
      if (acc[sev] !== undefined) acc[sev]++;
    }
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });

  let ringColor = 'border-recon-critRed';
  let textColor = 'text-recon-critRed';
  let statusText = 'CRITICAL';

  if (score >= 80) {
    ringColor = 'border-recon-lowGreen';
    textColor = 'text-recon-lowGreen';
    statusText = 'SECURE';
  } else if (score >= 40) {
    ringColor = 'border-recon-highOrange';
    textColor = 'text-recon-highOrange';
    statusText = 'AT RISK';
  }

  const maxCount = Math.max(counts.critical, counts.high, counts.medium, counts.low, 1);

  return (
    <div className="h-full w-full p-8 rounded-xl bg-[#111111] border border-recon-borderDefault flex flex-col items-center relative overflow-hidden transition-colors shadow-lg">
      
      {/* BOLDER HEADER */}
      <h2 className="text-white font-black text-[10px] uppercase tracking-[0.3em] w-full text-left mb-8">
        Risk Score
      </h2>

      {/* Circular Score Ring */}
      <div className={`w-36 h-36 rounded-full border-[4px] ${ringColor} flex flex-col items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] bg-black/20`}>
        <span className="text-5xl font-bold text-white">{score}</span>
        <span className="text-[11px] font-bold text-recon-textHint mt-1 tracking-widest">/ 100</span>
      </div>

      {/* MASSIVE STATUS TEXT */}
      <span className={`text-lg font-black tracking-[0.25em] mb-10 uppercase ${textColor}`}>
        {statusText}
      </span>

      {/* SEVERITY BARS */}
      <div className="w-full flex flex-col gap-4 mt-auto z-10">
        <BarRow label="Critical" count={counts.critical} max={maxCount} color="bg-recon-critRed" />
        <BarRow label="High" count={counts.high} max={maxCount} color="bg-recon-highOrange" />
        <BarRow label="Medium" count={counts.medium} max={maxCount} color="bg-recon-medYellow" />
        <BarRow label="Low" count={counts.low} max={maxCount} color="bg-recon-lowGreen" />
      </div>

      {/* Radar Chart Area */}
        {realRadar ? (
        <RadarChart scores={realRadar} />
        ) : (
        <div className="h-[220px] w-[220px] flex items-center justify-center text-[10px] text-gray-600 italic">
            Awaiting Scan Data...
        </div>
        )}
    </div>
  );
}

function BarRow({ label, count, max, color }: { label: string, count: number, max: number, color: string }) {
  const widthPercent = count === 0 ? 0 : Math.max(5, (count / max) * 100);
  
  return (
    <div className="flex items-center text-xs font-semibold">
      <span className="w-20 text-gray-300">{label}</span>
      <div className="flex-1 h-2 bg-[#222222] rounded-full overflow-hidden mx-3">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_8px_currentColor]`} 
          style={{ width: `${widthPercent}%` }}
        ></div>
      </div>
      <span className="w-6 text-right text-white font-mono font-bold">{count}</span>
    </div>
  );
}