'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';

// Dummy stream data matching blueprint requirements
const STREAM_DATA = [
  { id: 1, name: 'Content Security Policy', severity: 'Critical' as const, status: 'complete', evidence: 'HTTP/1.1 200 OK\nServer: nginx\n(Missing Content-Security-Policy header)' },
  { id: 2, name: 'XSS Reflection Probe', severity: 'High' as const, status: 'complete', evidence: 'POST /search HTTP/1.1\nHost: target-app.com\n\nPayload: <devlynix_xss_test_999>\n---\nHTTP/1.1 200 OK\nBody contains unescaped <devlynix_xss_test_999>' },
  { id: 3, name: 'HSTS Header Check', severity: 'Medium' as const, status: 'complete', evidence: 'Strict-Transport-Security: max-age=3600\n(max-age is too short, missing includeSubDomains directive)' },
  { id: 4, name: 'SQL Injection Probe', severity: 'Pass' as const, status: 'complete', evidence: 'All 5 benign payloads returned standard 404/500 errors without database engine signatures.' },
  { id: 5, name: 'Sensitive File Scan', severity: 'Low' as const, status: 'scanning', evidence: '' },
];

export default function LiveFeed() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="h-full w-full p-6 rounded-xl bg-recon-bgCard border border-recon-borderDefault flex flex-col hover:border-recon-borderHover transition-colors">
      
      {/* Header with Pulsing Dot */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-recon-textMuted text-[10px] uppercase tracking-widest">Live Scan Feed</h2>
        <span className="w-2 h-2 rounded-full bg-recon-accentGreen animate-pulse shadow-[0_0_8px_rgba(26,107,58,0.8)]"></span>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
        {STREAM_DATA.map((item) => (
          <div key={item.id} className="flex flex-col border border-recon-borderDefault rounded-lg overflow-hidden bg-recon-bgPrimary/50">
            
            {/* Row Header (Clickable if complete) */}
            <div
              className={`flex items-center justify-between p-3 transition-colors ${
                item.status === 'scanning' ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-recon-bgSurface'
              }`}
              onClick={() => item.status === 'complete' && setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-recon-textMuted font-mono text-xs w-4 text-center">
                  {item.status === 'scanning' ? '⟳' : item.severity === 'Pass' ? '✓' : '⚠'}
                </span>
                <span className={`text-sm ${item.status === 'scanning' ? 'text-recon-textHint' : 'text-recon-textPrimary'}`}>
                  {item.status === 'scanning' ? `... Scanning [${item.name}]...` : item.name}
                </span>
              </div>
              {item.status === 'complete' && <SeverityBadge severity={item.severity} />}
            </div>

            {/* Expandable Evidence Panel */}
            {expandedId === item.id && item.evidence && (
              <div className="p-4 bg-recon-codeBg border-t border-recon-borderDefault">
                <pre className="text-recon-codeText font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {item.evidence}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <p className="text-recon-textHint text-[10px] mt-4 text-center">↑ Click any completed row to expand raw HTTP evidence</p>
    </div>
  );
}