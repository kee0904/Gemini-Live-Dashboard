/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SimulationSpeed = 'paused' | 'normal' | 'warp';

export type SimulationMode = 'stable' | 'volatile' | 'anomaly' | 'overload' | 'optimal';

export interface TelemetryLog {
  id: string;
  timestamp: string;
  channel: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  code: string;
}

export interface NetworkNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  pulseSpeed: number;
  pulsePhase: number;
  load: number; // 0 to 100 percentage
}

export interface NetworkConnection {
  from: string;
  to: string;
  activity: number; // For glowing pulse traversal
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  color: 'cyan' | 'magenta' | 'amber' | 'green' | 'indigo';
  pulse?: boolean;
}
