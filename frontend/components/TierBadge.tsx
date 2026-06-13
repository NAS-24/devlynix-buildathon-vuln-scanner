import React from 'react';

interface TierBadgeProps {
  tier: 1 | 2 | 3;
}

export default function TierBadge({ tier }: TierBadgeProps) {
  return (
    <span className="inline-flex items-center justify-center px-[6px] py-[1px] rounded-[3px] bg-[#1A2A1A] text-recon-accentGreen border border-recon-accentGreen text-[9px] font-mono tracking-widest uppercase">
      T{tier}
    </span>
  );
}