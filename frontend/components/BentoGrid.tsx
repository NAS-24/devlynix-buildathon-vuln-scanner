
'use client';

import React from 'react';
import VulnCard from './VulnCard';
import ScanInput from './ScanInput';
import RiskScoreCell from './RiskScoreCell';

// Temporary dummy data to test the UI before we wire the FastAPI backend
const DUMMY_RESULTS = [
  {
    check_name: 'Content Security Policy (CSP)',
    severity: 'Critical' as const,
    status: 'FAIL' as const,
    description: 'The CSP header is missing. This leaves the application highly vulnerable to Cross-Site Scripting (XSS) and data injection.',
    tier: 1 as const,
  },
  {
    check_name: 'Reflected XSS',
    severity: 'High' as const,
    status: 'FAIL' as const,
    description: 'Payload reflected in response body without sanitization. Target is vulnerable to script injection.',
    tier: 2 as const,
  },
  {
    check_name: 'Outdated Dependencies',
    severity: 'High' as const,
    status: 'FAIL' as const,
    description: '4 vulnerable packages found. lodash@4.17.4 and express@4.17.0 require immediate patching.',
    tier: 3 as const,
  }
];

export default function BentoGrid() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-min">
        
        {/* ROW 1: Top Bar */}
        <div className="col-span-1 md:col-span-4">
          <ScanInput onScan={(url) => console.log('Scanning:', url)} />
        </div>

        {/* ROW 2: Risk Score Placeholder */}
        <div className="col-span-1 md:row-span-2">
          <RiskScoreCell 
            score={42} 
            counts={{ critical: 2, high: 3, medium: 1, low: 1 }} 
          />
        </div>

        {/* ROW 2: Vulnerability Cards */}
        <div className="col-span-1">
          <VulnCard result={DUMMY_RESULTS[0]} />
        </div>
        <div className="col-span-1">
          <VulnCard result={DUMMY_RESULTS[1]} />
        </div>
        <div className="col-span-1">
          <VulnCard result={DUMMY_RESULTS[2]} />
        </div>

        {/* ROW 3: Live Feed & Share Report Placeholders */}
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