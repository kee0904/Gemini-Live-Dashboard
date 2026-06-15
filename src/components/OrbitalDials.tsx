/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Compass, Cpu } from 'lucide-react';

interface OrbitalProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

export default function OrbitalDials({ mode, speed, isDark }: OrbitalProps) {
  // Animation frames for rotation and level flickers
  const [ticks, setTicks] = useState(0);
  const [activeParam, setActiveParam] = useState('RX23');
  const [centerLabel, setCenterLabel] = useState('A3');

  useEffect(() => {
    if (speed === 'paused') return;
    let rate = 120;
    if (speed === 'warp') rate = 40;

    const interval = setInterval(() => {
      setTicks((prev) => prev + 1);
    }, rate);

    return () => clearInterval(interval);
  }, [speed]);

  // Rotate param names to feel highly active
  useEffect(() => {
    const list = ['RX23', 'SF/V4', 'FD-X2', 'NODE_9'];
    const interval = setInterval(() => {
      setActiveParam(list[Math.floor(Math.random() * list.length)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Center label dynamically shifts depending on the selected simulation state
  useEffect(() => {
    if (mode === 'overload') setCenterLabel('OL-99');
    else if (mode === 'optimal') setCenterLabel('OP-7');
    else if (mode === 'anomaly') setCenterLabel('ANOM');
    else setCenterLabel('A3');
  }, [mode]);

  // Compute flicker levels for vertical segmented bars
  const orangeVerticalBlocks = [
    [true, true, true, false, false, false], // level blocks
    [true, true, true, true, true, false],
  ];

  // Dynamic bar lights
  const getFlickerState = (blockIdx: number, stepIdx: number, color: 'orange' | 'teal') => {
    const noise = Math.sin(ticks * 0.4 + blockIdx * 1.5 + stepIdx * 0.8);
    const threshold = mode === 'overload' ? 0.9 : (mode === 'optimal' ? 0.2 : 0.5);
    return noise > (color === 'orange' ? -0.2 : -0.4);
  };

  return (
    <div 
      id="orbital-dials-container" 
      className={`relative border p-5 backdrop-blur-md transition-all cyber-hud-card corner-ticks corner-ticks-inner ${
        isDark 
          ? 'bg-[#040609]/95 border-cyan-500/15 text-slate-100 shadow-[0_0_20px_rgba(226,88,62,0.03)]' 
          : 'bg-white border-slate-300 text-slate-800'
      }`}
    >
      {/* Top Header of the Central Module */}
      <div className="flex justify-between items-center border-b pb-2.5 mb-5 border-dashed border-cyan-500/15">
        <div className="flex items-center gap-1.5 font-mono">
          <Cpu className="h-3.5 w-3.5 text-[#e2583e] animate-pulse" />
          <span className={`text-[10px] tracking-widest font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            TECH READ PARAMETER
          </span>
        </div>
        <div className="font-mono text-[9px] text-[#22d3ee] font-semibold tracking-wider">
          POD TRANSMITTER DETECT
        </div>
      </div>

      {/* Main Grid: Left Segmented block, Middle Reticle Circle, Right curves */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-2">
        
        {/* LEFT PANEL: Segmented bar column grids representing the glowing orange/teal rect arrays in the picture */}
        <div className="flex flex-col items-center justify-center p-2 font-mono">
          <div className="text-[12px] font-bold text-[#e2583e] tracking-widest text-glow-orange mb-3">
            {activeParam}
          </div>

          <div className="flex gap-4 items-end mb-2 h-32">
            {/* Orange Segmented Column 1 */}
            <div className="flex flex-col gap-1">
              <span className="text-[7px] text-slate-500 text-center uppercase mb-1">P-01</span>
              {Array.from({ length: 6 }).map((_, step) => {
                const active = getFlickerState(0, step, 'orange');
                return (
                  <div 
                    key={step} 
                    className={`w-5 h-4 transition-all duration-150 ${
                      active 
                        ? 'bg-[#e2583e] shadow-[0_0_8px_rgba(226,88,62,0.4)]' 
                        : isDark ? 'bg-slate-900/80 border border-slate-850' : 'bg-slate-200'
                    }`}
                  />
                );
              }).reverse()}
            </div>

            {/* Orange Segmented Column 2 */}
            <div className="flex flex-col gap-1">
              <span className="text-[7px] text-slate-500 text-center uppercase mb-1">P-02</span>
              {Array.from({ length: 6 }).map((_, step) => {
                const active = getFlickerState(1, step, 'orange');
                return (
                  <div 
                    key={step} 
                    className={`w-5 h-4 transition-all duration-150 ${
                      active 
                        ? 'bg-[#e2583e] shadow-[0_0_8px_rgba(226,88,62,0.4)]' 
                        : isDark ? 'bg-slate-900/80 border border-slate-850' : 'bg-slate-200'
                    }`}
                  />
                );
              }).reverse()}
            </div>

            {/* Teal Segmented Column */}
            <div className="flex flex-col gap-1">
              <span className="text-[7px] text-slate-500 text-center uppercase mb-1">P-23</span>
              {Array.from({ length: 6 }).map((_, step) => {
                const active = getFlickerState(2, step, 'teal');
                return (
                  <div 
                    key={step} 
                    className={`w-5 h-4 transition-all duration-150 ${
                      active 
                        ? 'bg-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.4)]' 
                        : isDark ? 'bg-slate-900/80 border border-slate-850' : 'bg-slate-200'
                    }`}
                  />
                );
              }).reverse()}
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL: The centerpiece iconic target HUD compass dial circle with "A3 / R-66" inside */}
        <div className="flex flex-col items-center justify-center relative p-1 font-mono">
          
          {/* Top bracket pointer micro ticks */}
          <div className="text-[10px] text-[#e2583e] animate-pulse mb-1">
            ▲
          </div>

          <div className="relative flex items-center justify-center w-28 h-28 my-1">
            {/* Ambient radar rotation ring */}
            <div 
              style={{ transform: `rotate(${ticks * 2.5}deg)` }}
              className="absolute inset-0 border border-cyan-500/10 border-dashed rounded-full pointer-events-none"
            />
            
            {/* Concentric solid ticking compass ring */}
            <svg className="w-full h-full absolute transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                className={isDark ? 'stroke-slate-900' : 'stroke-slate-200'}
                strokeWidth="1.5"
                fill="none"
              />
              <circle
                cx="56"
                cy="56"
                r="42"
                className="stroke-[#22d3ee] opacity-30"
                strokeWidth="1.2"
                strokeDasharray="4,8"
                fill="none"
              />
              {/* Outer compass ticking segments */}
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-[#e2583e] opacity-70"
                strokeWidth="2.5"
                strokeDasharray="40 180"
                fill="none"
              />
            </svg>

            {/* Left and Right cursor ticks `<` and `>` exactly like picture! */}
            <div className="absolute left-[-8px] text-[15px] font-bold text-[#22d3ee] text-glow-teal leading-none">
              [
            </div>
            <div className="absolute right-[-8px] text-[15px] font-bold text-[#22d3ee] text-glow-teal leading-none">
              ]
            </div>

            {/* Inner text: Center "A3" and underneath subtitle "R-66" */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[19px] font-bold tracking-widest text-[#22d3ee] text-glow-teal font-display">
                {centerLabel}
              </span>
              <span className="text-[8px] tracking-wider text-slate-500 uppercase -mt-1 font-semibold">
                R-66 / {speed.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-[#e2583e] mt-1">
            ▼
          </div>
          <span className="text-[7.5px] text-slate-500 uppercase mt-1 tracking-wider">SO/GFX TRACK</span>
        </div>

        {/* RIGHT PANEL: Bottom-Right Segment panel containing orange, dark-grid indicators with level bars exactly like the photo! */}
        <div className="flex flex-col justify-center h-full p-2 font-mono">
          <div className="text-[12px] font-bold text-[#22d3ee] tracking-widest text-glow-teal mb-3 text-right">
            P4
          </div>

          {/* High-fidelity detail list block inside military transmitter display */}
          <div className="space-y-1.5 text-[8px] font-mono select-none">
            
            <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
              <span className="text-slate-500">5/22 | 7/66</span>
              <span className="text-[#e2583e] font-bold text-glow-orange font-bold">F-35 5-21</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-cyan-500/10 pb-1">
              <span className="text-slate-500">8/22 | 2/55</span>
              <span className="text-[#22d3ee] font-bold">F-18 S-41</span>
            </div>

            {/* Simulated Segmented Level bar arrays (rust and cyan horizontal pills) exactly like the picture! */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-10 text-[6.5px] text-slate-500 uppercase">UNITS-TX</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-1.5 bg-[#e2583e]" />
                  <div className="w-4 h-1.5 bg-[#e2583e]" />
                  <div className="w-4 h-1.5 bg-[#e2583e]" />
                  <div className="w-2 h-1.5 bg-slate-900 border border-slate-800" />
                  <div className="w-2 h-1.5 bg-slate-900 border border-slate-800" />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-10 text-[6.5px] text-slate-500 uppercase">AMP-GATE</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-1.5 bg-[#22d3ee]" />
                  <div className="w-4 h-1.5 bg-[#22d3ee]" />
                  <div className="w-2 h-1.5 bg-slate-900 border border-slate-800" />
                  <div className="w-2 h-1.5 bg-slate-900 border border-slate-800" />
                  <div className="w-2 h-1.5 bg-slate-900 border border-slate-800" />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* FOOTER: Beautiful fader vertical slider controllers row mapping "TRANSLATE A-P2 8-33" at bottom left of image! */}
      <div className="border-t border-dashed border-cyan-500/15 pt-3.5 mt-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[8px]">
          
          <div className="p-1.5 rounded bg-slate-950/40 border border-cyan-500/5">
            <span className="text-slate-500 block">TRANSLATE A-R2</span>
            <div className="flex items-center gap-2 mt-1">
              {/* Slider simulation columns */}
              <div className="flex-1 bg-slate-900 h-2 rounded relative overflow-hidden">
                <div className="bg-[#22d3ee] h-full w-[65%]" />
              </div>
              <span className="text-[#22d3ee] font-bold">8-33</span>
            </div>
          </div>

          <div className="p-1.5 rounded bg-slate-950/40 border border-cyan-500/5">
            <span className="text-slate-500 block">TRANSLATE B-P4</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-900 h-2 rounded relative overflow-hidden">
                <div className="bg-[#e2583e] h-full w-[40%]" />
              </div>
              <span className="text-[#e2583e] font-bold">5-15</span>
            </div>
          </div>

          <div className="p-1.5 rounded bg-slate-950/40 border border-cyan-500/5 col-span-2">
            <div className="flex justify-between items-center h-full">
              <div>
                <span className="text-slate-500 uppercase text-[6px]">Status update layer telemetry</span>
                <span className="text-slate-350 block uppercase text-[8px] font-bold tracking-wider">SYSTEM UPD. COMPLETE</span>
              </div>
              <span className="text-[#22d3ee] font-bold text-[9px] bg-cyan-950/40 px-1 py-0.5 border border-cyan-800/20">
                P-STABLE
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
