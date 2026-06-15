/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SimulationMode, SimulationSpeed, TelemetryLog } from './types';
import ChannelSignal from './components/ChannelSignal';
import OrbitalDials from './components/OrbitalDials';
import SpectrumHistogram from './components/SpectrumHistogram';
import RingMatrix from './components/RingMatrix';
import ParticleNetwork from './components/ParticleNetwork';
import SpiralOscilloscope from './components/SpiralOscilloscope';
import SystemDials from './components/SystemDials';
import ControlCenter from './components/ControlCenter';
import { 
  Sun, 
  Moon, 
  Terminal, 
  ShieldAlert, 
  Percent, 
  Cpu, 
  Wifi, 
  Timer, 
  Clock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [mode, setMode] = useState<SimulationMode>('stable');
  const [speed, setSpeed] = useState<SimulationSpeed>('normal');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [millisecondClock, setMillisecondClock] = useState('');
  
  // High energy counters
  const [activeUsers, setActiveUsers] = useState(14285);
  const [successRate, setSuccessRate] = useState(99.98);
  const [avgResponse, setAvgResponse] = useState(12.4);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Millisecond precision timepiece matching sci-fi dashboard design
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      setMillisecondClock(`${timeStr}.${ms}`);
    };
    
    const interval = setInterval(updateTime, 45);
    return () => clearInterval(interval);
  }, []);

  // Set up initial trace audits and real-time log insertions
  useEffect(() => {
    // Generate diagnostic terminal trace feeds
    const initialLogs: TelemetryLog[] = [
      { id: '1', timestamp: '00:01:02', channel: 'SYS', type: 'success', message: 'Hyperion core initialization complete.', code: 'INIT_OK_01' },
      { id: '2', timestamp: '00:01:03', channel: 'NET', type: 'info', message: 'Secure SSL handshake binding protocols complete.', code: 'TLS_SHAKE_13' },
      { id: '3', timestamp: '00:01:04', channel: 'DB', type: 'info', message: 'Query pooler active on pg-cluster-01.', code: 'DB_CONN_LNK' },
      { id: '4', timestamp: '00:01:05', channel: 'CACHE', type: 'success', message: 'Edge key store allocated to local volatile SSD heap.', code: 'MEM_ALLOC_645' },
    ];
    setLogs(initialLogs);

    if (speed === 'paused') return;

    let tickRate = 2500;
    if (speed === 'warp') tickRate = 600;

    const channels = ['SYS', 'NET', 'DB', 'CACHE', 'SECURITY', 'GATEWAY'];
    const messages = {
      info: [
        'Syncing bucket partitions with edge proxies.',
        'Regulating magnetic fields on disk storage.',
        'Multiplexing inbound channel sockets.',
        'Dumping stale database connection states.',
        'Garbage collection sweeping active CJS buffers.'
      ],
      success: [
        'Secure token verified successfully.',
        'Re-cached index structures parsed in 0.4ms.',
        'No packet loss detected on multiplex channels.',
        'Zero-overhead schema migrations aligned.',
        'API route response handshake validated.'
      ],
      warning: [
        'Channel resonance fluctuating above optimum ranges.',
        'Minor delay in cache replication queues.',
        'Host hypervisor experiencing transient cpu throttle.',
        'Slight telemetry clock drift detected.'
      ],
      error: [
        'Connection dropped by db-shard-02.',
        'Buffer heap allocation overflow limit crossed.',
        'Anomalous signal spike detected in spectra segment.',
        'Rogue client request blocked by security core.'
      ]
    };

    const interval = setInterval(() => {
      setLogs((prev) => {
        // Choose log type proportionally based on Mode
        let type: 'info' | 'success' | 'warning' | 'error' = 'info';
        const rand = Math.random();

        if (mode === 'overload') {
          type = rand < 0.45 ? 'error' : rand < 0.8 ? 'warning' : 'info';
        } else if (mode === 'anomaly') {
          type = rand < 0.35 ? 'error' : rand < 0.65 ? 'warning' : 'success';
        } else if (mode === 'optimal') {
          type = rand < 0.7 ? 'success' : 'info';
        } else {
          type = rand < 0.5 ? 'info' : rand < 0.85 ? 'success' : 'warning';
        }

        const msgList = messages[type];
        const msg = msgList[Math.floor(Math.random() * msgList.length)];
        const chan = channels[Math.floor(Math.random() * channels.length)];
        const now = new Date();
        const codeNum = Math.floor(Math.random() * 900) + 100;
        
        const newLog: TelemetryLog = {
          id: String(Date.now()),
          timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
          channel: chan,
          type,
          message: msg,
          code: `${chan}_${type.toUpperCase()}_${codeNum}`
        };

        return [...prev.slice(-30), newLog]; // Keep last 30 logs max
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, [mode, speed]);

  // Handle active telemetry counters drifting
  useEffect(() => {
    if (speed === 'paused') return;

    let rate = 1500;
    if (speed === 'warp') rate = 400;

    const interval = setInterval(() => {
      // Users
      setActiveUsers((prev) => {
        let delta = Math.floor((Math.random() - 0.5) * 45);
        if (mode === 'overload') delta += Math.floor(Math.random() * 120);
        if (mode === 'optimal') delta -= 12;
        return Math.max(8900, Math.min(25000, prev + delta));
      });

      // Success rate
      setSuccessRate((prev) => {
        let target = 99.98;
        if (mode === 'overload') target = 94.14;
        if (mode === 'anomaly') target = 97.85;
        
        const next = prev * 0.95 + target * 0.05 + (Math.random() - 0.5) * 0.04;
        return Math.max(80, Math.min(100, parseFloat(next.toFixed(2))));
      });

      // Response
      setAvgResponse((prev) => {
        let target = 12.4;
        if (mode === 'overload') target = 248.5;
        if (mode === 'anomaly') target = 84.1;
        if (mode === 'optimal') target = 4.2;

        const next = prev * 0.9 + target * 0.1 + (Math.random() - 0.5) * 1.5;
        return Math.max(0.1, Math.min(500, parseFloat(next.toFixed(1))));
      });
    }, rate);

    return () => clearInterval(interval);
  }, [mode, speed]);

  // Scroll logs to bottom whenever they are appended
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const triggerManualAnomaly = () => {
    // Force mode to volatile/anomaly and inject a severe red log
    setMode('anomaly');
    const now = new Date();
    const alertLog: TelemetryLog = {
      id: String(Date.now()),
      timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      channel: 'SECURITY_ALERT',
      type: 'error',
      message: 'CRITICAL WARNING: MANUAL CASCADE SIGNAL PULSE INJECTED INTO MULTIPLEX PORT.',
      code: 'SEC_SPIKE_911'
    };
    setLogs(prev => [...prev, alertLog]);
  };

  const executeSystemReboot = () => {
    // Wipe logs and slow metrics momentarily, like a refresh action
    const now = new Date();
    setLogs([
      { id: 'reb-1', timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`, channel: 'SYS_REBOOT', type: 'warning', message: 'Wiping local volatile SSD heap cache...', code: 'CACHE_CLR' },
      { id: 'reb-2', timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`, channel: 'SYS_REBOOT', type: 'success', message: 'All telemetry nodes restarted in OPTIMAL mode.', code: 'STAGGER_BOOT' }
    ]);
    setMode('optimal');
    setSuccessRate(100.0);
    setAvgResponse(2.1);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${isDark ? 'cyber-grid-dark text-slate-100 bg-slate-950' : 'cyber-grid-light text-slate-800 bg-slate-50'}`}>
      
      {/* Decorative cyber scanline element */}
      <div className="scanline-effect pointer-events-none fixed inset-0 z-50 h-full w-full" />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
        
        {/* TOP UTILITY HEADER SECTION */}
        <header id="main-dashboard-header" className={`relative rounded-xl border p-4 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Title Block with telemetry active status */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500/10 to-pink-500/10 rounded-xl border border-cyan-500/30">
                <Terminal className="h-5 w-5 text-cyan-400 text-glow-cyan animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-lg tracking-tight uppercase">
                    Quantum Telemetry Grid
                  </h1>
                  <span className={`h-2 w-2 rounded-full ${speed === 'paused' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded font-bold ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-600/10 text-emerald-700'}`}>
                    {speed === 'paused' ? 'SLEEP' : 'LIVE'}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-slate-500 mt-0.5">Multiplexed Real-time Telemetry • Secure Socket Client</p>
              </div>
            </div>

            {/* Precision Digital Clock & Grid statistics */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 font-mono text-[11px]">
              
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-100 border-slate-200'} flex items-center gap-2`}>
                <Clock className="h-3.5 w-3.5 text-pink-500" />
                <div>
                  <span className="text-[7.5px] text-slate-500 uppercase block leading-none">TIME COEFF (UTC)</span>
                  <span className="text-[12px] font-bold text-pink-500 text-glow-magenta tabular-nums">{millisecondClock}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Theme Switcher Toggle */}
                <button
                  id="theme-toggler"
                  onClick={() => setIsDark(!isDark)}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  className={`p-2.5 rounded-lg border transition-all duration-300 transform active:scale-90 cursor-pointer ${
                    isDark 
                      ? 'bg-slate-950 border-slate-800 text-amber-400 hover:bg-slate-900' 
                      : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100 shadow-sm'
                  }`}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                
                <span className="text-slate-500 text-[9.5px]">
                  USER ID: <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>kee0904</span>
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* CONTROLS COMMAND BOARD */}
        <ControlCenter 
          mode={mode}
          speed={speed}
          onChangeMode={setMode}
          onChangeSpeed={setSpeed}
          onTriggerAnomaly={triggerManualAnomaly}
          onSystemReboot={executeSystemReboot}
          isDark={isDark}
        />

        {/* HIGH-DENSITY METRICS HIGHLIGHT ROW */}
        <section id="metric-readout-row" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className={`rounded-xl border p-4 backdrop-blur-md transition-all flex items-center justify-between ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
            <div className="font-mono">
              <span className="text-slate-500 text-[8.5px] uppercase block">Concurrent Channels</span>
              <span className={`text-xl font-bold font-display ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>14,285</span>
              <span className="text-[10px] text-emerald-400 font-bold block mt-1">▲ +{activeUsers % 22} active flows</span>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50/80 text-cyan-600'}`}>
              <Wifi className="h-5 w-5" />
            </div>
          </div>

          <div className={`rounded-xl border p-4 backdrop-blur-md transition-all flex items-center justify-between ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
            <div className="font-mono">
              <span className="text-slate-500 text-[8.5px] uppercase block">Optimal Packet Success</span>
              <span className={`text-xl font-bold font-display text-glow-green ${successRate > 98 ? 'text-green-400 font-bold' : 'text-rose-400'}`}>
                {successRate.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Burst standard ratio</span>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50/80 text-emerald-600'}`}>
              <Percent className="h-5 w-5" />
            </div>
          </div>

          <div className={`rounded-xl border p-4 backdrop-blur-md transition-all flex items-center justify-between ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
            <div className="font-mono">
              <span className="text-slate-500 text-[8.5px] uppercase block">Mean Latency Overhead</span>
              <span className={`text-xl font-bold font-display ${avgResponse > 100 ? 'text-rose-400 text-glow-magenta animate-pulse' : 'text-cyan-400 text-glow-cyan'}`}>
                {avgResponse.toFixed(1)} ms
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Multiplexer roundtrip</span>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-pink-500/10 text-pink-500' : 'bg-pink-50/80 text-pink-600'}`}>
              <Timer className="h-5 w-5" />
            </div>
          </div>

          <div className={`rounded-xl border p-4 backdrop-blur-md transition-all flex items-center justify-between ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
            <div className="font-mono">
              <span className="text-slate-500 text-[8.5px] uppercase block">Security Decoupling</span>
              <span className={`text-xl font-bold font-display text-pink-550 ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>ACTIVE TLS v1.3</span>
              <span className="text-[10px] text-slate-500 block mt-1">Anti-Interference Cryptography</span>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-pink-500/10 text-pink-500' : 'bg-pink-50/80 text-indigo-600'}`}>
              <Layers className="h-5 w-5" />
            </div>
          </div>

        </section>

        {/* CORE TELEMETRY PANEL BENTO GRID */}
        <section id="bento-visualizer-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT BENTO BLOCK (SPAN 7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Row 1: Channel signal packet tracer */}
            <ChannelSignal mode={mode} speed={speed} isDark={isDark} />

            {/* Row 2: Spectrum histogram analysis (The icon-gradient bar chart matching the image completely!) */}
            <div className="h-auto">
              <SpectrumHistogram mode={mode} speed={speed} isDark={isDark} />
            </div>

            {/* Row 3: Speedometer host indicators & process Table views */}
            <SystemDials mode={mode} speed={speed} isDark={isDark} />

          </div>

          {/* RIGHT BENTO BLOCK (SPAN 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Row 1: Memory ring allocator */}
            <RingMatrix mode={mode} speed={speed} isDark={isDark} />

            {/* Row 2: Orbit double loops */}
            <OrbitalDials mode={mode} speed={speed} isDark={isDark} />

            {/* Row 3: Link topology canvas block */}
            <ParticleNetwork mode={mode} speed={speed} isDark={isDark} />

            {/* Row 4: Spiral Resonance Oscilloscope wave */}
            <SpiralOscilloscope mode={mode} speed={speed} isDark={isDark} />

            {/* Row 5: Retropunk scrolling trace logs output */}
            <div className={`rounded-xl border p-5 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center justify-between border-b pb-2 mb-3 border-dashed border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                    Active Trace Auditing Stream
                  </h3>
                </div>
                <span className="font-mono text-[9px] text-slate-500">MAX: 30 BUFFERED</span>
              </div>

              {/* Console log list block */}
              <div className={`rounded-lg p-3 h-48 overflow-y-auto cyber-scroll font-mono text-[9.5px] leading-relaxed transition-colors border ${
                isDark ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'
              }`}>
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                    <Info className="h-3.5 w-3.5 animate-bounce" />
                    Waiting for socket client connection loops...
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-1.5 transition-all">
                        <span className="text-slate-500 tracking-tighter shrink-0">[{log.timestamp}]</span>
                        <span className={`px-1 rounded text-[8.5px] font-bold tracking-tight shrink-0 ${
                          log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                          log.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                          log.type === 'error' ? 'bg-rose-500/10 text-rose-400 animate-pulse' :
                          isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-600/10 text-cyan-600'
                        }`}>
                          {log.channel}
                        </span>
                        <span className="leading-normal flex-1 break-all">{log.message}</span>
                        <span className="text-slate-500 text-[8px] tracking-tight shrink-0">{log.code}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex justify-between font-mono text-[8px] text-slate-500">
                <span>MUTABLE EVENT DISPATCHER STACKS</span>
                <span className="flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-cyan-400" />
                  SSL Tunnel: Secure TLS_RSA_AES_256_GCM
                </span>
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* FOOTER METADATA MARKERS */}
      <footer className="max-w-7xl mx-auto px-4 py-8 text-center font-mono text-[10px] text-slate-500 border-t border-dashed border-slate-800/10 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          QUANTUM TELEMETRY PLATFORM • SYSTEM STATUS: <span className="text-emerald-400">ONLINE</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-cyan-400 transition-colors">SECURITY ENCLAVE</a>
          <span>•</span>
          <a href="#" className="hover:text-pink-500 transition-colors">API INDEX PROTOCOLS</a>
          <span>•</span>
          <a href="#" className="hover:text-amber-500 transition-colors">DIAGNOSTIC ARCHIVE</a>
        </div>
        <div>
          USER: kee0904@gmail.com
        </div>
      </footer>
    </div>
  );
}
