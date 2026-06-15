import React from 'react';
import BentoGrid from '@/components/BentoGrid';

// Note the Promise type wrapper here
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params before accessing the ID
  const { id } = await params;

  // Fetch the real data from your Python backend
  const res = await fetch(`http://127.0.0.1:8000/api/report/${id}`, {
    cache: 'no-store' // Never cache this, always get fresh data
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-mono">
        <h1 className="text-recon-critRed text-xl mb-2">404 - REPORT NOT FOUND</h1>
        <p className="text-recon-textMuted text-sm">The scan ID '{id}' does not exist.</p>
      </div>
    );
  }

  const reportData = await res.json();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-recon-textPrimary p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-7xl">
        
        {/* Dynamic Header */}
        <div className="mb-4 flex justify-between items-end border-b border-recon-borderDefault pb-4">
          <div>
            <h1 className="text-recon-accentGreen font-mono font-bold tracking-widest text-xl mb-1">
              RECON <span className="text-recon-textMuted text-sm font-normal">/ REPORT / {id}</span>
            </h1>
            <p className="text-recon-textMuted text-xs font-mono">
              TARGET: <span className="text-white">{reportData.target_url}</span>
            </p>
          </div>
          <span className="text-recon-textMuted text-[10px] uppercase tracking-widest">
            Scanned on {new Date(reportData.timestamp).toLocaleDateString()}
          </span>
        </div>

        {/* The Dashboard in Read-Only Report Mode */}
        <BentoGrid reportData={reportData} isReportView={true} />

        {/* Hidden data payload (We will wire this into BentoGrid next) */}
        <script 
          id="report-data" 
          type="application/json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reportData).replace(/</g, '\\u003c') }}
        />
        
      </div>
    </main>
  );
}