/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Network, Activity, AlertTriangle } from 'lucide-react';

interface ChannelProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

interface PacketRow {
  port: number;
  ip: string;
  payload: string;
  status: 'ESTABLISHED' | 'BLOCKED' | 'REROUTED' | 'LISTENING';
  latency: number;
}

export default function ChannelSignal({ mode, speed, isDark }: ChannelProps) {
  const [packetRow, setPacketRow] = useState<PacketRow[]>([]);
  const [bandUsage, setBandUsage] = useState(48.2);

  // Generate continuous custom trace list
  useEffect(() => {
    const listIPs = ['10.0.12.3', '10.0.1.98', '192.168.1.12', '172.16.8.4', '10.10.4.3', '216.58.200.78', '8.8.8.8'];
    const payloads = ['GTE_RECV', 'POST_META', 'SEC_VERIFY', 'DB_MUTATE', 'AUTH_VALID', 'SYNC_P2P', 'DNS_RESOLV'];
    const statuses: ('ESTABLISHED' | 'BLOCKED' | 'REROUTED' | 'LISTENING')[] = ['ESTABLISHED', 'ESTABLISHED', 'ESTABLISHED', 'LISTENING'];

    const initialRows: PacketRow[] = Array(5).fill(0).map(() => {
      const isBlocked = Math.random() < 0.15;
      return {
        port: Math.floor(Math.random() * 8000) + 1000,
        ip: listIPs[Math.floor(Math.random() * listIPs.length)],
        payload: payloads[Math.floor(Math.random() * payloads.length)],
        status: isBlocked ? 'BLOCKED' : statuses[Math.floor(Math.random() * statuses.length)],
        latency: Math.floor(Math.random() * 40) + 12,
      };
    });

    setPacketRow(initialRows);

    if (speed === 'paused') return;

    let tickRate = 1200;
    if (speed === 'warp') tickRate = 300;

    const interval = setInterval(() => {
      setPacketRow((prev) => {
        const isAnomaly = mode === 'anomaly' || mode === 'overload';
        const isBlocked = isAnomaly ? (Math.random() < 0.45) : (Math.random() < 0.12);

        const newRow: PacketRow = {
          port: Math.floor(Math.random() * 8000) + 1000,
          ip: listIPs[Math.floor(Math.random() * listIPs.length)],
          payload: payloads[Math.floor(Math.random() * payloads.length)],
          status: isBlocked ? (mode === 'overload' ? 'BLOCKED' : 'REROUTED') : statuses[Math.floor(Math.random() * statuses.length)],
          latency: isAnomaly ? Math.floor(Math.random() * 200) + 110 : Math.floor(Math.random() * 32) + 12,
        };
        return [newRow, ...prev.slice(0, 4)];
      });

      setBandUsage((prev) => {
        let target = 48.2;
        if (mode === 'overload') target = 94.6;
        if (mode === 'anomaly') target = 18.4;
        if (mode === 'optimal') target = 40.0;
        
        const next = prev * 0.9 + target * 0.1 + (Math.random() - 0.5) * 5;
        return Math.max(5, Math.min(100, next));
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, [mode, speed]);

  return (
    <div id="channel-signal-activity-container" className={`rounded-xl border p-4 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
      <div className="flex items-center justify-between border-b pb-2 mb-3 border-dashed border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-cyan-400" />
          <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Channel Packet Feed
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span className="font-mono text-[9px] text-green-400 text-glow-green">FEED ALIAS: UP</span>
        </div>
      </div>

      {/* Cybernetic mini band-usage display */}
      <div className="grid grid-cols-3 gap-2 mb-3 font-mono text-[10px]">
        <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
          <span className="text-slate-500 text-[8px] uppercase block">Bandwidth Util</span>
          <span className={`font-bold ${bandUsage > 85 ? 'text-rose-400' : 'text-cyan-400'}`}>
            {bandUsage.toFixed(1)}%
          </span>
        </div>
        <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
          <span className="text-slate-500 text-[8px] uppercase block">Anomaly Count</span>
          <span className={`font-bold ${mode === 'overload' || mode === 'anomaly' ? 'text-rose-400' : 'text-emerald-450'}`}>
            {mode === 'overload' ? '28' : mode === 'anomaly' ? '14' : '0'}
          </span>
        </div>
        <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'}`}>
          <span className="text-slate-500 text-[8px] uppercase block">Queue Dropped</span>
          <span className={`font-bold ${mode === 'overload' ? 'text-rose-400' : 'text-slate-400'}`}>
            {mode === 'overload' ? '4.8%' : '0%'}
          </span>
        </div>
      </div>

      {/* Live Data Packets Table */}
      <div className="overflow-x-auto cyber-scroll">
        <table className="w-full text-left font-mono text-[9.5px]">
          <thead>
            <tr className={`border-b border-dashed border-slate-800/10 text-slate-500`}>
              <th className="pb-1.5 font-medium uppercase">PORT</th>
              <th className="pb-1.5 font-medium uppercase">IP ADDRESS</th>
              <th className="pb-1.5 font-medium uppercase">PAYLOAD ID</th>
              <th className="pb-1.5 font-medium uppercase text-right">LATENCY</th>
              <th className="pb-1.5 font-medium uppercase text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/5">
            {packetRow.map((row, idx) => (
              <tr key={idx} className={`hover:bg-slate-500/5 transition-colors ${row.status === 'BLOCKED' ? 'bg-rose-500/5' : ''}`}>
                <td className="py-2 text-cyan-400 font-semibold">{row.port}</td>
                <td className={`py-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{row.ip}</td>
                <td className={`py-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{row.payload}</td>
                <td className="py-2 text-right font-medium">{row.latency} ms</td>
                <td className="py-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold leading-none inline-block ${
                    row.status === 'ESTABLISHED' ? 'bg-emerald-500/10 text-emerald-400' :
                    row.status === 'LISTENING' ? 'bg-blue-500/10 text-blue-400' :
                    row.status === 'REROUTED' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[8px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Secure (SSL/TLS v1.3) packets only
        </span>
        <span>UPTIME RATIO: 99.999%</span>
      </div>
    </div>
  );
}
