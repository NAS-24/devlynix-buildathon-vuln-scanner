'use client';
import React, { useState, useEffect } from 'react';

interface ScanHistoryItem {
  url:   string;
  score: number;
  id:    string;
}

interface ShareCellProps {
  reportId?:   string;
  targetUrl?:  string;
  score?:      number;
  results?:    any[];
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://recon.app';
const HISTORY_KEY = 'recon_scan_history';

export default function ShareCell({
  reportId,
  targetUrl,
  score,
  results = [],
}: ShareCellProps) {
  const [copied,  setCopied]  = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  const isReady   = !!reportId;
  const shareUrl  = isReady ? `${BASE_URL}/report/${reportId}` : null;

  // ── Load history from localStorage on mount ───────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  // ── Save new scan to history when reportId arrives ────────────
  useEffect(() => {
    if (!reportId || !targetUrl || score === undefined) return;
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      const prev: ScanHistoryItem[] = stored ? JSON.parse(stored) : [];
      // Deduplicate by reportId
      const filtered = prev.filter(h => h.id !== reportId);
      const updated  = [{ url: targetUrl, score, id: reportId }, ...filtered].slice(0, 5);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
    } catch {}
  }, [reportId, targetUrl, score]);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── JSON export — download current scan results ───────────────
  const handleJsonExport = () => {
    if (!results.length) return;
    const blob = new Blob([JSON.stringify({ reportId, targetUrl, score, results }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `recon-report-${reportId ?? 'scan'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfExport = () => {
    window.print();
  };

  return (
    <div className="w-full p-8 rounded-xl bg-[#111111] border border-recon-borderDefault flex flex-col hover:border-[#333333] transition-colors shadow-lg">

      {/* Header */}
      <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-6">
        Share Report
      </h2>

      {/* URL box */}
      <div className="flex items-center justify-between bg-black border border-[#222222] p-4 rounded-lg mb-3">
        <span className={`font-mono text-xs font-bold tracking-widest truncate mr-4 ${isReady ? 'text-recon-accentGreen' : 'text-gray-700'}`}>
          {shareUrl ?? (isReady ? '...' : 'Scan a target to generate a report link')}
        </span>
        <button
          onClick={handleCopy}
          disabled={!isReady}
          className={`shrink-0 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded transition-colors ${
            !isReady
              ? 'opacity-30 cursor-not-allowed bg-[#222222] text-gray-500'
              : copied
              ? 'bg-recon-lowGreen text-black'
              : 'bg-[#222222] hover:bg-[#333333] text-white'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <p className="text-gray-500 font-medium text-[11px] leading-relaxed mb-6">
        Anyone with this link can view the full report without re-scanning.
      </p>

      {/* Export buttons — functional */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handlePdfExport}
          className="flex-1 flex flex-col items-center justify-center py-4 border border-[#222222] rounded-lg hover:border-white transition-all text-gray-400 hover:text-white"
        >
          <span className="text-xl mb-2">📄</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">PDF</span>
        </button>
        <button
          onClick={handleJsonExport}
          disabled={!results.length}
          className={`flex-1 flex flex-col items-center justify-center py-4 border border-[#222222] rounded-lg transition-all ${
            results.length
              ? 'hover:border-white text-gray-400 hover:text-white cursor-pointer'
              : 'opacity-30 cursor-not-allowed text-gray-600'
          }`}
        >
          <span className="text-xl mb-2">{`{ }`}</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">JSON</span>
        </button>
      </div>

      {/* Recent scans — from localStorage */}
      <div className="pt-6 border-t border-[#222222]">
        <h3 className="text-white font-bold text-[9px] uppercase tracking-[0.2em] mb-4 opacity-60">
          Recent Scans
        </h3>
        <div className="flex flex-col gap-2">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => window.open(`/report/${item.id}`, '_blank')}
                className="flex justify-between items-center p-2 rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
              >
                <span className="text-gray-400 text-[11px] font-mono truncate max-w-[200px] group-hover:text-white transition-colors">
                  {item.url}
                </span>
                <span className={`text-[11px] font-black font-mono shrink-0 ml-3 ${
                  item.score >= 80 ? 'text-recon-lowGreen'
                  : item.score >= 40 ? 'text-recon-highOrange'
                  : 'text-recon-critRed'
                }`}>
                  {item.score}
                </span>
              </div>
            ))
          ) : (
            <span className="text-[10px] text-gray-600 italic">
              Previous scans will appear here.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}