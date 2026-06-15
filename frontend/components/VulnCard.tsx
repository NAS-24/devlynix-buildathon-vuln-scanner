'use client';
import React, { useState } from 'react';
import SeverityBadge from './SeverityBadge';
import TierBadge from './TierBadge';

interface ScanResult {
  id: string;
  vulnerability_name?: string;
  check_name?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Pass' | 'Info';
  passed: boolean;
  description: string;
  remediation?: string;
  owasp_ref?: string;
  tier: 1 | 2 | 3;
}

export default function VulnCard({ 
  result, 
  targetUrl 
}: { 
  result: ScanResult, 
  targetUrl: string 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [passed, setPassed] = useState(result.passed);
  const [statusText, setStatusText] = useState(result.passed ? 'PASS' : 'FAIL');

  const displayName = result.vulnerability_name || result.check_name || 'Unknown Check';
  const borderAccent = {
    Critical: 'border-l-red-500', // Ensure these match your tailwind config colors
    High:     'border-l-orange-500',
    Medium:   'border-l-yellow-500',
    Low:      'border-l-emerald-500',
    Pass:     'border-l-emerald-500',
    Info:     'border-l-[#333333]',
  }[result.severity] ?? 'border-l-[#333]';

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecking(true);
    setStatusText('VERIFYING...');

    // Use the environment variable for the backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const response = await fetch(
        `${apiUrl}/api/verify?target_url=${encodeURIComponent(targetUrl)}&vuln_name=${encodeURIComponent(displayName)}`
      );
      
      const data = await response.json();

      if (data.status === 'PASS') {
        setPassed(true);
        setStatusText('VERIFIED');
        setIsExpanded(false);
      } else {
        setStatusText('FAIL - STILL VULNERABLE');
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setStatusText('ERROR');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      onClick={() => !passed && setIsExpanded(!isExpanded)}
      className={`break-inside-avoid relative p-5 rounded-lg border border-[#222] border-l-4 ${borderAccent} bg-[#111111] flex flex-col transition-all duration-300 shadow-xl ${
        !passed ? 'cursor-pointer hover:border-emerald-500/30 hover:bg-[#161616]' : 'cursor-default'
      } ${isExpanded ? 'h-auto min-h-[280px] border-emerald-500/30' : 'h-[220px]'}`}
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className="text-white font-black text-xs uppercase tracking-tight leading-snug">{displayName}</h3>
        <TierBadge tier={result.tier} />
      </div>

      <p className={`text-[11px] text-gray-500 leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-3'}`}>
        {result.description}
      </p>

      {isExpanded && (
        <div className="animate-in fade-in duration-300 mb-6" onClick={(e) => e.stopPropagation()}>
          {result.owasp_ref && (
            <span className="inline-block text-[9px] bg-[#1a1a1a] text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase mb-3">
              {result.owasp_ref}
            </span>
          )}
          <label className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mb-2 block">Actionable Fix</label>
          <div className="bg-[#0a0a0a] border border-[#222] p-4 rounded font-mono text-[11px] text-emerald-400 whitespace-pre-wrap max-h-[120px] overflow-y-auto">
            {result.remediation || "No automated remediation available."}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={result.severity} />
          <span className={`text-[9px] font-black uppercase ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
            {statusText}
          </span>
        </div>

        {!passed && (
          <button
            onClick={handleVerify}
            disabled={isChecking}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded ${
              isExpanded 
                ? 'bg-emerald-500 text-black hover:bg-white' 
                : 'text-white/40 border border-white/5 hover:border-emerald-500/30 hover:text-emerald-500'
            }`}
          >
            {isChecking ? 'VERIFYING...' : 'VERIFY FIX'}
          </button>
        )}
      </div>
    </div>
  );
}