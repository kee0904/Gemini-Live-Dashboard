/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Database, CircleDot } from 'lucide-react';

interface RingMatrixProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

export default function RingMatrix({ mode, speed, isDark }: RingMatrixProps) {
  const [allocatedHeap, setAllocatedHeap] = useState(645);
  const [cacheHits, setCacheHits] = useState(98.4);
  const [queryQueue, setQueryQueue] = useState(0);

  useEffect(() => {
    if (speed === 'paused') return;

    let tickRate = 800;
    if (speed === 'warp') tickRate = 200;

    const interval = setInterval(() => {
      setAllocatedHeap((prev) => {
        let delta = Math.floor((Math.random() - 0.5) * 8);
        if (mode === 'overload') delta += Math.floor(Math.random() * 25);
        if (mode === 'optimal') delta -= 4;
        const next = prev + delta;
        return Math.max(120, Math.min(1024, next));
      });

      setCacheHits((prev) => {
        let target = 98.4;
        if (mode === 'overload') target = 72.1;
        if (mode === 'anomaly') target = 84.8;
        if (mode === 'optimal') target = 99.9;
        
        const next = prev * 0.95 + target * 0.05 + (Math.random() - 0.5) * 0.2;
        return Math.max(50, Math.min(100, next));
      });

      setQueryQueue((prev) => {
        if (mode === 'overload') return Math.floor(Math.random() * 80) + 120;
        if (mode === 'stable') return Math.floor(Math.random() * 5);
        return Math.floor(Math.random() * 12);
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, [mode, speed]);

  // Compute percentage rings
  const maxHeap = 1024;
  const heapPct = allocatedHeap / maxHeap;

  return (
    <div id="ring-matrix-container" className={`relative border p-4 backdrop-blur-md transition-all cyber-hud-card corner-ticks corner-ticks-inner ${isDark ? 'bg-[#040609]/95 border-cyan-500/15 text-slate-100 shadow-[0_0_20px_rgba(226,88,62,0.03)]' : 'bg-white/80 border-slate-200'}`}>
      <div className="flex items-center justify-between border-b pb-2 mb-3 border-dashed border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-400" />
          <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Memory Allocation & Hits
          </h3>
        </div>
        <span className="font-mono text-[9px] text-cyan-400 text-glow-cyan font-semibold">POOL MASTER</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Neon Donut Graph representing Segmented Disk in raw visual */}
        <div className="flex justify-center relative">
          <svg className="w-28 h-28 transform -rotate-90">
            {/* Outer track */}
            <circle
              cx="56"
              cy="56"
              r="46"
              className={isDark ? 'stroke-slate-850' : 'stroke-slate-100'}
              strokeWidth="6"
              fill="none"
            />
            {/* Buffer Heap Arc (Cyan Segmented Arc) */}
            <circle
              cx="56"
              cy="56"
              r="46"
              className="stroke-cyan-400 transition-all duration-300"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - heapPct)}
              strokeLinecap="round"
              fill="none"
            />
            {/* Cache Hits inner arc (Magenta glow) */}
            <circle
              cx="56"
              cy="56"
              r="34"
              className={isDark ? 'stroke-slate-800' : 'stroke-slate-100'}
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="56"
              cy="56"
              r="34"
              className="stroke-pink-500 transition-all duration-300"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - cacheHits / 100)}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Core numeric block inside donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className={`text-[12px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {(heapPct * 100).toFixed(0)}%
            </span>
            <span className="text-[7px] text-slate-500 uppercase">Heap Load</span>
          </div>
        </div>

        {/* Dynamic statistics details */}
        <div className="flex flex-col gap-2.5 font-mono text-[10px]">
          <div>
            <div className="text-slate-500 text-[8px] uppercase">Allocated Heap Memory</div>
            <div className={`text-[12px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {allocatedHeap} <span className="text-slate-500 text-[9px]">MB / {maxHeap} MB</span>
            </div>
            {/* Quick mini-percentage progress bar representation */}
            <div className={`mt-1 h-1 w-full rounded-full ${isDark ? 'bg-slate-850' : 'bg-slate-100'}`}>
              <div 
                style={{ width: `${heapPct * 100}%` }}
                className={`h-full rounded-full transition-all duration-300 ${allocatedHeap > 800 ? 'bg-rose-500' : 'bg-cyan-400'}`} 
              />
            </div>
          </div>

          <div className="flex justify-between">
            <div>
              <div className="text-slate-500 text-[8px] uppercase">Cache Hit Ratio</div>
              <div className="text-[11px] font-bold text-pink-500 text-glow-magenta">
                {cacheHits.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[8px] uppercase">Queries Queued</div>
              <div className={`text-[11px] font-bold ${queryQueue > 50 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {queryQueue} depth
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-between text-[9px] font-mono text-slate-500 border-t pt-2 border-slate-800/10">
        <span className="flex items-center gap-1">
          <CircleDot className="h-2.5 w-2.5 text-cyan-400" />
          Cyan: Buffer Space allocation
        </span>
        <span className="flex items-center gap-1">
          <CircleDot className="h-2.5 w-2.5 text-pink-500" />
          Pink: Active Core cache
        </span>
      </div>
    </div>
  );
}
