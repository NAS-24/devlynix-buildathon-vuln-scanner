'use client';
import React from 'react';
import RadarChart from './RadarChart';

export default function AnalysisPanel({ radarData }: { radarData: any }) {
  return (
    <div className="h-full w-full p-6 rounded-xl bg-[#111111] border border-[#222222] flex flex-col items-center shadow-lg">
      <h2 className="text-white/50 font-black text-[9px] uppercase tracking-[0.3em] w-full text-left mb-6">
        Security Posture
      </h2>
      <div className="flex-1 flex items-center justify-center w-full">
        <RadarChart scores={radarData} />
      </div>
    </div>
  );
}