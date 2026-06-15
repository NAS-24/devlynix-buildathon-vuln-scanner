'use client';
import React, { useState, useRef } from 'react';
import ScanInput from './ScanInput';
import RiskScoreCell from './RiskScoreCell';
import VulnCard from './VulnCard';
import LiveFeed from './LiveFeed';
import ShareCell from './ShareCell';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1, info: 0,
};

const calculateLiveScore = (vulns: any[]) => {
  let score = 100;
  vulns.forEach(v => {
    if (v.passed === false) {
      const sev = v.severity?.toLowerCase();
      if (sev === 'critical') score -= 40;
      else if (sev === 'high') score -= 20;
      else if (sev === 'medium') score -= 10;
      else if (sev === 'low') score -= 5;
    }
  });
  return Math.max(0, score);
};

const getBottomCards = (vulns: any[]): any[] => {
  const failing = vulns
    .filter(v => v.passed === false)
    .sort((a, b) => (SEVERITY_ORDER[b.severity?.toLowerCase()] ?? 0) - (SEVERITY_ORDER[a.severity?.toLowerCase()] ?? 0));
  const passing = vulns.filter(v => v.passed === true);
  return [...failing, ...passing].slice(0, 3);
};

const getTier = (name: string): 1 | 2 | 3 => {
  const n = name?.toLowerCase() ?? '';
  if (n.includes('csp') || n.includes('hsts') || n.includes('frame') || n.includes('tls')) return 1;
  if (n.includes('xss') || n.includes('sqli') || n.includes('injection')) return 2;
  return 3;
};

export default function BentoGrid({ reportData, isReportView = false }: any) {
  const [liveVulns, setLiveVulns] = useState<any[]>(reportData?.vulnerabilities || []);
  const [liveScore, setLiveScore] = useState(reportData?.risk_score ?? 100);
  const [finishedReportId, setFinishedReportId] = useState<string>(reportData?.report_id ?? '');
  const [currentUrl, setCurrentUrl] = useState<string>(reportData?.target_url ?? '');
  
  const [isScanning, setIsScanning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleScan = (url: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    
    setCurrentUrl(url); // Set the active scan URL
    setLiveVulns([]);
    setLiveScore(100);
    setFinishedReportId('');
    setIsScanning(true);

    const eventSource = new EventSource(
      `http://127.0.0.1:8000/api/stream-scan?target_url=${encodeURIComponent(url)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'progress') {
        setLiveVulns(prev => {
          if (prev.some(v => v.vulnerability_name === data.result.vulnerability_name)) return prev;
          const updated = [...prev, data.result];
          setLiveScore(calculateLiveScore(updated));
          return updated;
        });
      } else if (data.status === 'complete') {
        setFinishedReportId(data.report_id ?? '');
        setIsScanning(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setIsScanning(false);
      eventSource.close();
    };
  };

  const bottomCards = getBottomCards(liveVulns);

  return (
    <div className="w-full px-8 lg:px-16 flex flex-col gap-6 pb-12 mt-6">
      {!isReportView && (
        <ScanInput onScan={handleScan} disabled={isScanning} />
      )}

      {isScanning && (
        <div className="w-full p-4 bg-[#111] border border-recon-accentGreen/20 rounded-lg flex items-center gap-3 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-recon-accentGreen animate-ping" />
          <span className="text-[10px] uppercase tracking-widest text-recon-accentGreen font-bold">
            Reconnaissance in progress...
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1 lg:col-span-1 h-[450px]">
          <RiskScoreCell realScore={liveScore} vulnerabilities={liveVulns} />
        </div>
        <div className="col-span-1 lg:col-span-3 min-h-[450px]">
          <LiveFeed results={liveVulns} />
        </div>
      </div>

      {bottomCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bottomCards.map((v, idx) => (
            <VulnCard
              key={v.vulnerability_name ?? idx}
              result={{ ...v, tier: getTier(v.vulnerability_name) }}
              targetUrl={currentUrl} 
            />
          ))}
        </div>
      )}

      <ShareCell reportId={finishedReportId} />
    </div>
  );
}