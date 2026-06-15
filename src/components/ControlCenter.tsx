/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Play, Pause, Zap, Flame, Compass, RefreshCw, Download, Layers, ShieldCheck } from 'lucide-react';

interface ControlProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  onChangeMode: (m: SimulationMode) => void;
  onChangeSpeed: (s: SimulationSpeed) => void;
  onTriggerAnomaly: () => void;
  onSystemReboot: () => void;
  isDark: boolean;
}

export default function ControlCenter({
  mode,
  speed,
  onChangeMode,
  onChangeSpeed,
  onTriggerAnomaly,
  onSystemReboot,
  isDark
}: ControlProps) {

  const profiles: { value: SimulationMode; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { value: 'stable', label: 'Stable Sine Routing', desc: 'Symmetric waves, standard 24ms latencies', icon: <Compass className="h-4 w-4" />, color: 'cyan' },
    { value: 'optimal', label: 'Optimal Peak Balance', desc: 'Structured high efficiency, minimum overhead', icon: <ShieldCheck className="h-4 w-4" />, color: 'green' },
    { value: 'volatile', label: 'Volatile Jitter Chaos', desc: 'High frequency interference and noise loops', icon: <Layers className="h-4 w-4" />, color: 'amber' },
    { value: 'overload', label: 'Overload Core Limit', desc: 'Critical bandwidth stress, redlining cpu', icon: <Flame className="h-4 w-4" />, color: 'rose' },
    { value: 'anomaly', label: 'Anomaly Pulse Cascade', desc: 'Rogue sweeps and high-amplitude spikes', icon: <Zap className="h-4 w-4" />, color: 'magenta' },
  ];

  return (
    <div id="control-center-container" className={`rounded-xl border p-5 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-3 mb-4 border-dashed border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
              Simulation Command Center
            </h3>
          </div>
          <p className="font-mono text-[9px] text-slate-500 mt-0.5">Control live clock multipliers and telemetry stress coefficients</p>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg border font-mono text-[9px] bg-slate-950/25 border-slate-800/10">
          <span className="text-slate-500 px-2 font-bold uppercase text-[8px]">CLOCK:</span>
          
          <button
            id="speed-pause"
            onClick={() => onChangeSpeed('paused')}
            title="Pause simulation"
            className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${speed === 'paused' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Pause className="h-2.5 w-2.5" />
            PAUSED
          </button>

          <button
            id="speed-normal"
            onClick={() => onChangeSpeed('normal')}
            title="1x normal velocity"
            className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${speed === 'normal' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Play className="h-2.5 w-2.5" />
            1x NORMAL
          </button>

          <button
            id="speed-warp"
            onClick={() => onChangeSpeed('warp')}
            title="4x hyper speed"
            className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${speed === 'warp' ? 'bg-pink-500/20 text-pink-500 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Zap className="h-2.5 w-2.5 animate-pulse" />
            4x HYPER
          </button>
        </div>
      </div>

      {/* Profiles Choice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {profiles.map((prof) => {
          const isSelected = mode === prof.value;
          
          let btnStyle = isDark 
            ? 'bg-slate-950/20 border-slate-850 hover:bg-slate-900 text-slate-350'
            : 'bg-slate-50 border-slate-150 hover:bg-slate-100/60 text-slate-600';

          if (isSelected) {
            if (prof.color === 'cyan') btnStyle = 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 text-glow-cyan font-bold';
            if (prof.color === 'green') btnStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 text-glow-green font-bold';
            if (prof.color === 'amber') btnStyle = 'bg-amber-500/15 border-amber-500/40 text-amber-500 text-glow-amber font-bold';
            if (prof.color === 'rose') btnStyle = 'bg-rose-500/15 border-rose-500/40 text-rose-450 text-glow-magenta font-bold';
            if (prof.color === 'magenta') btnStyle = 'bg-pink-500/15 border-pink-550/40 text-pink-500 text-glow-magenta font-bold';
          }

          return (
            <button
              id={`profile-mode-${prof.value}`}
              key={prof.value}
              onClick={() => onChangeMode(prof.value)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 transform active:scale-95 hover:scale-[1.02] cursor-pointer ${btnStyle}`}
            >
              <div className="flex justify-between items-center w-full mb-1">
                {prof.icon}
                <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'animate-ping' : 'opacity-20'} ${
                  prof.color === 'cyan' ? 'bg-cyan-400' :
                  prof.color === 'green' ? 'bg-emerald-400' :
                  prof.color === 'amber' ? 'bg-amber-500' :
                  prof.color === 'rose' ? 'bg-rose-500' : 'bg-pink-500'
                }`} />
              </div>
              <div>
                <span className="font-display text-[10px] uppercase font-bold tracking-tight block">{prof.label}</span>
                <span className="text-[8px] opacity-60 font-mono mt-0.5 line-clamp-2 leading-tight">{prof.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Cascade Triggers */}
      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-dashed border-slate-800/10 justify-between items-center font-mono text-[10px]">
        <div className="flex flex-wrap gap-2">
          {/* Inject spike event */}
          <button
            id="trigger-anomalous-pulse"
            onClick={onTriggerAnomaly}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all text-[9.5px] ${
              isDark 
                ? 'border-pink-550/30 text-pink-500 hover:bg-pink-500/10' 
                : 'border-pink-400/30 text-pink-600 hover:bg-pink-500/5 bg-pink-500/2'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            PULSE ANOMALOUS SIGNAL
          </button>

          {/* Reboot system */}
          <button
            id="system-reboot"
            onClick={onSystemReboot}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all text-[9.5px] ${
              isDark 
                ? 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10' 
                : 'border-cyan-600/30 text-cyan-600 hover:bg-cyan-500/5 bg-cyan-500/2'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
            RELOAD SYSTEM CACHE
          </button>
        </div>

        {/* Diagnostic info */}
        <div className="text-slate-500 text-[8.5px] text-right">
          INTELLIGENT TELEMETRY MULTIPLEXER v2.4.0 • STATUS: OK
        </div>
      </div>
    </div>
  );
}
