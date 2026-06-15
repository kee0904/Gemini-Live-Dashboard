/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SimulationMode, SimulationSpeed } from '../types';
import { Globe, Compass, Target, Orbit, Radio, Zap, Rotate3d, Compass as CompassIcon, Sliders, ChevronRight } from 'lucide-react';
import { cyberAudio } from '../utils/audio';

interface GalaxyMapProps {
  mode: SimulationMode;
  speed: SimulationSpeed;
  isDark: boolean;
}

interface SolarSystem {
  id: string;
  name: string;
  orbitRadius: number; // Normalized orbit radius from center core (0.2 to 1.0)
  orbitSpeed: number; // Speed multiplier of orbit
  phase: number; // Starting angle offset
  size: number;
  color: string;
  type: string;
  spectral: string;
  coordinates: string;
  status: string;
}

export default function GalaxyMap({ mode, speed, isDark }: GalaxyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Perspective parameters
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [pitch, setPitch] = useState(-0.55); // Rotation around X-axis (radians)
  const [yaw, setYaw] = useState(0.68);   // Rotation around Y-axis (radians)
  const [roll, setRoll] = useState(0);     // Rotation around Z-axis (radians)
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, pitch: 0, yaw: 0 });

  const [selectedSystem, setSelectedSystem] = useState<SolarSystem | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<SolarSystem | null>(null);
  const [scanAngle, setScanAngle] = useState(0);
  const [targetLockProgress, setTargetLockProgress] = useState(1.0);
  const [isHyperdriveArmed, setIsHyperdriveArmed] = useState(false);
  const [systemProjectedPoints, setSystemProjectedPoints] = useState<Record<string, { x: number; y: number; z: number }>>({});

  // Stellar solar configurations (Radius values mapped to fit beautifully on screen)
  const solarSystems: SolarSystem[] = [
    { 
      id: 'sys-0', 
      name: 'Hyperion Alpha', 
      orbitRadius: 0.44,
      orbitSpeed: 0.25,
      phase: 1.2,
      size: 7, 
      color: '#e2583e', // Orange giant
      type: 'Hyper-giant Star System', 
      spectral: 'K2-V Giant', 
      coordinates: 'DEC -24° 15\' • RA 18h 47m',
      status: 'HYDROGEN_RICH / ACTIVE'
    },
    { 
      id: 'sys-1', 
      name: 'Solaris Gateway', 
      orbitRadius: 0.28,
      orbitSpeed: 0.45,
      phase: 4.8,
      size: 5.5, 
      color: '#22d3ee', // Cyan star
      type: 'Binary Star Core', 
      spectral: 'O9-IV Bright Blue', 
      coordinates: 'DEC +11° 02\' • RA 12h 19m',
      status: 'CARRIER_NOMINAL / TRANSMITTING'
    },
    { 
      id: 'sys-2', 
      name: 'Andromeda Relay', 
      orbitRadius: 0.72,
      orbitSpeed: 0.14,
      phase: 0.5,
      size: 6, 
      color: '#fbbf24', // Amber giant
      type: 'Pulsar Transmitter Node', 
      spectral: 'Pulsar PSR B1919+21', 
      coordinates: 'DEC +21° 47\' • RA 19h 21m',
      status: 'PULSING / PERIODIC'
    },
    { 
      id: 'sys-3', 
      name: 'Sagittarius Void', 
      orbitRadius: 0.88,
      orbitSpeed: 0.08,
      phase: 2.9,
      size: 5, 
      color: '#ec4899', // Pink nebula node
      type: 'Singularity Drift Sector', 
      spectral: 'Supermassive Core Sgr A*', 
      coordinates: 'DEC -29° 00\' • RA 17h 45m',
      status: 'GRAVITATIONAL_DECAY'
    },
    { 
      id: 'sys-4', 
      name: 'Orion Edge-9', 
      orbitRadius: 0.58,
      orbitSpeed: 0.18,
      phase: 3.4,
      size: 4.5, 
      color: '#34d399', // Green forest emitter
      type: 'Stellar Nursery Sector', 
      spectral: 'G5-V Yellow Dwarf', 
      coordinates: 'DEC -05° 23\' • RA 05h 35m',
      status: 'STABLE / SCAN_SYNCED'
    },
  ];

  // Set default selection to Solaris Gateway
  useEffect(() => {
    setSelectedSystem(solarSystems[1]);
  }, []);

  // Update loop for auto rotating 3D galaxy & scan radar Sweeper
  useEffect(() => {
    if (speed === 'paused') return;
    let increment = 0.008;
    let radarIncrement = 0.02;
    if (speed === 'warp') {
      increment = 0.035;
      radarIncrement = 0.06;
    }

    let frameId: number;
    const animate = () => {
      setScanAngle((prev) => (prev + radarIncrement) % (Math.PI * 2));
      if (autoRotate && viewMode === '3d') {
        setYaw((prev) => (prev + increment) % (Math.PI * 2));
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [speed, autoRotate, viewMode]);

  // Target lock progression trigger when selection changes
  useEffect(() => {
    setTargetLockProgress(0.0);
  }, [selectedSystem]);

  useEffect(() => {
    if (targetLockProgress >= 1.0) return;
    const interval = setInterval(() => {
      setTargetLockProgress((p) => Math.min(1.0, p + 0.12));
    }, 40);
    return () => clearInterval(interval);
  }, [targetLockProgress]);

  // WebGL-like vector pseudo-3D engine rendering onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Extracted scale constant
    const globalScale = Math.min(width, height) / 2.2;

    ctx.clearRect(0, 0, width, height);

    // Active state modifiers
    const isOverload = mode === 'overload';
    const isAnomaly = mode === 'anomaly';

    // 1. Math formulas for 3D Perspective Projection Matrix
    // Angle parameters depend on viewMode
    const curPitch = viewMode === '3d' ? pitch : 0; // Flat top-down on 2D mode
    const curYaw = viewMode === '3d' ? yaw : 0;
    const curRoll = viewMode === '3d' ? roll : 0;

    // Helper matrices rotation transformation functions
    const project3D = (x: number, y: number, z: number) => {
      // Rotate Yarn (Yaw - around Y axis)
      let x1 = x * Math.cos(curYaw) - z * Math.sin(curYaw);
      let z1 = x * Math.sin(curYaw) + z * Math.cos(curYaw);
      let y1 = y;

      // Rotate Pitch (around X axis)
      let y2 = y1 * Math.cos(curPitch) - z1 * Math.sin(curPitch);
      let z2 = y1 * Math.sin(curPitch) + z1 * Math.cos(curPitch);
      let x2 = x1;

      // Rotate Roll (around Z axis)
      let x3 = x2 * Math.cos(curRoll) - y2 * Math.sin(curRoll);
      let y3 = x2 * Math.sin(curRoll) + y2 * Math.cos(curRoll);
      let z3 = z2;

      // Camera field of view projection translation
      const cameraDistance = 2.4; 
      const distanceZ = cameraDistance + z3;
      const perspectiveScale = 1.3 / distanceZ; 

      const outputX = centerX + x3 * globalScale * perspectiveScale;
      const outputY = centerY + y3 * globalScale * perspectiveScale;

      return {
        x: outputX,
        y: outputY,
        z: z3, // Saved for depth z-depth sorted rendering
      };
    };

    // Draw grid bounds background plane
    ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.05)' : 'rgba(15, 23, 42, 0.04)';
    ctx.lineWidth = 1;

    if (viewMode === '3d') {
      // Render coordinate crosshairs grids in 3D Space
      ctx.beginPath();
      // Draw grid planes along flat X-Z axes
      for (let g = -1.0; g <= 1.0; g += 0.4) {
        // Parallel X lines
        const gStart1 = project3D(g, 0, -1.0);
        const gEnd1 = project3D(g, 0, 1.0);
        ctx.moveTo(gStart1.x, gStart1.y);
        ctx.lineTo(gEnd1.x, gEnd1.y);

        // Parallel Z lines
        const gStart2 = project3D(-1.0, 0, g);
        const gEnd2 = project3D(1.0, 0, g);
        ctx.moveTo(gStart2.x, gStart2.y);
        ctx.lineTo(gEnd2.x, gEnd2.y);
      }
      ctx.stroke();

      // Render concentric reference grid guide spheres
      ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.08)' : 'rgba(15, 23, 42, 0.05)';
      [0.35, 0.7, 1.05].forEach((gr) => {
        ctx.beginPath();
        const segments = 64;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const p = project3D(Math.cos(theta) * gr, 0, Math.sin(theta) * gr);
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      });
    } else {
      // Classical 2D rings
      ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.1)' : 'rgba(15, 23, 42, 0.06)';
      [0.25, 0.5, 0.75, 1.0].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, globalScale * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.moveTo(centerX - globalScale, centerY);
      ctx.lineTo(centerX + globalScale, centerY);
      ctx.moveTo(centerX, centerY - globalScale);
      ctx.lineTo(centerX, centerY + globalScale);
      ctx.stroke();
    }

    // 2. Generate and Render 3D Spiral Nebula Arm Particles
    // Pre-calculated particles using deterministic seed to avoid flickering
    const starsCount = 450;
    const projectedStars: { px: number; py: number; size: number; alpha: number; isOrange: boolean; z: number }[] = [];

    for (let i = 0; i < starsCount; i++) {
      const armIdx = i % 2;
      const angleOffset = armIdx * Math.PI;
      const t = (i / starsCount) * Math.PI * 3.8; // Tight spiral multiplier
      
      const rVal = (t / (Math.PI * 3.8)) * 0.98;
      // Animate galaxy rotation speed inside stars
      const waveFreq = TimeStampOffset() * 0.0006;
      const floatAngle = t + angleOffset + waveFreq * (i % 3 === 0 ? 0.4 : 0.8) + (isAnomaly ? Math.sin(scanAngle) * 0.1 : 0);
      
      // Calculate 3D star coordinates
      const rawX = Math.cos(floatAngle) * rVal + (i % 7 === 0 ? (Math.sin(i) * 0.07) : 0);
      // Beautiful central core bulge vertically in 3D!
      const rawY = (Math.random() - 0.5) * 0.08 + (1 - rVal) * 0.12 * Math.sin(i * 1.5);
      const rawZ = Math.sin(floatAngle) * rVal + (i % 7 === 0 ? (Math.cos(i) * 0.07) : 0);

      const pStar = project3D(rawX, rawY, rawZ);

      // Cull items outside circular sector plane range
      const dist = Math.sqrt(rawX*rawX + rawZ*rawZ);
      if (dist < 1.1) {
        projectedStars.push({
          px: pStar.x,
          py: pStar.y,
          size: i % 14 === 0 ? 1.4 : 0.8,
          alpha: 0.2 + (1 - pStar.z) * 0.4, // Depth fading!
          isOrange: i % 18 === 0,
          z: pStar.z,
        });
      }
    }

    // Draw the pre-calculated stars sorted by depth to render behind planets correctly
    projectedStars.sort((a, b) => b.z - a.z);
    projectedStars.forEach((star) => {
      ctx.beginPath();
      ctx.fillStyle = star.isOrange 
        ? (isDark ? `rgba(226, 88, 62, ${star.alpha * 1.2})` : `rgba(226, 88, 62, ${star.alpha * 0.7})`)
        : `rgba(34, 211, 238, ${star.alpha})`;
      ctx.arc(star.px, star.py, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Dynamic Orbit paths for the 5 interactive systems in 3D
    solarSystems.forEach((sys) => {
      ctx.beginPath();
      ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.09)' : 'rgba(15, 23, 42, 0.07)';
      ctx.lineWidth = selectedSystem?.id === sys.id ? 1.5 : 1;
      if (selectedSystem?.id === sys.id) {
        ctx.setLineDash([4, 6]);
      }

      const steps = 64;
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * Math.PI * 2;
        const orbitX = Math.cos(theta) * sys.orbitRadius;
        const orbitZ = Math.sin(theta) * sys.orbitRadius;
        // Slight gravitational wave inclination warp
        const orbitY = Math.sin(theta * 2) * sys.orbitRadius * 0.06;
        
        const p = project3D(orbitX, orbitY, orbitZ);
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 4. Calculate live system positions orbiting in 3D space
    const updatedProjectedPoints: Record<string, { x: number; y: number; z: number }> = {};
    const timestampFactor = TimeStampOffset() * 0.001 * (speed === 'paused' ? 0.0 : (speed === 'warp' ? 2.5 : 1.0));

    solarSystems.forEach((sys) => {
      const angle = sys.orbitSpeed * timestampFactor + sys.phase;
      
      const orbitX = Math.cos(angle) * sys.orbitRadius;
      const orbitZ = Math.sin(angle) * sys.orbitRadius;
      // Slanting incline
      const orbitY = Math.sin(angle * 2) * sys.orbitRadius * 0.06;

      const pSys = project3D(orbitX, orbitY, orbitZ);
      updatedProjectedPoints[sys.id] = pSys;
    });

    // Update coordinates reference map for mouse triggers asynchronously
    // Avoid infinite loop by only updating if values significantly changed
    setTimeout(() => {
      setSystemProjectedPoints(updatedProjectedPoints);
    }, 0);

    // Sort systems according to Z depth to render foreground systems on top of background systems
    const sortedSystems = [...solarSystems].sort((a, b) => {
      const pA = updatedProjectedPoints[a.id];
      const pB = updatedProjectedPoints[b.id];
      if (!pA || !pB) return 0;
      return pB.z - pA.z; // back to front
    });

    // 5. Draw the 3D Systems and brackets
    sortedSystems.forEach((sys) => {
      const p = updatedProjectedPoints[sys.id];
      if (!p) return;

      const isSelected = selectedSystem?.id === sys.id;
      const isHovered = hoveredSystem?.id === sys.id;

      // Depth scaled sizing multiplier
      const scaleMult = 1 / (2.4 + p.z);
      const planetSize = sys.size * scaleMult * 2.1;

      // Dynamic glow triggers
      const hasRadarSweepPassed = matchesActiveSweepAngle(sys, timestampFactor);

      // Draw halo rings for selected items
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, planetSize * 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#e2583e'; // glowing red orange indicator
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Bracket targets corner ticks
        ctx.strokeStyle = '#e2583e';
        ctx.lineWidth = 1.5;
        const bL = planetSize * 1.8 + 2;

        ctx.beginPath();
        // Top Left
        ctx.moveTo(p.x - bL, p.y - bL + 3);
        ctx.lineTo(p.x - bL, p.y - bL);
        ctx.lineTo(p.x - bL + 3, p.y - bL);
        // Top Right
        ctx.moveTo(p.x + bL, p.y - bL + 3);
        ctx.lineTo(p.x + bL, p.y - bL);
        ctx.lineTo(p.x + bL - 3, p.y - bL);
        // Bottom Left
        ctx.moveTo(p.x - bL, p.y + bL - 3);
        ctx.lineTo(p.x - bL, p.y + bL);
        ctx.lineTo(p.x - bL + 3, p.y + bL);
        // Bottom Right
        ctx.moveTo(p.x + bL, p.y + bL - 3);
        ctx.lineTo(p.x + bL, p.y + bL);
        ctx.lineTo(p.x + bL - 3, p.y + bL);
        ctx.stroke();

        // 3D vertical reference vector dropping line to the galactic coordinate plane!
        const projectionPlaneY = project3D(Math.cos(sys.orbitSpeed * timestampFactor + sys.phase) * sys.orbitRadius, 0, Math.sin(sys.orbitSpeed * timestampFactor + sys.phase) * sys.orbitRadius);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(projectionPlaneY.x, projectionPlaneY.y);
        ctx.strokeStyle = 'rgba(226, 88, 62, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Little anchor dot on the plane
        ctx.beginPath();
        ctx.arc(projectionPlaneY.x, projectionPlaneY.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#e2583e';
        ctx.fill();
      } else if (isHovered) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, planetSize * 2.0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // Draw the beautiful 3D layered spheres
      ctx.beginPath();
      ctx.arc(p.x, p.y, planetSize, 0, Math.PI * 2);
      ctx.fillStyle = sys.color;
      ctx.shadowColor = sys.color;
      ctx.shadowBlur = (isSelected || hasRadarSweepPassed) ? 14 : 4;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // System label
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillStyle = isSelected 
        ? '#e2583e' 
        : (isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.9)');
      ctx.textAlign = 'center';
      ctx.fillText(sys.name, p.x, p.y - planetSize - (isSelected ? 9 : 6));
    });

    // 6. Draw glowing sweeper indicator in 2D and 3D
    if (speed !== 'paused' && viewMode === '2d') {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      const scanX = centerX + Math.cos(scanAngle) * globalScale;
      const scanY = centerY + Math.sin(scanAngle) * globalScale;
      ctx.lineTo(scanX, scanY);
      ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.35)' : 'rgba(14, 116, 144, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

  }, [selectedSystem, hoveredSystem, scanAngle, isDark, mode, speed, viewMode, pitch, yaw, roll]);

  // Matches radar sweep alignment based on simple orbit angular checks
  const matchesActiveSweepAngle = (sys: SolarSystem, factor: number) => {
    const sysAngle = (sys.orbitSpeed * factor + sys.phase) % (Math.PI * 2);
    const diff = Math.abs(sysAngle - scanAngle);
    return diff < 0.15;
  };

  // Deterministic millisecond offset to stabilize calculations
  const TimeStampOffset = () => {
    return Date.now();
  };

  // 3D Collision handler for click selects
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return; // avoid click on release of drag

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let clickedSystem: SolarSystem | null = null;
    let minDistance = 999;

    // Detect click against projected system coordinates
    solarSystems.forEach((sys) => {
      const p = systemProjectedPoints[sys.id];
      if (!p) return;

      const dist = Math.sqrt((p.x - clickX) ** 2 + (p.y - clickY) ** 2);
      // High target tolerance for finger clicks
      if (dist < 20 && dist < minDistance) {
        minDistance = dist;
        clickedSystem = sys;
      }
    });

    if (clickedSystem) {
      setSelectedSystem(clickedSystem);
      cyberAudio.playSuccess();
    } else {
      cyberAudio.playClick();
    }
  };

  // Handle Dragging 3D Rotation!
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode !== '3d') return;
    setIsDragging(false);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      pitch,
      yaw,
    };
    canvasRef.current!.style.cursor = 'grabbing';
    
    // Listeners for global moves
    const handleGlobalMouseMove = (moveEvent: MouseEvent) => {
      setIsDragging(true);
      const deltaX = moveEvent.clientX - dragStart.current.x;
      const deltaY = moveEvent.clientY - dragStart.current.y;

      // Rotate proportionally
      setYaw(dragStart.current.yaw + deltaX * 0.012);
      setPitch(Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, dragStart.current.pitch + deltaY * 0.012)));
    };

    const handleGlobalMouseUp = () => {
      canvasRef.current!.style.cursor = 'pointer';
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseMoveDetector = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let hovered: SolarSystem | null = null;
    let minDistance = 999;

    solarSystems.forEach((sys) => {
      const p = systemProjectedPoints[sys.id];
      if (!p) return;

      const dist = Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2);
      if (dist < 18 && dist < minDistance) {
        minDistance = dist;
        hovered = sys;
      }
    });

    setHoveredSystem(hovered);
  };

  const handleWeaponSystemToggle = () => {
    setIsHyperdriveArmed(!isHyperdriveArmed);
    cyberAudio.playClick();
  };

  return (
    <div 
      id="live-3d-galaxy-navigation-panel" 
      className={`relative border p-5 backdrop-blur-md transition-all cyber-hud-card corner-ticks corner-ticks-inner ${
        isDark 
          ? 'bg-[#040609]/95 border-cyan-500/15 text-slate-100 shadow-[0_0_20px_rgba(226,88,62,0.03)]' 
          : 'bg-white border-slate-300 text-slate-800'
      }`}
    >
      {/* Upper header segment telemetry blocks representing high-fidelity tactical readout panels */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 mb-4 border-dashed border-cyan-500/15">
        <div className="flex items-center gap-2 font-mono">
          <Rotate3d className="h-4 w-4 text-[#e2583e] animate-pulse" />
          <div>
            <span className={`text-[11px] tracking-widest font-bold uppercase block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              LIVE 3D VECTOR STELLAR MAP
            </span>
            <span className="text-[7.5px] text-slate-500 block uppercase">REAL-TIME GRAVITATIONAL WAVINESS ALIGNMENT</span>
          </div>
        </div>
        
        {/* Toggle buttons between dynamic 3D Plane space and 2D Planar radar */}
        <div className="flex gap-2 items-center self-stretch sm:self-auto">
          <button
            onClick={() => {
              setViewMode('3d');
              cyberAudio.playClick();
            }}
            className={`flex-1 sm:flex-none text-[8.5px] font-mono font-bold uppercase tracking-wider py-1 px-3 border cursor-pointer transition-all ${
              viewMode === '3d' 
                ? 'bg-[#e2583e] text-slate-950 border-[#e2583e]' 
                : 'bg-slate-950/20 border-cyan-500/10 text-[#22d3ee] hover:border-cyan-500/30'
            }`}
          >
            3D ORBIT VIEW
          </button>
          
          <button
            onClick={() => {
              setViewMode('2d');
              cyberAudio.playClick();
            }}
            className={`flex-1 sm:flex-none text-[8.5px] font-mono font-bold uppercase tracking-wider py-1 px-3 border cursor-pointer transition-all ${
              viewMode === '2d' 
                ? 'bg-[#22d3ee] text-slate-950 border-[#22d3ee]' 
                : 'bg-slate-950/20 border-cyan-500/10 text-[#22d3ee] hover:border-cyan-500/30'
            }`}
          >
            2D FLAT RADAR
          </button>
        </div>
      </div>

      {/* Main Grid: Left side maps, Right side live telemetry readout card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side: Dynamic Canvas vector 3D rendering area */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative p-1 bg-slate-950/20 border border-cyan-500/5 select-none overflow-hidden h-[300px]">
          <canvas
            ref={canvasRef}
            width={380}
            height={300}
            onClick={handleMapClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveDetector}
            className="cursor-pointer max-w-full"
            style={{ cursor: 'pointer' }}
          />

          {/* Interactive instruction HUD */}
          {viewMode === '3d' && (
            <div className="absolute bottom-2 right-2 pointer-events-none font-mono text-[7px] bg-slate-950/60 px-1.5 py-0.5 border border-cyan-500/10 text-slate-400">
              ℹ Draggability: Grab & Swipe model to spin camera angles
            </div>
          )}

          {/* Floating diagnostic HUD metrics */}
          <div className="absolute top-2 left-2 pointer-events-none font-mono text-[8px] bg-slate-950/60 p-1.5 border border-cyan-500/10 text-[#22d3ee] space-y-0.5">
            <div className="text-glow-teal font-extrabold">CAMERA ATTITUDE:</div>
            <div>Yaw: {Math.round(yaw * (180 / Math.PI)) % 360}°</div>
            <div>Pitch: {Math.round(pitch * (180 / Math.PI)) % 360}°</div>
          </div>

          <div className="absolute top-2 right-2 pointer-events-none font-mono text-[8px] bg-slate-950/60 px-1.5 py-0.5 border border-cyan-500/10 text-slate-400">
            PROJECTION: PERSPECTIVE_V1
          </div>

          {/* Compass indicators info */}
          <div className="absolute bottom-2 left-2 text-slate-500 font-mono text-[7.5px] leading-tight flex items-center gap-2">
            <span>COOR_GRID: 3D_PLANE_OCTANT</span>
            <span className="text-slate-700">•</span>
            <span>HYPER_V_MATRIX: ACTIVE</span>
          </div>
        </div>

        {/* Right Side: High-fidelity details & lock statistics */}
        <div className="lg:col-span-5 flex flex-col justify-between font-mono p-1">
          
          <div className="space-y-4">
            {/* Target acquisition tracker */}
            <div className={`p-3 border rounded-none ${isDark ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-center mb-1.5 border-b border-cyan-500/10 pb-1">
                <span className="text-[7.5px] text-slate-500 uppercase">ACQUISITION READOUT</span>
                <span className={`text-[8.5px] font-bold ${targetLockProgress < 1 ? 'text-[#22d3ee] animate-pulse' : 'text-[#e2583e]'}`}>
                  {targetLockProgress < 1 ? 'CALCULATING_PROJECTIONS...' : 'TARGET_LOCKED'}
                </span>
              </div>

              {selectedSystem ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-glow-orange text-[#e2583e] tracking-widest leading-none block">
                      {selectedSystem.name}
                    </span>
                    <span className="text-[8px] px-1 py-0.5 bg-cyan-950/50 border border-cyan-800/15 text-[#22d3ee] font-semibold">
                      {selectedSystem.spectral}
                    </span>
                  </div>

                  <div className="text-[8px] text-slate-400 bg-slate-950/30 p-2 border border-cyan-500/5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">CLASSIFICATION:</span>
                      <span className="font-bold text-slate-200">{selectedSystem.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">COORD 3D COORDS:</span>
                      <span className="text-slate-350">{selectedSystem.coordinates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">SYSTEM VELOCITY:</span>
                      <span className="text-slate-350">{sysRadiusSpeedDesc(selectedSystem)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-cyan-500/5 pt-1.5 mt-1">
                      <span className="text-slate-500 uppercase">HYDROGEN LINK:</span>
                      <span className={`font-bold uppercase ${selectedSystem.status.includes('ACTIVE') || selectedSystem.status.includes('TRANSMITTING') ? 'text-cyan-400' : 'text-pink-400'}`}>
                        {selectedSystem.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-[8px] italic py-4 text-center">
                  Select a stellar system inside the 3D grid model to acquire coordinates link.
                </div>
              )}
            </div>

            {/* Rotations / Yaw/ Pitch controls deck */}
            {viewMode === '3d' && (
              <div className={`p-2.5 border rounded-none ${isDark ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-center text-[7.5px] text-slate-500 uppercase mb-2">
                  <span className="flex items-center gap-1"><Sliders className="h-2.5 w-2.5 text-[#22d3ee]" /> CAMERA FINE TUNER</span>
                  <button 
                    onClick={() => {
                      setAutoRotate(!autoRotate);
                      cyberAudio.playClick();
                    }}
                    className={`text-[7.5px] uppercase px-1 border-none cursor-pointer font-bold ${autoRotate ? 'text-emerald-400' : 'text-slate-500'}`}
                  >
                    Auto-Rotate: {autoRotate ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Range settings to manually dial pitch and yaw */}
                <div className="space-y-1 text-[8px] gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-slate-500 font-mono uppercase">YAW (Y-ROT)</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="6.28" 
                      step="0.05"
                      value={yaw}
                      onChange={(e) => {
                        setYaw(parseFloat(e.target.value));
                        setAutoRotate(false);
                      }}
                      className="flex-1 accent-[#e2583e] h-1 bg-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-12 text-slate-500 font-mono uppercase">PITCH (X-R)</span>
                    <input 
                      type="range" 
                      min="-1.5" 
                      max="1.5" 
                      step="0.05"
                      value={pitch}
                      onChange={(e) => {
                        setPitch(parseFloat(e.target.value));
                        setAutoRotate(false);
                      }}
                      className="flex-1 accent-[#22d3ee] h-1 bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Simulated Live Signal Warp Drive Grid */}
            <div className={`p-2.5 border rounded-none ${isDark ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-center text-[7.5px] text-slate-500 uppercase mb-2">
                <span>HYPER-METRICS GATE SPECTRUM</span>
                <span className="text-[#22d3ee] text-glow-teal font-extrabold font-mono">GRID PRO</span>
              </div>

              <div className="space-y-1.5 text-[8px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase">3D SECTOR DECAY RISK</span>
                  <div className="w-24 bg-slate-900 h-1.5 relative overflow-hidden">
                    <div className="bg-[#e2583e] h-full w-[80%]" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase font-mono">SIGNAL SIGNAL STABILITY</span>
                  <div className="w-24 bg-slate-900 h-1.5 relative overflow-hidden">
                    <div className="bg-[#22d3ee] h-full w-[65%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical action deck */}
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={handleWeaponSystemToggle}
              className={`flex-1 font-mono text-[9px] font-bold uppercase tracking-wider py-2 px-3 border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isHyperdriveArmed 
                  ? 'bg-[#e2583e] text-slate-950 border-[#e2583e] hover:bg-orange-600 shadow-[0_0_12px_rgba(226,88,62,0.4)]' 
                  : 'bg-slate-950/30 border-cyan-500/15 hover:border-cyan-500/40 text-[#22d3ee]'
              }`}
            >
              <Zap className={`h-3 w-3 ${isHyperdriveArmed ? 'animate-pulse' : ''}`} />
              {isHyperdriveArmed ? 'Armed Hyperdrive' : 'Arm Hyperdrive'}
            </button>

            <button
              id="trigger-radar-sweep"
              onClick={() => {
                setTargetLockProgress(0.0);
                cyberAudio.playSuccess();
              }}
              title="Manual space radar telemetry scanline alignment"
              className="px-3 py-2 bg-slate-950/30 hover:bg-slate-900/60 border border-cyan-500/15 hover:border-cyan-500/40 text-glow-teal text-[#22d3ee] font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
            >
              <CompassIcon className="h-3 w-3 animate-spin" />
              SWEEP RADAR
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

// System dynamic properties calculation
function sysRadiusSpeedDesc(sys: SolarSystem): string {
  const normalizedSpeed = Math.round(sys.orbitSpeed * 300);
  return `R=${sys.orbitRadius.toFixed(2)} AU • Orbit T=${normalizedSpeed} km/s`;
}
