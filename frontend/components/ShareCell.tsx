'use client';
import React, { useState, useEffect } from 'react';

interface ScanHistoryItem {
  target_url: string;
  report_id: string;
  timestamp: string;
}

export default function ShareCell({ reportId, results = [] }: any) {
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [origin, setOrigin] = useState<string | null>(null);
  
  const isReady = !!reportId;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shareUrl = isReady && origin ? `${origin}/report/${reportId}` : null;

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    fetch(`http://127.0.0.1:8000/api/reports/history?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error("Failed to load history", err));
  }, []);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJsonExport = () => {
    if (!results.length) return;
    const blob = new Blob([JSON.stringify({ reportId, results }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-report-${reportId}.json`;
    a.click();
  };

  return (
    // We add a specific 'print:hidden' class here so the download box doesn't show up in the PDF
    <div className="w-full p-8 rounded-xl bg-[#111111] border border-[#222222] shadow-lg print:hidden">
      <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Share Report</h2>
      
      <div className="flex items-center justify-between bg-black border border-[#222222] p-4 rounded-lg mb-6">
        <span className={`font-mono text-xs font-bold tracking-widest truncate mr-4 ${isReady ? 'text-recon-accentGreen' : 'text-gray-700'}`}>
          {shareUrl ?? 'Scan a target to generate a report link'}
        </span>
        <button onClick={handleCopy} disabled={!isReady} className="text-[9px] font-black uppercase px-4 py-2 bg-[#222222] hover:bg-[#333333] text-white rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        {/* Reverted back to the native window.print() */}
        <button onClick={() => window.print()} className="flex-1 py-4 border border-[#222222] rounded-lg hover:border-white text-gray-400 hover:text-white transition-all text-[9px] font-black uppercase cursor-pointer">
          PDF
        </button>
        <button onClick={handleJsonExport} disabled={!results.length} className="flex-1 py-4 border border-[#222222] rounded-lg hover:border-white text-gray-400 hover:text-white transition-all text-[9px] font-black uppercase disabled:opacity-30 disabled:cursor-not-allowed">
          JSON
        </button>
      </div>

      <div className="pt-6 border-t border-[#222222]">
        <h3 className="text-white font-bold text-[9px] uppercase mb-4 opacity-60">Recent Scans</h3>
        <div className="flex flex-col gap-2">
          {history.length > 0 ? history.map((item) => (
            <div key={item.report_id} onClick={() => window.location.href = `/report/${item.report_id}`} 
                 className="flex justify-between p-2 rounded hover:bg-[#1a1a1a] cursor-pointer">
              <span className="text-gray-400 text-[11px] font-mono truncate">{item.target_url}</span>
              <span className="text-[10px] text-gray-600">{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
          )) : (
            <span className="text-[10px] text-gray-600 italic">No previous scans found.</span>
          )}
        </div>
      </div>
    </div>
  );
}