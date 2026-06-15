/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { NetworkNode, NetworkConnection, SimulationMode, SimulationSpeed } from '../types';
import { Play, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface ParticleNetworkProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

export default function ParticleNetwork({ mode, speed, isDark }: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const nodesRef = useRef<NetworkNode[]>([]);
  const connectionsRef = useRef<NetworkConnection[]>([]);

  // Initialize nodes and connections
  useEffect(() => {
    const nodeNames = ['GATE-01', 'CORE-PROXY', 'DB-SHARD-A', 'AUTH-NODE', 'CACHE-EDGE', 'SATELLITE-V', 'QUEUE-MAIN'];
    const colors = {
      cyan: '#06b6d4',
      magenta: '#ec4899',
      amber: '#f59e0b',
      green: '#22c55e',
      indigo: '#6366f1',
    };

    const initialNodes: NetworkNode[] = nodeNames.map((name, i) => {
      const angle = (i / nodeNames.length) * Math.PI * 2;
      const x = 150 + Math.cos(angle) * 75 + (Math.random() - 0.5) * 30;
      const y = 110 + Math.sin(angle) * 55 + (Math.random() - 0.5) * 30;
      
      let color = colors.cyan;
      if (i === 1) color = colors.magenta;
      if (i === 2) color = colors.amber;
      if (i === 3) color = colors.green;
      if (i === 5) color = colors.indigo;

      return {
        id: `node-${i}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: name.includes('CORE') ? 7 : Math.random() * 3 + 4,
        color,
        label: name,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI,
        load: Math.floor(Math.random() * 40) + 30,
      };
    });

    const initialConnections: NetworkConnection[] = [
      { from: 'node-0', to: 'node-1', activity: 0 },
      { from: 'node-1', to: 'node-2', activity: 0 },
      { from: 'node-1', to: 'node-3', activity: 0 },
      { from: 'node-3', to: 'node-4', activity: 0 },
      { from: 'node-4', to: 'node-0', activity: 0 },
      { from: 'node-5', to: 'node-1', activity: 0 },
      { from: 'node-2', to: 'node-6', activity: 0 },
      { from: 'node-6', to: 'node-5', activity: 0 },
    ];

    nodesRef.current = initialNodes;
    connectionsRef.current = initialConnections;
    setSelectedNode(initialNodes[1]); // Default select core proxy
  }, []);

  // Update loop for particles
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Adjust velocities based on simulation speed & mode
      let speedMultiplier = 1;
      if (speed === 'paused') speedMultiplier = 0;
      if (speed === 'warp') speedMultiplier = 2.5;

      let jitter = 0;
      if (mode === 'volatile') jitter = 0.3;
      if (mode === 'anomaly' || mode === 'overload') jitter = 0.8;

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Update node positions and pulse phases
      nodes.forEach((node) => {
        // Move nodes slightly in bounds in the 300x220 container
        if (speedMultiplier > 0) {
          node.x += (node.vx * speedMultiplier) + (Math.random() - 0.5) * jitter;
          node.y += (node.vy * speedMultiplier) + (Math.random() - 0.5) * jitter;

          // Boundary bounce with damping
          if (node.x < 30 || node.x > canvas.width - 30) {
            node.vx *= -1;
            node.x = Math.max(30, Math.min(canvas.width - 30, node.x));
          }
          if (node.y < 25 || node.y > canvas.height - 25) {
            node.vy *= -1;
            node.y = Math.max(25, Math.min(canvas.height - 25, node.y));
          }

          // Dynamic network load simulation
          node.pulsePhase += node.pulseSpeed * speedMultiplier;
          const targetLoad = mode === 'overload' 
            ? Math.floor(Math.random() * 20) + 80 
            : mode === 'optimal' 
              ? Math.floor(Math.random() * 15) + 15
              : Math.floor(Math.sin(node.pulsePhase) * 20) + 50;
          node.load = node.load * 0.95 + targetLoad * 0.05;
        }
      });

      // Draw Connections (lines) with glowing data-packet pulse flows
      connections.forEach((conn) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return;

        // Line style
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);

        const currentOpacity = isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(14, 116, 144, 0.15)';
        ctx.strokeStyle = currentOpacity;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Glowing node packet transfers (only if not paused)
        if (speedMultiplier > 0) {
          conn.activity = (conn.activity + 0.015 * speedMultiplier) % 1.0;
          
          // Interpolate current packet position
          const px = fromNode.x + (toNode.x - fromNode.x) * conn.activity;
          const py = fromNode.y + (toNode.y - fromNode.y) * conn.activity;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = mode === 'anomaly' || mode === 'overload' ? '#ec4899' : '#06b6d4';
          ctx.shadowColor = ctx.fillStyle as string;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow
        }
      });

      // Draw Nodes
      nodes.forEach((node) => {
        const bounceRadius = node.radius + Math.sin(node.pulsePhase) * 1.5;

        // Draw hover / select halo ring
        const isSelected = selectedNode?.id === node.id;
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, bounceRadius * 2, 0, Math.PI * 2);
          ctx.strokeStyle = node.color + '44'; // 44 opacity hex
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Draw outer glow shadow using canvas properties
        ctx.beginPath();
        ctx.arc(node.x, node.y, bounceRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isDark ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset blur

        // Draw inner white-ish dot for tech aesthetic
        ctx.beginPath();
        ctx.arc(node.x, node.y, bounceRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Label above of node
        ctx.font = '500 8px "JetBrains Mono", monospace';
        ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - bounceRadius - 4);
      });

      localPhase += 0.05;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, speed, selectedNode, isDark]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked near any node
    let foundNode = false;
    nodesRef.current.forEach((node) => {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist < 15) {
        setSelectedNode(node);
        foundNode = true;
      }
    });

    if (!foundNode) {
      // Clear or select another randomly
    }
  };

  return (
    <div id="particle-network-container" className={`relative rounded-xl border p-4 backdrop-blur-md transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
      <div className="flex items-center justify-between border-b pb-2 mb-3 border-dashed border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Microservice Link Map
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded leading-none ${mode === 'overload' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            TCP TRACE
          </span>
          <span className="font-mono text-[9px] opacity-40">7 NODE</span>
        </div>
      </div>

      <div className="relative flex justify-center">
        <canvas
          ref={canvasRef}
          width={320}
          height={210}
          onClick={handleCanvasClick}
          className="cursor-pointer max-w-full"
        />
        
        {/* Absolute floating legend showing selected node stats */}
        {selectedNode && (
          <div className={`absolute bottom-2 left-2 right-2 rounded-lg p-2 border font-mono text-[9px] backdrop-blur-sm grid grid-cols-3 gap-2 align-middle transition-all duration-300 ${isDark ? 'bg-slate-950/90 border-slate-800 text-slate-300' : 'bg-slate-50/95 border-slate-200 text-slate-600'}`}>
            <div className="truncate">
              <div className="text-slate-500 uppercase">Selected Node</div>
              <div className="text-[10px] font-bold tracking-tight text-cyan-400">{selectedNode.label}</div>
            </div>
            
            <div>
              <div className="text-slate-500 uppercase">Active Load</div>
              <div className={`text-[10px] font-bold ${selectedNode.load > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {selectedNode.load.toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-slate-500 uppercase">Vector Velocity</div>
              <div className="text-[10px] text-slate-400">
                Vx: {selectedNode.vx.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1 text-glow-cyan text-cyan-400/80">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Active Packets
        </span>
        <span className="flex items-center gap-1 text-glow-magenta text-magenta-400/80">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
          Latency: {mode === 'overload' ? '284ms' : '24ms'}
        </span>
      </div>
    </div>
  );
}
