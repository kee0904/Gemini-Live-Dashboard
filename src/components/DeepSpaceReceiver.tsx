/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Radio, Signal, Compass, Activity, Volume2, Shield, Mic } from 'lucide-react';
import { cyberAudio } from '../utils/audio';

interface ReceiverProps {
  isDark: boolean;
  speed: string;
}

export default function DeepSpaceReceiver({ isDark, speed }: ReceiverProps) {
  const [frequency, setFrequency] = useState(1420.4); // 1420.4 MHz Hydrogen line!
  const [selectedChannel, setSelectedChannel] = useState('MAIN_INTERCEPT');
  const [signalStrength, setSignalStrength] = useState(55);
  const [isReceiving, setIsReceiving] = useState(false);
  const [interceptionLogs, setInterceptionLogs] = useState<string[]>([]);

  // Simulation loop for cosmic signal fluctuation
  useEffect(() => {
    if (speed === 'paused') return;
    
    const interval = setInterval(() => {
      // Randomly fluctuate signals to look alive
      setSignalStrength((prev) => {
        const offset = Math.floor((Math.random() - 0.5) * 12);
        return Math.max(10, Math.min(100, prev + offset));
      });

      // Randomly trigger a mini walkie talkie voice squelch in the background if tuner is active
      if (Math.random() < 0.08) {
        setIsReceiving(true);
        
        // Add telemetry log for intercepted transmissions
        const codes = ['ASTRONOMY_DET', 'PULSAR_TX', 'SETI_GRID', 'DEEP_SPACE_9'];
        const messageList = [
          'Planetary hydrogen signature spillover detected.',
          'Slight frequency phase shift on Solar Corridor alpha.',
          'Detected high spin neutron beacon radiation.',
          'Faint voice radio noise matched over channel gate.'
        ];
        
        const randomCode = codes[Math.floor(Math.random() * codes.length)];
        const randomMsg = messageList[Math.floor(Math.random() * messageList.length)];
        
        // Play highly realistic walkie talkie voice speaker communication!
        cyberAudio.playHumanTalk(randomMsg);
        
        setInterceptionLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ${randomCode}: ${randomMsg}`,
          ...prev.slice(0, 3)
        ]);

        setTimeout(() => setIsReceiving(false), 1200);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [speed]);

  const triggerSquelchFeed = () => {
    setIsReceiving(true);
    cyberAudio.playStaticBurst();
    setInterceptionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] AUDIO_MANUAL: Walkie-Talkie Radio Squelch Intercept.`,
      ...prev.slice(0, 3)
    ]);
    setTimeout(() => setIsReceiving(false), 220);
  };

  const triggerIntercomChatter = () => {
    setIsReceiving(true);
    cyberAudio.playHumanTalk();
    setInterceptionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] VOICE_MANUAL: Walkie-Talkie Voice Intercom Check.`,
      ...prev.slice(0, 3)
    ]);
    setTimeout(() => setIsReceiving(false), 1200);
  };

  const triggerSatellitePing = () => {
    setIsReceiving(true);
    cyberAudio.playCosmicBeep();
    setInterceptionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SatComm Beacon: Deep Space Chirp Transmitted.`,
      ...prev.slice(0, 3)
    ]);
    setTimeout(() => setIsReceiving(false), 220);
  };

  const triggerSpaceSweep = () => {
    setIsReceiving(true);
    cyberAudio.playWarning();
    setInterceptionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] HARMONICS: Anomalous Sweep Resonance Inject.`,
      ...prev.slice(0, 3)
    ]);
    setTimeout(() => setIsReceiving(false), 400);
  };

  const handleFrequencyScroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFrequency(val);
    // Play microscopic tic click on change
    cyberAudio.playClick();
  };

  const channels = ['HYDROGEN_1420', 'PULSAR_VBR', 'SOLAR_WIND_X', 'MILKY_WAY_G'];

  return (
    <div id="deep-space-receiver-root" className={`relative border p-5 backdrop-blur-md transition-all cyber-hud-card corner-ticks corner-ticks-inner ${isDark ? 'bg-[#040609]/95 border-cyan-500/15 text-slate-100 shadow-[0_0_20px_rgba(226,88,62,0.03)]' : 'bg-white/85 border-slate-200 shadow-md'}`}>
      
      {/* Header with Radio icon */}
      <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-dashed border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-pink-500 text-glow-magenta animate-pulse" />
          <h3 className={`font-display text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-100 text-glow-cyan' : 'text-slate-700'}`}>
            Multispectral Astronomy Tuner
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${isReceiving ? 'bg-pink-500 animate-ping' : 'bg-cyan-500'}`} />
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
            {isReceiving ? 'INTERCEPTS ON' : 'TUNING'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Tuning Selector & Sliders - 7 cols */}
        <div className="md:col-span-7 flex flex-col gap-3">
          
          <div className="flex justify-between items-center bg-slate-950/20 p-2.5 rounded-lg border border-slate-850/40">
            <span className="font-mono text-[9px] text-slate-500 uppercase">Target Orbit frequency</span>
            <span className="font-mono text-[14px] font-bold text-cyan-400 text-glow-cyan tabular-nums">
              {frequency.toFixed(1)} <span className="text-[10px] text-pink-500 text-glow-magenta">MHz</span>
            </span>
          </div>

          {/* Slider input */}
          <div className="flex flex-col gap-1">
            <input 
              id="radio-frequency-slider"
              type="range" 
              min="1400" 
              max="1440" 
              step="0.2" 
              value={frequency} 
              onChange={handleFrequencyScroll}
              className="w-full h-1 bg-slate-800/80 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[7px] font-mono text-slate-500 px-1">
              <span>1400.0 MHz (LOCAL)</span>
              <span className="text-pink-500">1420.4 MHz (H-LINE SETI)</span>
              <span>1440.0 MHz (GALAXY)</span>
            </div>
          </div>

          {/* Channel selectors */}
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {channels.map((chan) => (
              <button
                id={`receiver-chan-${chan}`}
                key={chan}
                onClick={() => {
                  setSelectedChannel(chan);
                  cyberAudio.playSuccess();
                  setFrequency(
                    chan === 'HYDROGEN_1420' ? 1420.4 :
                    chan === 'PULSAR_VBR' ? 1412.8 :
                    chan === 'SOLAR_WIND_X' ? 1435.1 : 1404.2
                  );
                }}
                className={`py-1 rounded text-[8px] font-semibold border font-mono tracking-tighter uppercase transition-all cursor-pointer ${
                  selectedChannel === chan
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 text-glow-cyan font-bold'
                    : 'border-slate-800/10 hover:border-slate-800/30 text-slate-400'
                }`}
              >
                {chan.split('_')[0]}
              </button>
            ))}
          </div>

          {/* Signal Indicator & Radar graphic */}
          <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-4 font-mono text-[9px] ${
            isDark ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-150'
          }`}>
            <div className="flex-1">
              <div className="flex justify-between items-center text-[8px] text-slate-500 mb-1">
                <span>SIGNAL FEED AMPLITUDE</span>
                <span className={signalStrength > 70 ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>{signalStrength}%</span>
              </div>
              <div className="h-1 bg-slate-800/40 rounded-full overflow-hidden flex gap-0.5">
                <div 
                  className={`h-full rounded transition-all duration-300 ${
                    signalStrength > 70 ? 'bg-pink-500 text-glow-magenta' : 'bg-cyan-500 text-glow-cyan'
                  }`} 
                  style={{ width: `${signalStrength}%` }}
                />
              </div>
            </div>
            
            <div className="flex flex-col items-end shrink-0">
              <span className="text-slate-500 text-[8px]">REC_DECIBELS</span>
              <span className="font-bold text-[10px] text-pink-500 tabular-nums">-{110 - signalStrength} dB</span>
            </div>
          </div>

        </div>

        {/* Live Device Acoustics Controls Deck - 5 cols */}
        <div className="md:col-span-5 flex flex-col justify-between border-l border-dashed border-cyan-500/10 pl-0 md:pl-4">
          
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest block mb-0.5">
              TEST INTERRUPT ACOUSTICS
            </span>

            {/* Squelch button */}
            <button
              id="trigger-squelch-feed"
              onClick={triggerSquelchFeed}
              title="Manual walkie-talkie squelch signal"
              className={`p-2 rounded-lg border text-left flex items-center justify-between group cursor-pointer transition-all ${
                isDark ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Signal className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span className="font-mono text-[9px] uppercase font-bold text-slate-350">Walkie Squelch</span>
              </div>
              <span className="font-mono text-[7px] text-cyan-500 opacity-60 group-hover:opacity-100">BURST SHHH</span>
            </button>

            {/* Voice Walkie Chatter button */}
            <button
              id="trigger-voice-chatter"
              onClick={triggerIntercomChatter}
              title="Manual space-helmet walkie-talkie voice communications chatter"
              className={`p-2 rounded-lg border text-left flex items-center justify-between group cursor-pointer transition-all ${
                isDark ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Mic className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span className="font-mono text-[9px] uppercase font-bold text-slate-350">Walkie Chatter</span>
              </div>
              <span className="font-mono text-[7px] text-cyan-500 opacity-60 group-hover:opacity-100">LOG TALK</span>
            </button>

            {/* Satellite Beacon sweeping */}
            <button
              id="trigger-satellite-ping"
              onClick={triggerSatellitePing}
              title="Continuous Cosmic beacon beep"
              className={`p-2 rounded-lg border text-left flex items-center justify-between group cursor-pointer transition-all ${
                isDark ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Compass className="h-3 w-3 text-pink-500 animate-spin-slow" />
                <span className="font-mono text-[9px] uppercase font-bold text-slate-350">Planetary Ping</span>
              </div>
              <span className="font-mono text-[7px] text-pink-500 opacity-60 group-hover:opacity-100">2.4GHz CHIRP</span>
            </button>

            {/* Space resonance sweep */}
            <button
              id="trigger-space-sweep"
              onClick={triggerSpaceSweep}
              title="Warning sweep signal sound"
              className={`p-2 rounded-lg border text-left flex items-center justify-between group cursor-pointer transition-all ${
                isDark ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-amber-500" />
                <span className="font-mono text-[9px] uppercase font-bold text-slate-350">Resonance Sweep</span>
              </div>
              <span className="font-mono text-[7px] text-amber-500 opacity-60 group-hover:opacity-100">WARNING HW</span>
            </button>

          </div>

          <div className="flex items-center gap-1 bg-slate-950/10 p-1.5 rounded border border-slate-850/10 mt-2 font-mono text-[7.5px] text-slate-500">
            <Shield className="h-2.5 w-2.5 text-cyan-400 flex-shrink-0" />
            <span className="truncate">SENSORS ALIGNED TO HYDROGEN SPECTRAL AXIS</span>
          </div>

        </div>

      </div>

      {/* Mini Scrolling Reception Log */}
      {interceptionLogs.length > 0 && (
        <div className="mt-3 bg-slate-950/40 border border-slate-900/60 p-2 rounded-lg font-mono text-[8px] text-slate-400 space-y-1">
          <div className="text-slate-500 text-[7.5px] uppercase border-b border-slate-900/40 pb-0.5 tracking-wider">
            Astronology receiver activity stack
          </div>
          {interceptionLogs.map((log, index) => (
            <div key={index} className="truncate select-none text-cyan-400/80">
              {log}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
