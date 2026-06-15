/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Radio } from 'lucide-react';
import { cyberAudio } from '../utils/audio';

interface SpiralProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

export default function SpiralOscilloscope({ mode, speed, isDark }: SpiralProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [resonance, setResonance] = useState(88.4);
  const [harmonics, setHarmonics] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxRadius = Math.min(cx, cy) - 15;

      let speedFactor = 1;
      if (speed === 'paused') speedFactor = 0;
      if (speed === 'warp') speedFactor = 3;

      let noiseCoeff = 0;
      if (mode === 'volatile') noiseCoeff = 3;
      if (mode === 'anomaly' || mode === 'overload') noiseCoeff = 8;

      if (speedFactor > 0) {
        frame += 0.02 * speedFactor;
      }

      // 1. Draw outer target scope circles
      ctx.lineWidth = 1;
      for (let r = 0.2; r <= 1.0; r += 0.2) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * r, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? `rgba(6, 182, 212, ${0.15 - r * 0.1})` : `rgba(14, 116, 144, ${0.12 - r * 0.08})`;
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.05)' : 'rgba(14, 116, 144, 0.05)';
      ctx.stroke();

      // 2. Draw complex multi-orbit spiropyra wave (sine resonance)
      // We will draw three intertwined coils: cyan, magenta, and amber
      const drawCoil = (color: string, phaseShift: number, scaleMultiplier: number, swirlCount: number) => {
        ctx.beginPath();
        const loops = 120;
        
        for (let i = 0; i < loops; i++) {
          const t = (i / loops) * Math.PI * swirllist;
          const currentRadius = (i / loops) * maxRadius * scaleMultiplier;
          
          // Lissajous / spiral equations with multi-harmonics
          const warpJitter = Math.sin(t * harmonics + frame + phaseShift) * noiseCoeff * (i / loops);
          const x = cx + Math.cos(t + frame + phaseShift) * (currentRadius + warpJitter);
          const y = cy + Math.sin(t + frame + phaseShift) * (currentRadius + warpJitter);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = color;
        ctx.shadowBlur = isDark ? 6 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Swirl count adapts with mode
      const swirllist = mode === 'anomaly' ? 8 : (mode === 'overload' ? 12 : 6);

      // Render the multiple phase rings matching the iconic visual
      drawCoil('rgba(6, 182, 212, 0.85)', 0, 1.0, swirllist); // Cyan core
      drawCoil('rgba(236, 72, 153, 0.75)', Math.PI * 0.4, 0.9, swirllist); // Magenta echo
      drawCoil('rgba(245, 158, 11, 0.55)', Math.PI * 0.8, 0.8, swirllist); // Amber sub-harmonics

      // 3. Draw central active glowing node core
      const pulseRadius = 4 + Math.sin(frame * 4) * 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = mode === 'overload' ? '#ef4444' : '#06b6d4';
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update interactive stats
      if (speedFactor > 0 && Math.random() < 0.05) {
        const delta = (Math.random() - 0.5) * 0.4;
        setResonance(prev => {
          let next = prev + delta;
          if (mode === 'overload') next += Math.random() * 0.5;
          if (mode === 'optimal') next = 99.8 + (Math.random() - 0.5) * 0.1;
          return Math.max(40, Math.min(120, next));
        });
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mode, speed, harmonics, isDark]);

  useEffect(() => {
    // Harmonics depend slightly on mode
    if (mode === 'overload') setHarmonics(6);
    else if (mode === 'optimal') setHarmonics(2);
    else setHarmonics(3);
  }, [mode]);

  return (
    <div id="spiral-oscilloscope-container" className={`relative border p-4 backdrop-blur-md transition-all cyber-hud-card corner-ticks corner-ticks-inner ${isDark ? 'bg-[#040609]/95 border-cyan-500/15 text-slate-100 shadow-[0_0_20px_rgba(226,88,62,0.03)]' : 'bg-white/80 border-slate-200'}`}>
      <div className="flex items-center justify-between border-b pb-2 mb-3 border-dashed border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-pink-500 animate-pulse" />
          <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Spiral Resonance Oscillo-viz
          </h3>
        </div>
        <div className="flex gap-2">
          <button 
            id="harmonics-multiplier"
            onClick={() => {
              cyberAudio.playClick();
              setHarmonics(prev => (prev % 6) + 1);
            }}
            title="Adjust harmonics structure"
            className={`font-mono text-[9px] px-2 py-0.5 rounded border transition-all cursor-pointer ${isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-cyan-400' : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-cyan-600'}`}>
            COILS: x{harmonics}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={240}
            height={190}
            className="max-w-full"
          />
          {/* Neon absolute target cursor */}
          <div className="absolute top-1 right-2 font-mono text-[8.5px] text-right pointer-events-none">
            <span className="text-pink-500 text-glow-magenta block">REF SPEED: {speed.toUpperCase()}</span>
            <span className="text-cyan-400 text-glow-cyan block">PHASE COIL: 3-DIPOLE</span>
          </div>

          <div className="absolute bottom-1 left-2 font-mono text-[8px] opacity-40 pointer-events-none">
            POLAR ROTATION GRIDS v4.21
          </div>
        </div>

        {/* Oscilloscope Real-time readouts */}
        <div className="mt-2 w-full grid grid-cols-3 gap-2 border-t pt-2 border-slate-800/20 text-center font-mono text-[10px]">
          <div>
            <div className={`text-slate-500 text-[8px] uppercase`}>Resonance</div>
            <div className={`font-bold font-display ${mode === 'overload' ? 'text-rose-400' : 'text-cyan-400'}`}>
              {resonance.toFixed(3)} GHz
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[8px] uppercase">Coherence</div>
            <div className="font-bold text-slate-200 text-glow-green text-green-400">
              {mode === 'overload' ? '28.1%' : mode === 'anomaly' ? '41.5%' : '94.2%'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[8px] uppercase">Wave Flux</div>
            <div className="font-bold text-pink-500 text-glow-magenta">
              {mode === 'overload' ? '±14.8v' : '±1.14v'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
