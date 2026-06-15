'use client';
import React, { useState } from 'react';

type SolveMode = 'guide' | 'direct' | 'patch';

interface SolvePanelProps {
  checkName: string;
  description: string;
  owasp?: string;      // Added
  remediation?: string; // Added
  onClose: () => void;
  onRecheck: () => void;
  isChecking: boolean;
}

export default function SolvePanel({ 
  checkName, 
  description, 
  owasp, 
  remediation, 
  onClose, 
  onRecheck, 
  isChecking 
}: SolvePanelProps) {
  const [activeMode, setActiveMode] = useState<SolveMode>('guide');
  const [copied, setCopied] = useState(false);

  const handleAction = () => {
    // Dynamically copy remediation or default patch string
    const textToCopy = remediation || '"patch": "applied"';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="absolute inset-0 z-20 bg-[#1A2A1E] border border-recon-accentGreen p-5 flex flex-col cursor-default rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-recon-textPrimary font-medium text-[14px] leading-tight pr-4">{checkName}</h3>
        <button onClick={onClose} className="text-recon-textMuted hover:text-recon-textPrimary transition-colors">✕</button>
      </div>

      <p className="text-[11px] text-recon-textMuted leading-relaxed mb-4 line-clamp-2">
        {description}
      </p>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <ModeChip label="Guide" isActive={activeMode === 'guide'} onClick={() => setActiveMode('guide')} />
        <ModeChip label="Direct" isActive={activeMode === 'direct'} onClick={() => setActiveMode('direct')} />
        <ModeChip label="Patch" isActive={activeMode === 'patch'} onClick={() => setActiveMode('patch')} />
      </div>

      <div className="flex-1 overflow-y-auto mb-4 border border-recon-borderDefault rounded bg-recon-codeBg p-3 text-[10px] font-mono">
        {activeMode === 'guide' && <div className="text-recon-codeText">{description}</div>}
        {activeMode === 'direct' && <div className="text-recon-accentGreen">{remediation || "Follow security best practices for this finding."}</div>}
        {activeMode === 'patch' && <div className="text-recon-lowGreen">{remediation || "No automated patch available."}</div>}
      </div>

      {/* OWASP Reference */}
      {owasp && <p className="text-[9px] text-recon-textHint font-mono mb-4">{owasp}</p>}

      <div className="mt-auto flex flex-col gap-2">
        <button 
          onClick={handleAction}
          className="w-full bg-recon-accentGreen text-white text-[11px] font-bold tracking-widest py-2.5 rounded uppercase hover:bg-recon-accentGreenLight transition-colors"
        >
          {copied ? 'COPIED!' : 'COPY REMEDIATION'}
        </button>
        <button 
          onClick={onRecheck}
          disabled={isChecking}
          className="w-full text-[10px] font-bold py-2 rounded uppercase border border-recon-borderDefault text-recon-textMuted hover:text-recon-textPrimary transition-colors"
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
      className={`text-[9px] px-2 py-1 rounded border transition-colors ${
        isActive 
          ? 'bg-recon-accentGreen text-white border-recon-accentGreen' 
          : 'bg-transparent text-recon-accentGreen border-recon-accentGreen/50'
      }`}
    >
      {label}
    </button>
  );
}