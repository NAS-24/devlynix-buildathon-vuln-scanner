'use client';
import React from 'react';
import ScanInput from './ScanInput';
import RiskScoreCell from './RiskScoreCell';
import VulnCard from './VulnCard';
import LiveFeed from './LiveFeed';
import ShareCell from './ShareCell';

interface ReportData {
  report_id: string;
  target_url: string;
  risk_score: number;
  radar_scores: any;
  vulnerabilities: any[];
}

interface BentoGridProps {
  reportData?: ReportData;
  isReportView?: boolean;
}

export default function BentoGrid({ reportData, isReportView = false }: BentoGridProps) {
  
  // Smart Sort: Put FAILED checks at the front of the list, then slice the top 3
  const sortedVulns = reportData?.vulnerabilities
    ? [...reportData.vulnerabilities].sort((a, b) => {
        if (a.passed === b.passed) return 0;
        return a.passed ? 1 : -1; // Fails come before Passes
      })
    : [];

  const topVulnerabilities = sortedVulns.length > 0 ? sortedVulns.slice(0, 3) : [
    {
      check_name: 'Content Security Policy (CSP)',
      severity: 'Critical',
      status: 'FAIL',
      description: 'The CSP header is missing. This leaves the application highly vulnerable to Cross-Site Scripting (XSS) and data injection.',
      tier: 1
    },
    {
      check_name: 'Reflected XSS',
      severity: 'High',
      status: 'FAIL',
      description: 'Payload reflected in response body without sanitization. Target is vulnerable to script injection.',
      tier: 2
    },
    {
      check_name: 'Outdated Dependencies',
      severity: 'High',
      status: 'FAIL',
      description: '4 vulnerable packages found. lodash@4.17.4 and express@4.17.0 require immediate patching.',
      tier: 3
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-12">
      
      {/* ROW 1: Scan Input (Hidden on Report View) */}
      {!isReportView && (
        <div className="w-full mb-2">
          <ScanInput onScan={(url) => console.log('Scanning:', url)} />
        </div>
      )}

      {/* ROW 2: Risk Score & Top Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Risk Score Span 1 Col */}
        <div className="col-span-1">
          <RiskScoreCell 
            realScore={reportData?.risk_score} 
            realRadar={reportData?.radar_scores} 
            vulnerabilities={reportData?.vulnerabilities}
          />
        </div>

        {/* Vuln Cards Span 3 Cols */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {topVulnerabilities.map((vuln: any, idx: number) => (
            <div key={idx} className="h-full">
              <VulnCard result={{
                check_name: vuln.vulnerability_name || vuln.check_name,
                severity: vuln.passed ? 'Pass' : vuln.severity,
                status: vuln.passed ? 'PASS' : 'FAIL',
                description: vuln.description,
                tier: vuln.tier || 2
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: Live Feed & Share Options */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Live Feed Span 3 Cols */}
        {/* Giving it a min-height so the scrollable area looks good */}
        <div className="col-span-1 lg:col-span-3 min-h-[450px]">
          <LiveFeed isReportView={isReportView} results={reportData?.vulnerabilities} />
        </div>

        {/* Share Report Span 1 Col */}
        <div className="col-span-1">
          <ShareCell reportId={reportData?.report_id} />
        </div>
      </div>

    </div>
  );
}