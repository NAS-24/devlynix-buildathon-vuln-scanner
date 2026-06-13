import React from 'react';

type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Pass';

interface SeverityBadgeProps {
  severity: Severity;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const styles: Record<Severity, string> = {
    Critical: 'bg-[#3A1A1A] text-[#E74C3C]',
    High: 'bg-[#3A2A1A] text-recon-highOrange',
    Medium: 'bg-[#2A2A1A] text-recon-medYellow',
    Low: 'bg-[#1A2A1A] text-recon-lowGreen',
    Pass: 'bg-[#1A2A1A] text-recon-accentGreen',
  };

  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium tracking-wider uppercase ${styles[severity]}`}>
      {severity}
    </span>
  );
}