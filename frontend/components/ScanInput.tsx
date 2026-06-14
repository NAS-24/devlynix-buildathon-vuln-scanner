'use client';
import React, { useState } from 'react';

export default function ScanInput({ onScan }: { onScan: (url: string) => void }) {
  const [targetUrl, setTargetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetUrl) {
      setIsLoading(true);
      onScan(targetUrl);
      // Simulate a quick scan delay for the UI mockup phase
      setTimeout(() => setIsLoading(false), 2000); 
    }
  };

  return (
    <div className="w-full h-full min-h-[100px] flex items-center justify-between p-6 bg-recon-bgCard border border-recon-borderDefault rounded-xl hover:border-recon-borderHover transition-colors">
      <div className="flex items-center gap-4 w-full">
        {/* Brand Logo */}
        <span className="text-recon-accentGreen font-bold tracking-widest text-lg hidden md:block">
          RECON
        </span>
        
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example-app.com or https://github.com/user/repo"
            className="flex-1 w-full bg-recon-bgSurface border border-recon-borderDefault text-recon-textPrimary px-4 py-3 rounded-lg focus:outline-none focus:border-recon-accentGreen focus:ring-1 focus:ring-recon-accentGreen font-mono text-sm placeholder-recon-textHint transition-all"
            required
          />
          <span className="text-recon-textMuted text-xs hidden lg:block whitespace-nowrap">
            or GitHub URL
          </span>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold tracking-widest text-sm transition-all duration-200 uppercase flex items-center justify-center min-w-[140px] ${
              isLoading
                ? 'bg-recon-bgSurface text-recon-textMuted cursor-not-allowed border border-recon-borderDefault'
                : 'bg-recon-accentGreen hover:bg-recon-accentGreenLight text-white border border-transparent'
            }`}
          >
            {isLoading ? 'SCANNING...' : 'SCAN'}
          </button>
        </form>
      </div>
    </div>
  );
}