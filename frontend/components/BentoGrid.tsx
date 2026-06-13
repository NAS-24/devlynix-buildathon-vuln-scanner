import React from 'react';

export default function BentoGrid() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* The Core Grid
        Mobile: 1 column
        Desktop: 4 columns, auto rows
      */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-min">
        
        {/* ROW 1: Top Bar (Spans all 4 columns) */}
        <div className="col-span-1 md:col-span-4 min-h-[100px] border border-dashed border-recon-borderDefault rounded-xl bg-recon-bgCard/30 flex items-center justify-center">
          <span className="text-recon-textMuted font-mono text-sm">[ ScanInput Component Goes Here ]</span>
        </div>

        {/* ROW 2: Risk Score (Spans 1 col, 2 rows tall) */}
        <div className="col-span-1 md:row-span-2 min-h-[400px] border border-dashed border-recon-borderDefault rounded-xl bg-recon-bgCard/30 flex items-center justify-center">
          <span className="text-recon-textMuted font-mono text-sm text-center">[ RiskScoreCell <br/> (Score & Radar) ]</span>
        </div>

        {/* ROW 2: The 3 Vulnerability Cards */}
        <div className="col-span-1 min-h-[180px] border border-dashed border-recon-borderDefault rounded-xl bg-recon-bgCard/30 flex items-center justify-center">
          <span className="text-recon-textMuted font-mono text-sm">[ CSP Card ]</span>
        </div>
        <div className="col-span-1 min-h-[180px] border border-dashed border-recon-borderDefault rounded-xl bg-recon-bgCard/30 flex items-center justify-center">
          <span className="text-recon-textMuted font-mono text-sm">[ XSS Card ]</span>
        </div>
        <div className="col-span-1 min-h-[180px] border border-dashed border-recon-borderDefault rounded-xl bg-recon-bgCard/30 flex items-center justify-center">
          <span className="text-recon-textMuted font-mono text-sm">[ CVE Card ]</span>
        </div>

        {/* ROW 3: Live Feed & Share Report */}
        <div className="col-span-1 md:col-span-2 min-h-[200px] border border-dashed border-recon-borderDefault rounded-xl bg-recon-bgCard/30 flex items-center justify-center">
          <span className="text-recon-textMuted font-mono text-sm">[ LiveFeed Stream ]</span>
        </div>
        <div className="col-span-1 min-h-[200px] border border-dashed border-recon-borderDefault rounded-xl bg-recon-bgCard/30 flex items-center justify-center">
          <span className="text-recon-textMuted font-mono text-sm">[ Share Report ]</span>
        </div>

      </div>
    </div>
  );
}