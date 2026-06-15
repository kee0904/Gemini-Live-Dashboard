/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Play, Pause, Zap, Flame, Compass, RefreshCw, Layers, ShieldCheck, Volume2, VolumeX, Activity } from 'lucide-react';
import { cyberAudio } from '../utils/audio';

interface ControlProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  onChangeMode: (m: SimulationMode) => void;
  onChangeSpeed: (s: SimulationSpeed) => void;
  onTriggerAnomaly: () => void;
  onSystemReboot: () => void;
  isDark: boolean;
  soundMuted: boolean;
  onToggleMute: () => void;
  bgHumEnabled: boolean;
  onToggleBgHum: () => void;
}

export default function ControlCenter({
  mode,
  speed,
  onChangeMode,
  onChangeSpeed,
  onTriggerAnomaly,
  onSystemReboot,
  isDark,
  soundMuted,
  onToggleMute,
  bgHumEnabled,
  onToggleBgHum
}: ControlProps) {

  const profiles: { value: SimulationMode; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { value: 'stable', label: 'Stable Sine Routing', desc: 'Symmetric waves, standard 24ms latencies', icon: <Compass className="h-4 w-4" />, color: 'cyan' },
    { value: 'optimal', label: 'Optimal Peak Balance', desc: 'Structured high efficiency, minimum overhead', icon: <ShieldCheck className="h-4 w-4" />, color: 'green' },
    { value: 'volatile', label: 'Volatile Jitter Chaos', desc: 'High frequency interference and noise loops', icon: <Layers className="h-4 w-4" />, color: 'amber' },
    { value: 'overload', label: 'Overload Core Limit', desc: 'Critical bandwidth stress, redlining cpu', icon: <Flame className="h-4 w-4" />, color: 'rose' },
    { value: 'anomaly', label: 'Anomaly Pulse Cascade', desc: 'Rogue sweeps and high-amplitude spikes', icon: <Zap className="h-4 w-4" />, color: 'magenta' },
  ];

  const handleModeChange = (m: SimulationMode) => {
    if (m === 'overload' || m === 'anomaly') {
      cyberAudio.playWarning();
    } else {
      cyberAudio.playClick();
    }
    onChangeMode(m);
  };

  const handleSpeedChange = (s: SimulationSpeed) => {
    cyberAudio.playClick();
    onChangeSpeed(s);
  };

  const handleTriggerAnomaly = () => {
    cyberAudio.playWarning();
    onTriggerAnomaly();
  };

  const handleSystemReboot = () => {
    cyberAudio.playReboot();
    onSystemReboot();
  };

  const handleMuteToggle = () => {
    cyberAudio.toggleMute();
    onToggleMute();
    if (!cyberAudio.getMuteStatus()) {
      cyberAudio.playClick();
    }
  };

  const handleBgHumToggle = () => {
    cyberAudio.playClick();
    onToggleBgHum();
  };

  return (
    <div id="control-center-container" className={`relative border p-5 backdrop-blur-md transition-all cyber-hud-card corner-ticks corner-ticks-inner ${isDark ? 'bg-[#040609]/95 border-cyan-500/15 text-slate-100 shadow-[0_0_20px_rgba(226,88,62,0.03)]' : 'bg-white/85 border-slate-200/80 shadow-md'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-3 mb-4 border-dashed border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mode === 'overload' || mode === 'anomaly' ? 'bg-rose-500' : 'bg-cyan-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${mode === 'overload' || mode === 'anomaly' ? 'bg-rose-500' : 'bg-cyan-500'}`}></span>
            </span>
            <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100 text-glow-cyan' : 'text-slate-700'}`}>
              Simulation Command Center <span className="font-mono text-[9px] opacity-40 ml-1">[[ SYSTEM LOGIC PROXIES ]]</span>
            </h3>
          </div>
          <p className="font-mono text-[9px] text-slate-500 mt-0.5">Control live clock multipliers and telemetry stress coefficients</p>
        </div>

        {/* Speed Controls & Audio toggler */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px]">
          
          {/* Synthesizer Audio Volume control */}
          <button
            id="audio-sound-toggle"
            onClick={handleMuteToggle}
            title={soundMuted ? "Enable terminal acoustics" : "Mute terminal acoustics"}
            className={`px-2 py-1 rounded-md border flex items-center gap-1 cursor-pointer transition-all ${
              soundMuted 
                ? 'border-slate-800/20 bg-slate-950/20 text-slate-500' 
                : 'border-cyan-555/30 bg-cyan-500/10 text-cyan-400 font-bold'
            }`}
          >
            {soundMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3 animate-pulse" />}
            {soundMuted ? 'MUTED' : 'BEEPS ACTIVE'}
          </button>

          {/* Continuous Hum Drone Control */}
          <button
            id="ambient-hum-toggle"
            onClick={handleBgHumToggle}
            title={bgHumEnabled ? "Shut down ambient reactor drone and radio static" : "Boot ambient reactor drone and radio static"}
            className={`px-2 py-1 rounded-md border flex items-center gap-1 cursor-pointer transition-all ${
              !bgHumEnabled || soundMuted
                ? 'border-slate-850 bg-slate-950/20 text-slate-500' 
                : 'border-pink-500/30 bg-pink-500/10 text-pink-550 font-bold text-glow-magenta'
            }`}
          >
            <Activity className={`h-3 w-3 ${bgHumEnabled && !soundMuted ? 'animate-pulse' : ''}`} />
            {bgHumEnabled && !soundMuted ? 'AMBIENT DRONE' : 'DRONE COLLAPSED'}
          </button>

          <div className="flex items-center gap-1 p-1 rounded-lg border bg-slate-950/25 border-slate-800/10">
            <span className="text-slate-500 px-1.5 font-bold uppercase text-[8px]">CLOCK MULTIPLIER:</span>
            
            <button
              id="speed-pause"
              onClick={() => handleSpeedChange('paused')}
              title="Pause simulation"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${speed === 'paused' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Pause className="h-2 w-2" />
              PAUSE
            </button>

            <button
              id="speed-normal"
              onClick={() => handleSpeedChange('normal')}
              title="1x normal velocity"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${speed === 'normal' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Play className="h-2 w-2" />
              1x NORMAL
            </button>

            <button
              id="speed-warp"
              onClick={() => handleSpeedChange('warp')}
              title="4x hyper speed"
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${speed === 'warp' ? 'bg-pink-500/20 text-pink-500 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Zap className="h-2 w-2 animate-pulse" />
              4x HYPER
            </button>
          </div>
        </div>
      </div>

      {/* Profiles Choice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {profiles.map((prof) => {
          const isSelected = mode === prof.value;
          
          let btnStyle = isDark 
            ? 'bg-slate-950/30 border-slate-850 hover:bg-slate-900 text-slate-350'
            : 'bg-slate-50 border-slate-150 hover:bg-slate-100/60 text-slate-600';

          if (isSelected) {
            if (prof.color === 'cyan') btnStyle = 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400 text-glow-cyan font-bold';
            if (prof.color === 'green') btnStyle = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 text-glow-green font-bold';
            if (prof.color === 'amber') btnStyle = 'bg-amber-500/15 border-amber-500/50 text-amber-500 text-glow-amber font-bold';
            if (prof.color === 'rose') btnStyle = 'bg-rose-500/15 border-rose-500/50 text-rose-450 text-glow-magenta font-bold';
            if (prof.color === 'magenta') btnStyle = 'bg-pink-500/15 border-pink-550/50 text-pink-500 text-glow-magenta font-bold';
          }

          return (
            <button
              id={`profile-mode-${prof.value}`}
              key={prof.value}
              onClick={() => handleModeChange(prof.value)}
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
            onClick={handleTriggerAnomaly}
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
            onClick={handleSystemReboot}
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
