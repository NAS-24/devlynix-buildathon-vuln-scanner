'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';

interface LiveFeedProps {
  isReportView?: boolean;
  results?: any[];
  isComplete?: boolean;  // FIX 5: stops pulse when scan is done
}

export default function LiveFeed({
  isReportView = false,
  results = [],
  isComplete = false,
}: LiveFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // FIX 2 + 4: use name as key, extract owasp_ref
  const displayData = results.map((r) => ({
    id:          r.vulnerability_name || r.check_name || 'unknown',
    name:        r.vulnerability_name || r.check_name || 'Unknown Probe',
    severity: r.passed ? 'Pass' : (r.severity as 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' | 'Pass'),
    passed:      r.passed,
    owasp:       r.owasp_ref || null,       // FIX 4: capture owasp ref
    description: r.description || '',
    remediation: r.remediation || null,
  }));

  const isPulsing = !isReportView && !isComplete;

  return (
    <div className="h-full w-full p-8 rounded-xl bg-[#111111] border border-recon-borderDefault flex flex-col hover:border-[#333333] transition-colors shadow-lg">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#222222]">
        <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.3em]">
          {isReportView ? 'Final Scan Report' : 'Live Scan Feed'}
        </h2>
        {/* FIX 5: pulse stops when scan is complete */}
        <span className={`w-2.5 h-2.5 rounded-full bg-recon-accentGreen shadow-[0_0_10px_rgba(26,107,58,1)] ${isPulsing ? 'animate-pulse' : ''}`} />
        {isComplete && (
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-recon-accentGreen ml-auto">
            Scan complete
          </span>
        )}
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
        {displayData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-recon-accentGreen font-mono font-bold text-sm tracking-widest opacity-80 mt-10">
            [ SYSTEM READY — AWAITING TARGET ]
          </div>
        ) : (
          displayData.map((item) => (
            <div
              key={item.id}  // FIX 2: stable key, not index
              className="flex flex-col border border-recon-borderDefault rounded-lg overflow-hidden bg-black/40 hover:bg-black/60 transition-colors"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <span className={`font-bold font-mono text-sm w-4 text-center ${item.passed ? 'text-recon-accentGreen' : 'text-recon-critRed'}`}>
                    {item.passed ? '✓' : '✕'}
                  </span>

                  {/* FIX 1: Name + OWASP ref stacked */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-gray-100 tracking-wide">
                      {item.name}
                    </span>
                    {item.owasp && (
                      <span className="text-[10px] text-gray-600 font-mono">
                        {item.owasp}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge */}
                {item.passed ? (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded text-recon-lowGreen border border-recon-lowGreen/20 bg-recon-lowGreen/5 shrink-0">
                    PASS
                  </span>
                ) : (
                  <SeverityBadge severity={item.severity} />
                )}
              </div>

              {/* FIX 3: Expanded panel — description and remediation separated */}
              {expandedId === item.id && (
                <div className="p-5 bg-black border-t border-[#222222] flex flex-col gap-4">

                  {/* Description */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-2">
                      Finding
                    </p>
                    <p className="text-gray-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>

                  {/* Remediation — only if present and check failed */}
                  {!item.passed && item.remediation && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-recon-accentGreen mb-2">
                        Remediation
                      </p>
                      <p className="text-gray-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                        {item.remediation}
                      </p>
                    </div>
                  )}

                  {/* OWASP link if available */}
                  {item.owasp && (
                    <p className="text-[9px] text-gray-700 font-mono">
                      {item.owasp}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600 mt-6 text-center">
        ↑ click row for details
      </p>
    </div>
  );
}