'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';

interface LiveFeedProps {
  isReportView?: boolean;
  results?: any[];
}

export default function LiveFeed({ isReportView = false, results = [] }: LiveFeedProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const displayData = results.map((r, index) => ({
    id: index,
    name: r.vulnerability_name || r.check_name || 'Unknown Probe',
    severity: r.passed ? 'Pass' : (r.severity as 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' | 'Pass'),
    status: 'complete',
    evidence: `${r.description}\n\nRemediation:\n${r.remediation || 'No remediation provided.'}`
  }));

  return (
    <div className="h-full w-full p-8 rounded-xl bg-[#111111] border border-recon-borderDefault flex flex-col hover:border-[#333333] transition-colors shadow-lg">
      
      {/* HEADER: Bold and Wide */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#222222]">
        <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.3em]">
          {isReportView ? 'Final Scan Report' : 'Live Scan Feed'}
        </h2>
        <span className={`w-2.5 h-2.5 rounded-full bg-recon-accentGreen shadow-[0_0_10px_rgba(26,107,58,1)] ${!isReportView ? 'animate-pulse' : ''}`}></span>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
        {displayData.length === 0 ? (
           <div className="flex h-full items-center justify-center text-recon-accentGreen font-mono font-bold text-sm tracking-widest opacity-80 mt-10">
             [ SYSTEM READY — AWAITING TARGET ]
           </div>
        ) : (
          displayData.map((item) => (
            <div key={item.id} className="flex flex-col border border-recon-borderDefault rounded-lg overflow-hidden bg-black/40 hover:bg-black/60 transition-colors">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold font-mono text-sm w-4 text-center">
                    {item.severity === 'Pass' ? '✓' : '⚠'}
                  </span>
                  <span className="text-sm font-semibold text-gray-100 tracking-wide">
                    {item.name}
                  </span>
                </div>
                {item.severity !== 'Pass' && (
                  <SeverityBadge severity={item.severity} />
                )}
                {item.severity === 'Pass' && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded text-recon-lowGreen border border-recon-lowGreen/20 bg-recon-lowGreen/5">
                    PASS
                  </span>
                )}
              </div>

              {/* Evidence Panel */}
              {expandedId === item.id && item.evidence && (
                <div className="p-5 bg-black border-t border-[#222222]">
                  <pre className="text-gray-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                    {item.evidence}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600 mt-6 text-center">
        ↑ Click row for details
      </p>
    </div>
  );
}