'use client';
import React from 'react';

interface RiskScoreProps {
  realScore?: number;
  vulnerabilities?: any[];
}

const getScoreStyle = (score: number, hasResults: boolean) => {
  if (!hasResults) return { ring: 'border-[#222]', text: 'text-gray-700', status: 'READY', glow: '' };
  if (score >= 80) return { ring: 'border-recon-lowGreen', text: 'text-recon-lowGreen', status: 'SECURE', glow: 'shadow-[0_0_20px_rgba(26,107,58,0.2)]' };
  if (score >= 40) return { ring: 'border-recon-highOrange', text: 'text-recon-highOrange', status: 'AT RISK', glow: 'shadow-[0_0_20px_rgba(230,126,34,0.2)]' };
  return { ring: 'border-recon-critRed', text: 'text-recon-critRed', status: 'CRITICAL', glow: 'shadow-[0_0_20px_rgba(231,76,60,0.2)]' };
};

export default function RiskScoreCell({ realScore, vulnerabilities = [] }: RiskScoreProps) {
  const hasResults = vulnerabilities.length > 0;
  const score = realScore ?? 100;
  const style = getScoreStyle(score, hasResults);

  const counts = vulnerabilities.reduce((acc, vuln) => {
    if (!vuln.passed && vuln.severity) {
      const sev = vuln.severity.toLowerCase();
      if (acc[sev] !== undefined) acc[sev]++;
    }
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });

  const totalFails = counts.critical + counts.high + counts.medium + counts.low;

  return (
    <div className="h-full w-full p-6 rounded-xl bg-[#111111] border border-[#222222] flex flex-col shadow-2xl transition-all duration-500">
      <h2 className="text-white/40 font-black text-[9px] uppercase tracking-[0.3em] w-full text-left mb-6">
        Risk Assessment
      </h2>

      {/* Hero Gauge */}
      <div className="flex flex-col items-center">
        <div className={`w-28 h-28 rounded-full border-[3px] ${style.ring} ${hasResults ? style.glow : ''} flex flex-col items-center justify-center bg-black/40 transition-all duration-700`}>
          <span className={`text-4xl font-black ${hasResults ? 'text-white' : 'text-gray-700'} tracking-tighter`}>
            {hasResults ? score : '--'}
          </span>
          <span className="text-[9px] text-white/20 font-mono">/100</span>
        </div>
        <span className={`text-[10px] font-black tracking-[0.3em] mt-3 uppercase ${style.text}`}>
          {style.status}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center py-6">
        {hasResults ? (
          <div className="w-full flex flex-col gap-3 animate-in fade-in duration-700">
            <SummaryRow label="Checks Run" value={vulnerabilities.length} />
            <SummaryRow label="Issues Found" value={totalFails} highlight={totalFails > 0} />
            <div className="w-full h-px bg-[#1e1e1e] my-2" />
            <BarRow label="Crit" count={counts.critical} color="bg-recon-critRed" />
            <BarRow label="High" count={counts.high} color="bg-recon-highOrange" />
            <BarRow label="Med" count={counts.medium} color="bg-recon-medYellow" />
            <BarRow label="Low" count={counts.low} color="bg-recon-lowGreen" />
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4 text-center">
            <p className="text-[10px] text-gray-600 font-mono leading-relaxed">
              Enter a URL above to begin the <br/> reconnaissance sequence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${highlight ? 'text-white' : 'text-gray-400'}`}>{value}</span>
    </div>
  );
}

function BarRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center text-[9px] font-bold w-full gap-2">
      <span className="w-8 text-gray-500 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: count > 0 ? '100%' : '5%' }} />
      </div>
      <span className="w-4 text-right text-white font-mono">{count}</span>
    </div>
  );
}