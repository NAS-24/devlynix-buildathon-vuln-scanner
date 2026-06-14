import React from 'react';

interface RiskScoreProps {
  score: number;
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export default function RiskScoreCell({ score, counts }: RiskScoreProps) {

  let ringColor = 'border-recon-critRed';
  let textColor = 'text-recon-critRed';
  let statusText = 'CRITICAL';

  if (score >= 80) {
    ringColor = 'border-recon-lowGreen';
    textColor = 'text-recon-lowGreen';
    statusText = 'SECURE';
  } else if (score >= 40) {
    ringColor = 'border-recon-highOrange';
    textColor = 'text-recon-highOrange';
    statusText = 'AT RISK';
  }

 
  const maxCount = Math.max(counts.critical, counts.high, counts.medium, counts.low, 1);

  return (
    <div className="h-full w-full p-6 rounded-xl bg-recon-bgCard border border-recon-borderDefault flex flex-col items-center relative overflow-hidden transition-colors hover:border-recon-borderHover">
      <h2 className="text-recon-textMuted text-[10px] uppercase tracking-widest w-full text-left mb-8">Risk Score</h2>

      {/* Circular Score Ring */}
      <div className={`w-32 h-32 rounded-full border-[4px] ${ringColor} flex flex-col items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
        <span className="text-4xl font-medium text-recon-textPrimary">{score}</span>
        <span className="text-[10px] text-recon-textHint mt-1">/ 100</span>
      </div>

      
      <span className={`text-sm font-bold tracking-wider mb-10 uppercase ${textColor}`}>
        {statusText}
      </span>

   
      <div className="w-full flex flex-col gap-4 mt-auto z-10">
        <BarRow label="Critical" count={counts.critical} max={maxCount} color="bg-recon-critRed" />
        <BarRow label="High" count={counts.high} max={maxCount} color="bg-recon-highOrange" />
        <BarRow label="Medium" count={counts.medium} max={maxCount} color="bg-recon-medYellow" />
        <BarRow label="Low" count={counts.low} max={maxCount} color="bg-recon-lowGreen" />
      </div>

      
      <div className="w-full mt-8 pt-6 border-t border-recon-borderDefault flex flex-col items-center">
         <span className="text-recon-textMuted text-[10px] uppercase tracking-widest mb-4 opacity-50">Category Radar Mapping</span>
         <div className="w-24 h-24 border border-dashed border-recon-borderDefault rounded-full flex items-center justify-center opacity-30">
            <span className="text-recon-textHint text-[10px] text-center">SVG<br/>Radar</span>
         </div>
      </div>
    </div>
  );
}

// Internal sub-component for the horizontal bars
function BarRow({ label, count, max, color }: { label: string, count: number, max: number, color: string }) {
  // Ensure the bar has at least a 5% sliver of width if the count is > 0 so it's visible
  const widthPercent = count === 0 ? 0 : Math.max(5, (count / max) * 100);
  
  return (
    <div className="flex items-center text-xs">
      <span className="w-16 text-recon-textMuted">{label}</span>
      <div className="flex-1 h-1.5 bg-recon-bgSurface rounded-full overflow-hidden mx-3">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${widthPercent}%` }}
        ></div>
      </div>
      <span className="w-4 text-right text-recon-textPrimary font-mono">{count}</span>
    </div>
  );
}