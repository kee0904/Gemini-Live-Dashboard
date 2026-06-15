/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Cpu, Server, HardDrive, RefreshCw } from 'lucide-react';

interface DialsProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

interface ServerProcess {
  name: string;
  load: number;
  pid: number;
  threads: number;
  status: 'ACTIVE' | 'IDLE' | 'WARNING';
}

export default function SystemDials({ mode, speed, isDark }: DialsProps) {
  const [cpuUsage, setCpuUsage] = useState(45.8);
  const [diskIo, setDiskIo] = useState(12.4);
  const [processes, setProcesses] = useState<ServerProcess[]>([]);

  useEffect(() => {
    // Generate initial Processes list
    const initialProcs: ServerProcess[] = [
      { name: 'nginx-reverse-proxy', load: 8.4, pid: 1402, threads: 8, status: 'ACTIVE' },
      { name: 'redis-cache-cluster', load: 4.2, pid: 1541, threads: 12, status: 'ACTIVE' },
      { name: 'pg-pooler-db', load: 15.1, pid: 1980, threads: 32, status: 'ACTIVE' },
      { name: 'express-routing-gw', load: 24.5, pid: 2110, threads: 16, status: 'ACTIVE' },
      { name: 'gemini-model-proxy', load: 0.8, pid: 2841, threads: 4, status: 'IDLE' },
    ];
    setProcesses(initialProcs);

    if (speed === 'paused') return;

    let tickFactor = 1000;
    if (speed === 'warp') tickFactor = 300;

    const interval = setInterval(() => {
      // Modulate CPU based on simulation Mode
      setCpuUsage((prev) => {
        let target = 45;
        if (mode === 'overload') target = 96.4;
        if (mode === 'optimal') target = 22.8;
        if (mode === 'volatile') target = 65 + Math.random() * 20;
        
        const next = prev * 0.9 + target * 0.1 + (Math.random() - 0.5) * 4;
        return Math.max(1, Math.min(100, next));
      });

      // Modulate Disk I/O
      setDiskIo((prev) => {
        let target = 15;
        if (mode === 'overload') target = 84.1;
        if (mode === 'optimal') target = 8.4;
        if (mode === 'anomaly') target = 54.0;
        
        const next = prev * 0.92 + target * 0.08 + (Math.random() - 0.5) * 1.5;
        return Math.max(0.1, Math.min(100, next));
      });

      // Update processes load
      setProcesses((prev) => {
        return prev.map((proc) => {
          let factor = 1.0;
          if (mode === 'overload') factor = 2.4;
          if (mode === 'optimal') factor = 0.55;

          const baseLoad = proc.name.includes('nginx') ? 8.4 : 
                           proc.name.includes('redis') ? 4.2 :
                           proc.name.includes('pg-pooler') ? 15.1 :
                           proc.name.includes('express') ? 24.5 : 0.8;

          let nextLoad = baseLoad * factor + (Math.random() - 0.5) * 4;
          if (nextLoad < 0) nextLoad = 0;
          if (nextLoad > 100) nextLoad = 99.8;

          let status: 'ACTIVE' | 'IDLE' | 'WARNING' = 'ACTIVE';
          if (nextLoad > 65) status = 'WARNING';
          else if (nextLoad < 1.5) status = 'IDLE';

          return {
            ...proc,
            load: parseFloat(nextLoad.toFixed(1)),
            status,
          };
        });
      });
    }, tickFactor);

    return () => clearInterval(interval);
  }, [mode, speed]);

  // SVG parameters for horizontal dial indicators (speedometers in lower-left)
  const drawArcGauge = (value: number, name: string, icon: React.ReactNode, isWarn: boolean) => {
    const arcRadius = 26;
    const circ = Math.PI * arcRadius; // Half-circle parameters
    const strokeDash = circ;
    const strokeOffset = circ - (value / 100) * circ;

    return (
      <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md ${isDark ? 'bg-slate-900' : 'bg-white shadow-xs'}`}>
            {icon}
          </div>
          <div className="font-mono">
            <span className="text-slate-500 text-[8px] uppercase block">{name}</span>
            <span className={`text-[12px] font-bold ${isWarn ? 'text-rose-450 text-glow-magenta' : 'text-cyan-400 text-glow-cyan'}`}>
              {value.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Speedometer Gauges representing Segment Arc in bottom-left */}
        <div className="relative h-10 w-16">
          <svg className="w-16 h-10 transform -rotate-180 hover:scale-105 transition-transform duration-300">
            {/* Background tracking arc */}
            <path
              d="M 5,30 A 25,25 0 0,1 65,30"
              fill="none"
              className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'}
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Active tracking arc */}
            <path
              d="M 5,30 A 25,25 0 0,1 65,30"
              fill="none"
              className={`${isWarn ? 'stroke-rose-500' : 'stroke-cyan-400'} transition-all duration-300`}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={strokeOffset}
            />
          </svg>
          <div className="absolute bottom-0 inset-x-0 text-center font-mono text-[7px] text-slate-500">
            CYL-#{name.substring(0, 3)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="system-dials-processes-container" className={`rounded-xl border p-4 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
      <div className="flex items-center justify-between border-b pb-2 mb-3 border-dashed border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-cyan-400" />
          <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Host Container Telemetry
          </h3>
        </div>
        <span className="font-mono text-[9px] text-slate-500">UPTIME: 36d 14h 28m</span>
      </div>

      {/* Speedometer Segmented Arcs representing dials in bottom left */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {drawArcGauge(cpuUsage, 'Core CPU cluster', <Cpu className={`h-4 w-4 ${cpuUsage > 80 ? 'text-rose-400' : 'text-cyan-400'}`} />, cpuUsage > 80)}
        {drawArcGauge(diskIo, 'Sub-array I/O Rate', <HardDrive className={`h-4 w-4 ${diskIo > 75 ? 'text-rose-400' : 'text-cyan-400'}`} />, diskIo > 75)}
      </div>

      {/* Server Processes list representing bottom tabular charts */}
      <div className="overflow-x-auto cyber-scroll">
        <div className={`p-1.5 rounded-lg border text-[8.5px] uppercase font-mono mb-2 flex justify-between ${isDark ? 'bg-slate-950/60 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-500'}`}>
          <span>Cluster active threads</span>
          <span className="text-pink-550 text-glow-magenta text-pink-550 font-bold">MUTUAL TUNNELING ENCRYPTED</span>
        </div>
        
        <table className="w-full text-left font-mono text-[9px]">
          <thead>
            <tr className={`border-b border-dashed border-slate-800/15 text-slate-500`}>
              <th className="pb-1">PROC NAME</th>
              <th className="pb-1 text-center">PID</th>
              <th className="pb-1 text-center">THREADS</th>
              <th className="pb-1 text-right">ACTIVE LOAD</th>
              <th className="pb-1 text-center">SCHEDULING</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/5">
            {processes.map((proc, idx) => (
              <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                <td className={`py-1.5 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{proc.name}</td>
                <td className="py-1.5 text-center text-slate-500">{proc.pid}</td>
                <td className="py-1.5 text-center text-slate-550 font-bold text-slate-400">{proc.threads}</td>
                <td className={`py-1.5 text-right font-bold ${proc.status === 'WARNING' ? 'text-rose-400 text-glow-magenta' : 'text-cyan-450 text-cyan-400'}`}>
                  {proc.load}%
                </td>
                <td className="py-1.5 text-center">
                  <span className={`px-1 rounded text-[8px] font-semibold ${
                    proc.status === 'ACTIVE' ? 'bg-cyan-500/10 text-cyan-400' :
                    proc.status === 'WARNING' ? 'bg-rose-500/10 text-rose-400 animate-pulse' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {proc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
