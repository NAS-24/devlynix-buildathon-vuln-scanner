'use client';
import React, { useState } from 'react';

// Added 'disabled' to props
export default function ScanInput({ 
  onScan, 
  disabled 
}: { 
  onScan: (url: string) => void, 
  disabled: boolean 
}) {
  const [targetUrl, setTargetUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetUrl && !disabled) {
      onScan(targetUrl);
    }
  };

  return (
    <div className="w-full h-full min-h-[100px] flex items-center justify-between p-6 bg-[#111111] border border-[#222222] rounded-xl hover:border-recon-accentGreen/30 transition-colors">
      <div className="flex items-center gap-6 w-full">
        {/* Brand Logo */}
        <span className="text-recon-accentGreen font-black tracking-[0.2em] text-sm hidden md:block">
          RECON
        </span>
        
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={disabled} // Disable input while scanning
            placeholder="https://example-app.com or https://github.com/user/repo"
            className={`flex-1 w-full bg-[#0a0a0a] border border-[#222222] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-recon-accentGreen transition-all font-mono text-xs ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            required
            suppressHydrationWarning={true} // Silences the hydration error
          />
          
          <span className="text-gray-600 text-[10px] hidden lg:block whitespace-nowrap uppercase tracking-widest font-bold">
            or GitHub URL
          </span>
          
          <button
            type="submit"
            disabled={disabled}
            className={`w-full sm:w-auto px-8 py-3 rounded-lg font-black tracking-[0.2em] text-[11px] uppercase transition-all duration-300 flex items-center justify-center min-w-[140px] ${
              disabled
                ? 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed border border-[#222222]'
                : 'bg-recon-accentGreen hover:bg-white text-black hover:text-recon-accentGreen'
            }`}
          >
            {disabled ? 'SCANNING...' : 'SCAN'}
          </button>
        </form>
      </div>
    </div>
  );
}