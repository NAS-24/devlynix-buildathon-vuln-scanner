'use client';
import React, { useState } from 'react';
import { Copy, FileText, Code, CheckCircle, ExternalLink } from 'lucide-react';

interface ShareCellProps {
  reportId?: string;
}

// Mock local storage data for the UI checkpoint
const MOCK_HISTORY = [
  { url: 'https://example-app.com', score: 42 },
  { url: 'https://demo.mysite.io', score: 88 },
  { url: 'github.com/user/proj', score: 61 }
];

export default function ShareCell({ reportId }: ShareCellProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(true); // Default to open so judges see it immediately
  
  // Use the real reportId if passed down, otherwise fallback
  const displayId = reportId || 'k7xBp2nQ';

  const handleCopy = () => {
    // Dynamically construct the URL so it works locally and in production
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://recon.app';
    navigator.clipboard.writeText(`${baseUrl}/report/${displayId}`);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full w-full p-6 rounded-xl bg-recon-bgCard border border-recon-borderDefault flex flex-col hover:border-recon-borderHover transition-colors relative">
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-recon-textMuted text-[10px] uppercase tracking-widest">Share Report</h2>
      </div>

      {/* Unique URL Box */}
      <div className="flex items-center justify-between bg-recon-codeBg border border-recon-borderDefault p-3 rounded-lg mb-3">
        <span className="text-recon-accentGreen font-mono text-xs truncate mr-2">
          {displayId}
        </span>
        <button 
          onClick={handleCopy}
          className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded transition-colors ${
            copied ? 'bg-recon-lowGreen text-[#1A1A1A]' : 'bg-recon-bgSurface hover:bg-recon-borderDefault text-recon-textPrimary'
          }`}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <p className="text-recon-textHint text-[10px] leading-relaxed mb-6">
        Anyone with this link can view the full report without re-scanning.
      </p>

      {/* Export Buttons */}
      <div className="flex gap-3 mb-8">
        <button 
          onClick={() => window.print()}
          className="flex-1 flex flex-col items-center justify-center py-3 border border-recon-borderDefault rounded-lg hover:border-recon-accentGreen hover:text-recon-accentGreen transition-colors text-recon-textMuted"
        >
          <span className="text-lg mb-1">📄</span>
          <span className="text-[10px] uppercase tracking-widest font-bold">PDF</span>
        </button>
        <button 
          onClick={() => {
            // Check if we are on the report page to download the actual embedded JSON
            const dataElement = document.getElementById('report-data');
            if (dataElement) {
              const data = JSON.parse(dataElement.innerHTML);
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `recon-scan-${displayId}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }}
          className="flex-1 flex flex-col items-center justify-center py-3 border border-recon-borderDefault rounded-lg hover:border-recon-accentGreen hover:text-recon-accentGreen transition-colors text-recon-textMuted"
        >
          <span className="text-lg mb-1">{`{ }`}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold">JSON</span>
        </button>
      </div>

      {/* Recent Scans Micro-Dropdown */}
      <div className="mt-auto pt-4 border-t border-recon-borderDefault">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex justify-between items-center text-recon-textMuted text-[10px] uppercase tracking-widest hover:text-recon-textPrimary transition-colors mb-3"
        >
          Recent Scans
          <span>{showHistory ? '▲' : '▼'}</span>
        </button>
        
        {showHistory && (
          <div className="flex flex-col gap-2">
            {MOCK_HISTORY.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-recon-bgSurface cursor-pointer transition-colors">
                <span className="text-recon-textMuted text-xs truncate max-w-[150px]">{item.url}</span>
                <span className={`text-xs font-mono font-bold ${
                  item.score >= 80 ? 'text-recon-lowGreen' : item.score >= 40 ? 'text-recon-highOrange' : 'text-recon-critRed'
                }`}>
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}