'use client';
import React, { useState } from 'react';

type SolveMode = 'guide' | 'direct' | 'patch';

interface SolvePanelProps {
  checkName: string;
  description: string;
  onClose: () => void;
  onRecheck: () => void;
  isChecking: boolean;
}

export default function SolvePanel({ checkName, description, onClose, onRecheck, isChecking }: SolvePanelProps) {
  const [activeMode, setActiveMode] = useState<SolveMode>('guide');
  const [copied, setCopied] = useState(false);

  const handleAction = () => {
    if (activeMode === 'patch') {
      navigator.clipboard.writeText('"lodash": "4.17.21"');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      className="absolute inset-0 z-20 bg-[#1A2A1E] border border-recon-accentGreen p-5 flex flex-col cursor-default rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-recon-textPrimary font-medium text-[14px] leading-tight pr-4">{checkName}</h3>
        <button onClick={onClose} className="text-recon-textMuted hover:text-recon-textPrimary transition-colors">
          ✕
        </button>
      </div>

      <p className="text-[11px] text-recon-textMuted leading-relaxed mb-4 line-clamp-2">
        {description}
      </p>

      {/* Mode Selector Chips */}
      <div className="flex gap-2 mb-4">
        <ModeChip label="Guide Me" isActive={activeMode === 'guide'} onClick={() => setActiveMode('guide')} />
        <ModeChip label="Direct Me" isActive={activeMode === 'direct'} onClick={() => setActiveMode('direct')} />
        <ModeChip label="Fix It For Me" isActive={activeMode === 'patch'} onClick={() => setActiveMode('patch')} />
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto mb-4 border border-recon-borderDefault rounded bg-recon-codeBg p-3">
        {activeMode === 'guide' && (
          <div className="text-[10px] font-mono text-recon-codeText">
            <span className="text-recon-textHint"># nginx — add to your server block:</span><br/>
            add_header Content-Security-Policy<br/>
            "default-src 'self';" always;
          </div>
        )}
        {activeMode === 'direct' && (
          <div className="text-[10px] font-mono text-recon-codeText flex flex-col gap-2">
            <span className="text-recon-textHint"># Run this in your project root:</span>
            <span className="text-recon-textPrimary">npm install lodash@4.17.21</span>
            <a href="#" className="text-recon-accentGreen hover:underline mt-1">↳ View CVE-2019-10744 details</a>
          </div>
        )}
        {activeMode === 'patch' && (
          <div className="text-[10px] font-mono flex flex-col">
            <span className="text-recon-textHint mb-2">// package.json diff</span>
            <span className="text-recon-critRed bg-[#3A1A1A]/50 px-1">- "lodash": "4.17.4",</span>
            <span className="text-recon-lowGreen bg-[#1A3A1A]/50 px-1">+ "lodash": "4.17.21",</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto flex flex-col gap-2">
        <button 
          onClick={handleAction}
          className="w-full bg-recon-accentGreen text-white text-[11px] font-bold tracking-widest py-2.5 rounded uppercase hover:bg-recon-accentGreenLight transition-colors flex items-center justify-center gap-2"
        >
          <span>🔧</span> {copied ? 'PATCH COPIED!' : 'SOLVE THIS'}
        </button>
        <button 
          onClick={onRecheck}
          disabled={isChecking}
          className={`w-full text-[10px] font-bold tracking-widest py-2 rounded uppercase transition-colors border ${
            isChecking 
              ? 'border-recon-borderDefault text-recon-textHint cursor-not-allowed' 
              : 'border-recon-borderDefault text-recon-textMuted hover:text-recon-textPrimary hover:border-recon-textMuted'
          }`}
        >
          {isChecking ? 'RE-CHECKING...' : 'RE-CHECK THIS'}
        </button>
      </div>
    </div>
  );
}

function ModeChip({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[9px] px-2 py-1 rounded transition-colors border ${
        isActive 
          ? 'bg-recon-accentGreen text-white border-recon-accentGreen' 
          : 'bg-transparent text-recon-accentGreen border-recon-accentGreen/50 hover:border-recon-accentGreen'
      }`}
    >
      {label}
    </button>
  );
}