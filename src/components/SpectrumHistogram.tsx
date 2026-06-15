/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Sparkles, TrendingUp, Cpu, Maximize2 } from 'lucide-react';

interface SpectrumProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

export default function SpectrumHistogram({ mode, speed, isDark }: SpectrumProps) {
  // Number of bars matching the dense high-tech look in the image (32 bars)
  const barCount = 32;
  const [data, setData] = useState<number[]>(Array(barCount).fill(40));
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [maxThroughput, setMaxThroughput] = useState(748);
  const [activeChannelName, setActiveChannelName] = useState('CH-B / MULTIPLEXER');
  
  const tickRef = useRef(0);

  useEffect(() => {
    let intervalId: any;
    
    let tickSpeed = 160;
    if (speed === 'paused') return;
    if (speed === 'warp') tickSpeed = 50;

    const generateWave = () => {
      tickRef.current += 1;
      const t = tickRef.current * 0.15;

      setData((prevData) => {
        return prevData.map((val, idx) => {
          let base = 35;
          let wave = 0;

          if (mode === 'stable') {
            // Smooth sine movement
            wave = Math.sin(t + idx * 0.3) * 20 + Math.cos(t * 0.7 - idx * 0.15) * 8;
            base = 45;
          } else if (mode === 'optimal') {
            // Almost perfect uniform shape
            const distFromCenter = Math.abs(idx - (barCount - 1) / 2);
            const centerHeight = 65 - distFromCenter * 2.2;
            wave = Math.sin(t * 0.5 + idx * 0.05) * 2;
            base = centerHeight;
          } else if (mode === 'volatile') {
            // Rapid high-frequency noise
            wave = (Math.sin(t * 1.8 + idx) + Math.cos(t * 3.1 - idx * 2.2)) * 18;
            base = 40 + (idx % 3) * 6;
          } else if (mode === 'overload') {
            // Maxed out chaotic telemetry peaks
            wave = Math.sin(t * 2.5 + idx * 0.8) * 15 + Math.random() * 20;
            base = 65 + (idx % 2 === 0 ? 15 : 5);
          } else if (mode === 'anomaly') {
            // Flat, but with one or two massive moving sweeps represent anomalous packet loads
            const anomalyCenter = Math.floor((Math.sin(t * 0.4) + 1) * (barCount / 2)) + 6;
            const dist = Math.abs(idx - anomalyCenter);
            if (dist < 3) {
              base = 82 - dist * 12;
            } else {
              base = 18 + Math.sin(t + idx * 0.5) * 4;
            }
          }

          // Bound between 8% and 94% height
          let finalVal = base + wave;
          if (finalVal < 8) finalVal = 8;
          if (finalVal > 95) finalVal = 95;

          return finalVal;
        });
      });

      // Gradually drift metric counter
      if (Math.random() < 0.3) {
        setMaxThroughput(prev => {
          const delta = Math.floor((Math.random() - 0.5) * 18);
          let baseTarget = 740;
          if (mode === 'overload') baseTarget = 1240;
          if (mode === 'optimal') baseTarget = 520;
          
          let next = prev + delta;
          if (Math.abs(next - baseTarget) > 150) {
            next = baseTarget + (Math.random() - 0.5) * 20;
          }
          return next;
        });
      }
    };

    intervalId = setInterval(generateWave, tickSpeed);
    return () => clearInterval(intervalId);
  }, [mode, speed]);

  // Rotates high-frequency multiplex channel labels
  useEffect(() => {
    const channels = ['CH-B / MULTIPLEXER', 'RX-NODE-7 // ADAPTIVE', 'SEC-PACK-G2 // TLS', 'CORE-TUNNEL // STACK'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % channels.length;
      setActiveChannelName(channels[idx]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Compute stats based on current data
  const sumData = data.reduce((a, b) => a + b, 0);
  const avgData = sumData / barCount;
  const peakVal = Math.max(...data);

  return (
    <div id="spectrum-histogram-container" className={`rounded-xl border p-5 backdrop-blur-md transition-all h-full flex flex-col justify-between ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
      <div>
        {/* Widget Top Metadata Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3 mb-4 border-dashed border-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === 'overload' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${mode === 'overload' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`font-display text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  Spectrum Load Distribution
                </h3>
                <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold ${mode === 'overload' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                  {mode.toUpperCase()}
                </span>
              </div>
              <p className="font-mono text-[9.5px] text-slate-500 mt-0.5">{activeChannelName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[8px] uppercase">Mean Intrinsic Load</span>
              <span className={`text-[12px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {avgData.toFixed(1)} <span className="text-[10px] text-slate-500">Mv/s</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8px] uppercase">Peak Load Segment</span>
              <span className="text-[12px] font-bold text-pink-500 text-glow-magenta">
                {peakVal.toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8px] uppercase">Peak Speed Threshold</span>
              <span className="text-[12px] font-bold text-cyan-400 text-glow-cyan">
                {maxThroughput} Gbps
              </span>
            </div>
          </div>
        </div>

        {/* Custom SVG Spectrum graph representing the image's vibrant glowing gradient bars */}
        <div id="svg-spectrum-wrapper" className="relative h-60 w-full mb-3 select-none">
          {/* Target line with hover index details */}
          {hoveredIdx !== null && (
            <div 
              style={{ left: `${(hoveredIdx / (barCount - 1)) * 94 + 3}%` }}
              className={`absolute top-0 bottom-0 w-px border-l border-dashed pointer-events-none transition-all duration-75 ${isDark ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-cyan-600/40 bg-cyan-600/5'}`}
            >
              <div className={`absolute top-1 -translate-x-1/2 font-mono text-[9px] px-1.5 py-0.5 rounded shadow border whitespace-nowrap z-20 ${isDark ? 'bg-slate-950 border-slate-800 text-cyan-400' : 'bg-white border-slate-200 text-cyan-600'}`}>
                SEG #{hoveredIdx}: <span className="font-bold">{data[hoveredIdx].toFixed(1)}%</span>
              </div>
            </div>
          )}

          <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
            <defs>
              {/* Vibrant pink-orange-yellow-green-cyan spectrum gradient matching the image's main display bar chart */}
              <linearGradient id="spectrumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" /> {/* Pink / Magenta */}
                <stop offset="25%" stopColor="#f43f5e" /> {/* Sweet red */}
                <stop offset="50%" stopColor="#f59e0b" /> {/* Orange / Amber */}
                <stop offset="70%" stopColor="#84cc16" /> {/* Lime / Glow Green */}
                <stop offset="85%" stopColor="#10b981" /> {/* Emerald */}
                <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan / Ice Blue */}
              </linearGradient>

              {/* Glowing SVG Filter */}
              <filter id="neonBlur" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal guide grids */}
            <line x1="0" y1="20" x2="600" y2="20" stroke={isDark ? "rgba(148, 163, 184, 0.04)" : "rgba(71, 85, 105, 0.05)"} strokeDasharray="3,3" />
            <line x1="0" y1="80" x2="600" y2="80" stroke={isDark ? "rgba(148, 163, 184, 0.04)" : "rgba(71, 85, 105, 0.05)"} strokeDasharray="3,3" />
            <line x1="0" y1="140" x2="600" y2="140" stroke={isDark ? "rgba(148, 163, 184, 0.04)" : "rgba(71, 85, 105, 0.05)"} strokeDasharray="3,3" />
            <line x1="0" y1="200" x2="600" y2="200" stroke={isDark ? "rgba(148, 163, 184, 0.04)" : "rgba(71, 85, 105, 0.05)"} strokeDasharray="3,3" />

            {/* Background sweeping glowing sine signal wave */}
            <path
              d={data.reduce((acc, h, i) => {
                const x = (i / (barCount - 1)) * 600;
                const y = 240 - (h * 1.8) - 10;
                return acc + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }, "")}
              fill="none"
              stroke="rgba(6, 182, 212, 0.15)"
              strokeWidth="2.5"
            />

            {/* The spectrum columns matching the beautiful bento gradient bar chart in the image */}
            {data.map((h, i) => {
              const widthRatio = 600 / barCount;
              const barWidth = widthRatio - 4; // Gap between columns
              const x = i * widthRatio + 2;
              const height = (h * 1.8) + 4; // Scale and add baseline padding
              const y = 240 - height;
              const isHovered = hoveredIdx === i;

              return (
                <g 
                  key={i} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Glowing backing shadow for hovered bar */}
                  {isHovered && (
                    <rect
                      x={x - 2}
                      y={y - 4}
                      width={barWidth + 4}
                      height={height + 6}
                      fill="url(#spectrumGradient)"
                      opacity="0.35"
                      filter="url(#neonBlur)"
                      rx="3"
                    />
                  )}

                  {/* Standard high-fidelity neon spectrum cylinder / column */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    fill="url(#spectrumGradient)"
                    opacity={hoveredIdx !== null && !isHovered ? "0.45" : "0.95"}
                    rx="2"
                    className="transition-all duration-300"
                  />

                  {/* Light reflections top cap */}
                  <rect
                    x={x + 1}
                    y={y}
                    width={barWidth - 2}
                    height="3"
                    fill="#ffffff"
                    opacity="0.7"
                    rx="1"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Footer statistics bar */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl border font-mono text-[10px] mt-2 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
        <div>
          <span className="text-slate-500 block">THROUGHPUT RATIO</span>
          <span className={`font-semibold text-glow-cyan text-cyan-400`}>1:14.28 OVERFLOW</span>
        </div>
        <div>
          <span className="text-slate-500 block">FRAME DROPS</span>
          <span className={`font-semibold ${mode === 'overload' ? 'text-rose-400' : 'text-slate-400'}`}>
            {mode === 'overload' ? '12.4% WARNING' : '0.003% SAFE'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">BURST QUOTA</span>
          <span className="font-semibold text-pink-500 text-glow-magenta">140 Giga-OPS / s</span>
        </div>
        <div>
          <span className="text-slate-500 block">SPECTRAL HEALTH</span>
          <span className="font-semibold text-green-400 text-glow-green">
            {mode === 'overload' ? 'RED LIMIT' : '99.98% OK'}
          </span>
        </div>
      </div>
    </div>
  );
}
