'use client';
import React, { useState } from 'react';

interface ScanHistoryItem {
  url: string;
  score: number;
}

interface ShareCellProps {
  reportId?: string;
  history?: ScanHistoryItem[];
}

export default function ShareCell({ reportId, history = [] }: ShareCellProps) {
  const [copied, setCopied] = useState(false);
  
  
  const displayId = reportId || '...'; 
  const isReady = !!reportId;

  const handleCopy = () => {
    if (!reportId) return; 
    navigator.clipboard.writeText(reportId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full p-8 rounded-xl bg-[#111111] border border-recon-borderDefault flex flex-col hover:border-[#333333] transition-colors shadow-lg">
      
      {/* HEADER */}
      <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-8">
        Share Report
      </h2>

      {/* URL BOX */}
        <div className="flex items-center justify-between bg-black border border-[#222222] p-4 rounded-lg mb-4">
            <span className={`font-mono text-xs font-bold tracking-widest truncate mr-4 ${isReady ? 'text-recon-accentGreen' : 'text-gray-700'}`}>
            {displayId}
            </span>
            <button 
            onClick={handleCopy}
            disabled={!isReady} // 2. Disable button if no report yet
            className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded transition-colors ${
                !isReady ? 'opacity-30 cursor-not-allowed bg-[#222222] text-gray-500' :
                copied ? 'bg-recon-lowGreen text-black' : 'bg-[#222222] hover:bg-[#333333] text-white'
            }`}
            >
            {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>

      <p className="text-gray-500 font-medium text-[11px] leading-relaxed mb-8">
        Anyone with this link can view the full report without re-scanning.
      </p>

      {/* EXPORT BUTTONS */}
      <div className="flex gap-4 mb-8">
        <button className="flex-1 flex flex-col items-center justify-center py-4 border border-[#222222] rounded-lg hover:border-white transition-all text-gray-400 hover:text-white">
          <span className="text-xl mb-2">📄</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">PDF</span>
        </button>
        <button className="flex-1 flex flex-col items-center justify-center py-4 border border-[#222222] rounded-lg hover:border-white transition-all text-gray-400 hover:text-white">
          <span className="text-xl mb-2">{`{ }`}</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">JSON</span>
        </button>
      </div>

      {/* DYNAMIC RECENT SCANS */}
      <div className="mt-auto pt-6 border-t border-[#222222]">
        <h3 className="text-white font-bold text-[9px] uppercase tracking-[0.2em] mb-4 opacity-60">
          Recent Scans
        </h3>
        
        <div className="flex flex-col gap-3">
          {history.length > 0 ? (
            history.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                <span className="text-gray-300 text-[11px] font-medium truncate max-w-[140px]">{item.url}</span>
                <span className={`text-[11px] font-black font-mono ${
                  item.score >= 80 ? 'text-recon-lowGreen' : item.score >= 40 ? 'text-recon-highOrange' : 'text-recon-critRed'
                }`}>
                  {item.score}
                </span>
              </div>
            ))
          ) : (
            <span className="text-[10px] text-gray-600 italic">No recent scans yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}