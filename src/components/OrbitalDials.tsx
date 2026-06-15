/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Compass, RefreshCcw } from 'lucide-react';

interface OrbitalProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

export default function OrbitalDials({ mode, speed, isDark }: OrbitalProps) {
  const [rotationA, setRotationA] = useState(0);
  const [rotationB, setRotationB] = useState(120);
  const [amplitude, setAmplitude] = useState(64.2);
  const [harmonicRatio, setHarmonicRatio] = useState(0.428);

  useEffect(() => {
    let animId: any;
    let localFrame = 0;

    let tickFactor = 1;
    if (speed === 'paused') tickFactor = 0;
    if (speed === 'warp') tickFactor = 4;

    const animate = () => {
      localFrame += 1;
      
      setRotationA((prev) => (prev + 0.6 * tickFactor) % 360);
      setRotationB((prev) => (prev - 0.45 * tickFactor + 360) % 360);

      if (localFrame % 10 === 0 && tickFactor > 0) {
        setAmplitude((prev) => {
          const delta = (Math.random() - 0.5) * 1.5;
          let target = 65;
          if (mode === 'overload') target = 92;
          if (mode === 'optimal') target = 50;

          const next = prev + delta;
          return Math.max(20, Math.min(100, next * 0.9 + target * 0.1));
        });

        setHarmonicRatio((prev) => {
          const delta = (Math.random() - 0.5) * 0.01;
          const target = mode === 'anomaly' ? 0.841 : 0.428;
          return Math.max(0.1, Math.min(1.0, prev * 0.95 + target * 0.05));
        });
      }

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [mode, speed]);

  // SVG parameters for radial segment meter
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffsetA = circumference - (amplitude / 100) * circumference;
  const strokeDashoffsetB = circumference - (harmonicRatio) * circumference;

  return (
    <div id="orbital-dials-container" className={`rounded-xl border p-4 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
      <div className="flex items-center justify-between border-b pb-2 mb-3 border-dashed border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-cyan-400 animate-spin-slow" />
          <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Dual-Core Orbital Loops
          </h3>
        </div>
        <span className="font-mono text-[9px] text-pink-500 text-glow-magenta font-semibold">DUAL DAMPENERS</span>
      </div>

      <div className="flex items-center justify-around py-2">
        {/* Orbit A (Left) */}
        <div id="orbit-dial-a" className="flex flex-col items-center">
          <div className="relative">
            {/* Spinning decorative ring */}
            <div 
              style={{ transform: `rotate(${rotationA}deg)` }}
              className="absolute inset--2 border-2 border-dashed border-cyan-500/10 rounded-full w-24 h-24 -m-2 opacity-50"
            />
            
            {/* Main Instrument Display SVG */}
            <svg className="w-20 h-20 transform -rotate-90">
              {/* Backing Track */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className={isDark ? 'stroke-slate-800' : 'stroke-slate-100'}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Active neon arc indicator */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-cyan-400 transition-all duration-300"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffsetA}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            
            {/* Inner rotating sensor pointer */}
            <div 
              style={{ transform: `translate(-50%, -50%) rotate(${rotationA}deg)` }}
              className="absolute top-1/2 left-1/2 w-10 h-10 border-r border-cyan-400 pointer-events-none origin-center"
            />

            {/* Inner Digital Output */}
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {amplitude.toFixed(1)}
              </span>
              <span className="text-[7.5px] text-slate-500 uppercase">AMP</span>
            </div>
          </div>
          <span className="font-mono text-[9px] text-slate-400 mt-2">DIPOLE-A</span>
        </div>

        {/* Orbit B (Right) */}
        <div id="orbit-dial-b" className="flex flex-col items-center">
          <div className="relative">
            {/* Spinning decorative ring */}
            <div 
              style={{ transform: `rotate(${rotationB}deg)` }}
              className="absolute inset--2 border border-dotted border-pink-500/20 rounded-full w-24 h-24 -m-2 opacity-70"
            />
            
            {/* Main Instrument Display SVG */}
            <svg className="w-20 h-20 transform -rotate-90">
              {/* Backing Track */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className={isDark ? 'stroke-slate-800' : 'stroke-slate-100'}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Active neon pink arc indicator */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-pink-500 transition-all duration-300"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffsetB}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner rotating pointer */}
            <div 
              style={{ transform: `translate(-50%, -50%) rotate(${rotationB}deg)` }}
              className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full border border-pink-500/20 pointer-events-none origin-center"
            >
              <div className="absolute top-0 left-1/2 -ml-0.5 w-1 h-2 bg-pink-500" />
            </div>

            {/* Inner Digital Output */}
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {harmonicRatio.toFixed(3)}
              </span>
              <span className="text-[7.5px] text-slate-500 uppercase">H-V</span>
            </div>
          </div>
          <span className="font-mono text-[9px] text-slate-400 mt-2">SPECTRA-B</span>
        </div>
      </div>

      <div className={`mt-3 p-2 rounded-lg font-mono text-[8.5px] border ${isDark ? 'bg-slate-950/50 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-500'} flex justify-between`}>
        <span>BIAS: <span className="text-cyan-400 font-bold">1.042 - OK</span></span>
        <span>MODULATOR: <span className="text-pink-500 font-bold">MUTUAL DECOUPLE</span></span>
      </div>
    </div>
  );
}
