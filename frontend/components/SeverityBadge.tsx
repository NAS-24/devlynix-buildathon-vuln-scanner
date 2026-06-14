'use client';
import React from 'react';

// 1. Add 'Info' to this type list!
type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' | 'Pass';

interface SeverityBadgeProps {
  severity: Severity;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  // 2. Add a color mapping for Info so it renders nicely
  const styles = {
    Critical: 'text-recon-critRed border-recon-critRed/20 bg-recon-critRed/5',
    High: 'text-recon-highOrange border-recon-highOrange/20 bg-recon-highOrange/5',
    Medium: 'text-recon-medYellow border-recon-medYellow/20 bg-recon-medYellow/5',
    Low: 'text-recon-lowGreen border-recon-lowGreen/20 bg-recon-lowGreen/5',
    Info: 'text-recon-textMuted border-recon-borderDefault bg-recon-bgSurface', // New Info Style
    Pass: 'text-recon-lowGreen border-recon-lowGreen/20 bg-recon-lowGreen/5',
  };

  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${styles[severity]}`}>
      {severity}
    </span>
  );
}