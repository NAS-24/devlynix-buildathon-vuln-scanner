'use client';
import React, { useState, useEffect } from 'react';
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
  
  // --- STATE ENGINE FOR LIVE STREAMING ---
  const [liveVulns, setLiveVulns] = useState<any[]>(reportData?.vulnerabilities || []);
  const [liveScore, setLiveScore] = useState<number | undefined>(reportData?.risk_score);
  const [liveRadar, setLiveRadar] = useState<any>(reportData?.radar_scores);
  const [finishedReportId, setFinishedReportId] = useState<string | undefined>(reportData?.report_id);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<{url: string, score: number}[]>([]);

  // If Next.js passes in new database data (e.g., navigating to a report), update the state
  useEffect(() => {
    if (reportData) {
      setLiveVulns(reportData.vulnerabilities || []);
      setLiveScore(reportData.risk_score);
      setLiveRadar(reportData.radar_scores);
      setFinishedReportId(reportData.report_id);
    }
  }, [reportData]);

  // --- THE EVENT SOURCE PIPELINE ---
  const handleScan = (url: string) => {
    // 1. Reset UI for a fresh scan
    setIsScanning(true);
    setLiveVulns([]);
    setLiveScore(100); // Start at a perfect 100
    setFinishedReportId(undefined);

    // 2. Open the Server-Sent Events pipe to Python
    const eventSource = new EventSource(`http://127.0.0.1:8000/api/stream-scan?target_url=${encodeURIComponent(url)}`);

    // 3. Catch chunks as they stream in
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === 'progress') {
        // Append the new vulnerability chunk to our live array
        setLiveVulns((prev) => {
          const updated = [...prev, data.result];

          // Quick frontend math to drop the score live for visual effect!
          let currentScore = 100;
          updated.forEach(v => {
            if (!v.passed) {
              const sev = v.severity?.toLowerCase();
              if (sev === 'critical') currentScore -= 25;
              else if (sev === 'high') currentScore -= 15;
              else if (sev === 'medium') currentScore -= 10;
              else if (sev === 'low') currentScore -= 5;
            }
          });
          setLiveScore(Math.max(0, currentScore));

          return updated;
        });

      } else if (data.status === 'complete') {
        // 1. Add this scan to history before we close
        setScanHistory(prev => [{ url: url, score: liveScore || 0 }, ...prev].slice(0, 5));
        
        // 2. The backend finished
        setFinishedReportId(data.report_id);
        setIsScanning(false);
        eventSource.close();

      } else if (data.status === 'error') {
        console.error("Scanner Error:", data.message);
        setIsScanning(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Pipeline Broken", err);
      setIsScanning(false);
      eventSource.close();
    };
  };

  // Smart Sort: Put FAILED checks at the front
  const sortedVulns = [...liveVulns].sort((a, b) => {
    if (a.passed === b.passed) return 0;
    return a.passed ? 1 : -1;
  });

  const topVulnerabilities = sortedVulns.length > 0 ? sortedVulns.slice(0, 3) : [
    {
      check_name: 'System Idle',
      severity: 'Info',
      status: 'WAITING',
      description: 'Enter a target URL above to initiate the reconnaissance sequence. Real-time data will populate here.',
      tier: 1
    },
    // We add two empty placeholder objects just to keep the grid layout pretty before scanning
    { check_name: '...', severity: 'Info', status: 'WAITING', description: 'Awaiting scan...', tier: 2 },
    { check_name: '...', severity: 'Info', status: 'WAITING', description: 'Awaiting scan...', tier: 3 }
  ];

  return (
  // Changed from max-w-7xl mx-auto to px-8 lg:px-16, giving you more screen space
  <div className="w-full px-8 lg:px-16 flex flex-col gap-6 pb-12 mt-6">
    
    {/* ROW 1: Scan Input */}
    {!isReportView && (
      <div className="w-full">
        <ScanInput onScan={handleScan} />
      </div>
    )}
      

      {/* ROW 2: Risk Score & Top Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1">
          <RiskScoreCell 
            realScore={liveScore} 
            realRadar={liveRadar} 
            vulnerabilities={liveVulns}
          />
        </div>

        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {topVulnerabilities.map((vuln: any, idx: number) => (
            <div key={idx} className="h-full">
              <VulnCard result={{
                check_name: vuln.vulnerability_name || vuln.check_name,
                severity: vuln.status === 'WAITING' ? 'Info' : (vuln.passed ? 'Pass' : vuln.severity),
                status: vuln.status === 'WAITING' ? 'WAITING' : (vuln.passed ? 'PASS' : 'FAIL'),
                description: vuln.description,
                tier: vuln.tier || 2
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* ROW 3: Live Feed & Share Options */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1 lg:col-span-3 min-h-[450px]">
          {/* Pass the live growing array to the feed */}
          <LiveFeed isReportView={isReportView} results={liveVulns} />
        </div>

        <div className="col-span-1">
          {/* Automatically display the share link the moment the scan finishes */}
          <ShareCell 
                reportId={finishedReportId} 
                history={scanHistory} // <--- Pass your real array here
                />
        </div>
      </div>
    </div>
  );
}