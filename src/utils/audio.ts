/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A native client-side Web Audio synthesizer for sci-fi telemetry sound effects
class CyberAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Background hum nodes
  private bgGainNode: GainNode | null = null;
  private bgOsc1: OscillatorNode | null = null;
  private bgOsc2: OscillatorNode | null = null;
  private bgLfo: OscillatorNode | null = null;
  private bgNoise: AudioBufferSourceNode | null = null;
  private isBgHumActive: boolean = false;

  // Background voice loop properties
  private isVoiceLoopActive: boolean = false;
  private voiceTimeoutId: any = null;

  // Microphone carrier hiss nodes
  private activeHissNode: AudioBufferSourceNode | null = null;
  private activeHissGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      // Lazy initialize on first user interaction to bypass browser autoplay policies
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      try {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    }
    // If we have background hum nodes, update their master volume
    if (this.bgGainNode) {
      const targetVolume = (this.isMuted || !this.isBgHumActive) ? 0.0 : 1.0;
      try {
        this.bgGainNode.gain.linearRampToValueAtTime(targetVolume, this.ctx ? this.ctx.currentTime + 0.3 : 0);
      } catch (e) {}
    }
    return this.isMuted;
  }

  public getMuteStatus() {
    return this.isMuted;
  }

  // Starts a continuous deep sci-fi spaceship background hum and quiet telescope static hiss
  public startBgHum() {
    if (this.isBgHumActive) return;
    this.isBgHumActive = true;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Master background gain
      this.bgGainNode = this.ctx.createGain();
      // Set volume very low (ambient, subtle, atmospheric!)
      const targetVolume = this.isMuted ? 0.0 : 1.0;
      this.bgGainNode.gain.setValueAtTime(0, now);
      this.bgGainNode.gain.linearRampToValueAtTime(targetVolume, now + 0.8);

      // 1. Core reactor sub-drone (60Hz)
      this.bgOsc1 = this.ctx.createOscillator();
      this.bgOsc1.type = 'sine';
      this.bgOsc1.frequency.setValueAtTime(60, now); // Line frequency hum

      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.setValueAtTime(0.045, now); // Very low sub

      // 2. Harmonic secondary hum (110Hz)
      this.bgOsc2 = this.ctx.createOscillator();
      this.bgOsc2.type = 'triangle';
      this.bgOsc2.frequency.setValueAtTime(110, now);

      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.setValueAtTime(0.012, now); // Quiet harmony hum

      // Lowpass filter to ensure the triangles and square-like signals stay warm and analog
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(120, now);

      // Low frequency modulator LFO to create spinning fans/reactor pulsation feeling (amplitude modulation)
      this.bgLfo = this.ctx.createOscillator();
      this.bgLfo.type = 'sine';
      this.bgLfo.frequency.setValueAtTime(0.35, now); // Pulsates every ~3 seconds

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.015, now);

      // 3. High-altitude cosmic telescope background static/hiss
      // Loop a buffer of very faint pink-ish noise filtered through bandpass
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink-like filter estimation for warmer cozy static sound
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // low gain limit
        b6 = white * 0.115926;
      }

      this.bgNoise = this.ctx.createBufferSource();
      this.bgNoise.buffer = buffer;
      this.bgNoise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(900, now); // Centered around mid radio frequencies
      noiseFilter.Q.setValueAtTime(0.6, now); // Wide filter for a warm breeze hiss

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.009, now); // Faint background wind

      // Connections setup
      // Oscillators to lowpass
      this.bgOsc1.connect(oscGain1);
      this.bgOsc2.connect(oscGain2);
      
      oscGain1.connect(engineFilter);
      oscGain2.connect(engineFilter);

      // Connect LFO modulator to first oscillator volume gain to pulsate core
      this.bgLfo.connect(lfoGain);
      lfoGain.connect(oscGain1.gain);

      // Connect noise
      this.bgNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);

      // Send both to main background gain
      engineFilter.connect(this.bgGainNode);
      noiseGain.connect(this.bgGainNode);

      // Route main background gain to master speaker outlet
      this.bgGainNode.connect(this.ctx.destination);

      // Start looping
      this.bgOsc1.start(now);
      this.bgOsc2.start(now);
      this.bgLfo.start(now);
      this.bgNoise.start(now);

      // Start continuous walkie-talkie astronaut chatter loop
      this.startVoiceLoop();
    } catch (e) {
      console.error("Flipped background audio initialization:", e);
    }
  }

  // Stop background generators cleanly with fade out
  public stopBgHum() {
    if (!this.isBgHumActive) return;
    this.isBgHumActive = false;

    // Shut down continuous walkie-talkie astronaut chatter loop cleanly
    this.stopVoiceLoop();

    try {
      if (this.bgGainNode && this.ctx) {
        const now = this.ctx.currentTime;
        this.bgGainNode.gain.cancelScheduledValues(now);
        this.bgGainNode.gain.setValueAtTime(this.bgGainNode.gain.value, now);
        this.bgGainNode.gain.linearRampToValueAtTime(0.0, now + 0.4);

        // Decommission nodes after fadeout
        const osc1 = this.bgOsc1;
        const osc2 = this.bgOsc2;
        const lfo = this.bgLfo;
        const noise = this.bgNoise;

        setTimeout(() => {
          try {
            osc1?.stop();
            osc2?.stop();
            lfo?.stop();
            noise?.stop();
          } catch(err){}
        }, 500);
      }
    } catch (e) {}

    this.bgOsc1 = null;
    this.bgOsc2 = null;
    this.bgLfo = null;
    this.bgNoise = null;
  }

  public getBgHumActive() {
    return this.isBgHumActive;
  }

  // A crisp micro-mechanical tact click for tab switches or standard buttons
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Click transient sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // Fail silently if audio context is blocked
    }
  }

  // A delightful melodic double-beep for telemetry updates and successful boots
  public playSuccess() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5 note
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08); // E6 fifth note

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.setValueAtTime(0.05, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.08);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.25);
    } catch (e) {}
  }

  // A dramatic pitch warning sweep for anomalies and overloads
  public playWarning() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Low pass filter to keep it warm and crunchy rather than piercing
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.18);
      osc.frequency.linearRampToValueAtTime(120, now + 0.35);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  // A highly realistic walkie-talkie / satellite radio static receiver squelch effect
  public playStaticBurst() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Create white noise buffer
      const bufferSize = this.ctx.sampleRate * 0.22; // 0.22 seconds of static
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // High frequency dense white noise calculation
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      // Bandpass radio filter to simulate low-bandwidth space helmet / walkie-talkie speaker resonance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(2.8, now); // Narrower Q, very retro intercom filter!

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.015); // Quick attack squelch
      gain.gain.setValueAtTime(0.035, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.22);

      // Micro satellite beep at the end offset of communication stream
      const endTone = this.ctx.createOscillator();
      const endGain = this.ctx.createGain();
      
      endTone.type = 'sine';
      endTone.frequency.setValueAtTime(950, now + 0.14);
      endTone.frequency.linearRampToValueAtTime(1200, now + 0.2);

      endGain.gain.setValueAtTime(0, now);
      endGain.gain.setValueAtTime(0.02, now + 0.14);
      endGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      endTone.connect(endGain);
      endGain.connect(this.ctx.destination);

      endTone.start(now + 0.14);
      endTone.stop(now + 0.22);
    } catch (e) {}
  }

  // Authentic retro walkie-talkie tactile mic "climcp" click switch & mechanical press pop
  public playMicClick(isDown: boolean) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (isDown) {
        // High-pitched tactile mechanical metal click + low diaphragm thump pop
        const osc = this.ctx.createOscillator();
        const thump = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const thumpGain = this.ctx.createGain();

        // Mechanical switch click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        // Diaphragm key down thump pop (very authentic)
        thump.type = 'sine';
        thump.frequency.setValueAtTime(80, now);
        thump.frequency.exponentialRampToValueAtTime(25, now + 0.065);

        thumpGain.gain.setValueAtTime(0.09, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

        osc.connect(gain);
        thump.connect(thumpGain);

        gain.connect(this.ctx.destination);
        thumpGain.connect(this.ctx.destination);

        osc.start(now);
        thump.start(now);

        osc.stop(now + 0.05);
        thump.stop(now + 0.08);
      } else {
        // Voice stream release: Squelch air blast + mechanical switch click release
        // 1. High frequency white static release discharge
        const bufferSize = this.ctx.sampleRate * 0.13;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(820, now);
        filter.Q.setValueAtTime(3.4, now); // retro walkie band filter

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.125);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noiseNode.start(now);
        noiseNode.stop(now + 0.13);

        // 2. Switch key release click
        const osc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now + 0.10);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.13);

        clickGain.gain.setValueAtTime(0, now);
        clickGain.gain.setValueAtTime(0.022, now + 0.10);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(clickGain);
        clickGain.connect(this.ctx.destination);

        osc.start(now + 0.10);
        osc.stop(now + 0.14);
      }
    } catch (e) {}
  }

  // Active RF static white/pink carrier noise that runs while speech synthesis is outputting
  public startMicHiss() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 2.5; // Loop duration
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.07; // scale down
        b6 = white * 0.115926;
      }

      this.activeHissNode = this.ctx.createBufferSource();
      this.activeHissNode.buffer = buffer;
      this.activeHissNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now); // Narrow telephone voice band speaker
      filter.Q.setValueAtTime(2.2, now);

      this.activeHissGain = this.ctx.createGain();
      this.activeHissGain.gain.setValueAtTime(0, now);
      this.activeHissGain.gain.linearRampToValueAtTime(0.045, now + 0.04); // Smooth switch hiss ramp

      this.activeHissNode.connect(filter);
      filter.connect(this.activeHissGain);
      this.activeHissGain.connect(this.ctx.destination);

      this.activeHissNode.start(now);
    } catch (e) {}
  }

  // Stops the active RF carrier hiss cleanly
  public stopMicHiss() {
    try {
      if (this.activeHissGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.activeHissGain.gain.cancelScheduledValues(now);
        this.activeHissGain.gain.setValueAtTime(this.activeHissGain.gain.value, now);
        this.activeHissGain.gain.linearRampToValueAtTime(0, now + 0.08);
        
        const node = this.activeHissNode;
        setTimeout(() => {
          try {
            node?.stop();
          } catch (err){}
        }, 120);
      }
    } catch (e) {}
    this.activeHissNode = null;
    this.activeHissGain = null;
  }

  // Intelligently queries operating system to select the most lifelike English speech voice
  private getPremiumHumanVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    if (enVoices.length === 0) return null;

    // Priority 1: High Fidelity Cloud Natural Voices
    let selected = enVoices.find(v => v.name.toLowerCase().includes('natural'));
    if (selected) return selected;

    // Priority 2: Google Recorded Voices
    selected = enVoices.find(v => v.name.toLowerCase().includes('google'));
    if (selected) return selected;

    // Priority 3: Premium named operating system humanized voices
    const premiumNames = ['siri', 'samantha', 'daniel', 'karen', 'moira', 'david', 'zira', 'mark', 'hazel'];
    for (const name of premiumNames) {
      const match = enVoices.find(v => v.name.toLowerCase().includes(name));
      if (match) return match;
    }

    // Default to first english match
    return enVoices[0];
  }

  // Starts the continuous background vocal mumble loop
  public startVoiceLoop() {
    if (this.isVoiceLoopActive) return;
    this.isVoiceLoopActive = true;
    
    // Warm startup delay, then play first transmission
    this.voiceTimeoutId = setTimeout(() => this.playBackgroundVoiceIteration(), 3000);
  }

  // Shuts down the background vocal mumble loop cleanly
  public stopVoiceLoop() {
    this.isVoiceLoopActive = false;
    if (this.voiceTimeoutId) {
      clearTimeout(this.voiceTimeoutId);
      this.voiceTimeoutId = null;
    }
    this.stopMicHiss();
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  }

  // Performs a single iteration of background walkie talkie intercom dialogue
  public playBackgroundVoiceIteration() {
    if (!this.isVoiceLoopActive || this.isMuted) {
      if (this.isVoiceLoopActive) {
        this.scheduleNextVoiceIteration(5000);
      }
      return;
    }

    try {
      this.initCtx();
      if (!this.ctx) return;

      const astronautPhrases = [
        "Hyperion tracker checking solar wind speeds, sector six-b, over.",
        "Spectroscopy readings confirm heavy hydrogen concentrations here, proceed, over.",
        "Radio antenna locked on deep signal. Initiating wide field scan. Standby, over.",
        "The pulsar beacon sequence 4-A is flashing erratic. Do you copy? Over.",
        "Copy that control. Orbital stabilizer thrusters successfully calibrated. Over.",
        "We have received a weak cosmic acoustic anomaly on grid corridor eight. Over.",
        "Spectra analysis reports hydrogen telemetry is fully nominal now, out.",
        "Deep exploration shuttle Alpha, status is green. All sensors clear, over."
      ];

      const text = astronautPhrases[Math.floor(Math.random() * astronautPhrases.length)];

      // 1. Play active mechanical Push-To-Talk climcp click & low vocal popup thump
      this.playMicClick(true);
      
      // 2. Start continuous walkie speaker air static hiss accompaniment
      this.startMicHiss();

      // Speak with a short mechanical delay to emulate mic transmission compression
      this.voiceTimeoutId = setTimeout(() => {
        if (!this.isVoiceLoopActive || this.isMuted) {
          this.stopMicHiss();
          this.playMicClick(false);
          return;
        }

        if (typeof window === 'undefined' || !window.speechSynthesis) {
          this.stopMicHiss();
          this.playMicClick(false);
          this.scheduleNextVoiceIteration(4000);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Grab the absolute best available human voice to avoid robotic flat tones
        const premiumVoice = this.getPremiumHumanVoice();
        if (premiumVoice) {
          utterance.voice = premiumVoice;
        }

        // Apply realistic deliberate human speech properties
        utterance.pitch = 0.96; // Normal natural human baseline voice pitch
        utterance.rate = 0.94;  // Normal deliberate pilot voice speed (not rushed)
        utterance.volume = 0.44; // Comfortable clear background level

        utterance.onend = () => {
          // Play Release microphone click tactile pop and stop the background hiss!
          this.stopMicHiss();
          this.playMicClick(false);
          
          // Continuous loop: Small, extremely natural pause of 1-3 seconds as requested, then repeat!
          const nextInterval = 1200 + Math.random() * 1800;
          this.scheduleNextVoiceIteration(nextInterval);
        };

        utterance.onerror = () => {
          this.stopMicHiss();
          this.playMicClick(false);
          this.scheduleNextVoiceIteration(3000);
        };

        // Command the engine
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }, 180);

    } catch (e) {
      this.scheduleNextVoiceIteration(5000);
    }
  }

  private scheduleNextVoiceIteration(delayMs: number) {
    if (this.voiceTimeoutId) {
      clearTimeout(this.voiceTimeoutId);
    }
    if (this.isVoiceLoopActive) {
      this.voiceTimeoutId = setTimeout(() => this.playBackgroundVoiceIteration(), delayMs);
    }
  }

  // Plays a highly futuristic intercom voice synthesized walkie-talkie radio log (manual triggers)
  public playHumanTalk(customText?: string) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      this.initCtx();

      // Play mic down key pop sound
      this.playMicClick(true);
      // Start radio static carrier air background
      this.startMicHiss();

      const intercomPhrases = [
        "Hyperion core, telemetry stream received, standing by, over.",
        "Deep Space Relay, orbital phase sweep aligned on Hydrogen line. Over.",
        "Control, we are seeing minor radio frequency interference. Check channel twelve.",
        "All reactor systems nominal. Ambient acoustic drone synced.",
        "Warning. Faint radio anomaly detected over quadrant solar sector gate.",
        "Satellite beacon synchronized. Out."
      ];

      const text = customText || intercomPhrases[Math.floor(Math.random() * intercomPhrases.length)];

      const utterance = new SpeechSynthesisUtterance(text);
      const premiumVoice = this.getPremiumHumanVoice();
      if (premiumVoice) {
        utterance.voice = premiumVoice;
      }

      utterance.pitch = 0.96;
      utterance.rate = 0.94;
      utterance.volume = 0.46;

      utterance.onend = () => {
        try {
          this.stopMicHiss();
          this.playMicClick(false);
        } catch (e) {}
      };

      utterance.onerror = () => {
        this.stopMicHiss();
        this.playMicClick(false);
      };

      // Stop any pending speech
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.stopMicHiss();
      this.playMicClick(false);
    }
  }

  // A resonating deep space pulsar chirp (satellite transmit signal)
  public playCosmicBeep() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const oscMod = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const modGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Main chirp sine wave
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now); // high A6 frequency
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.15); // drop down frequency sweep

      // Modulator for walkie talkie "chatter/ring" frequency
      oscMod.type = 'triangle';
      oscMod.frequency.setValueAtTime(45, now);
      modGain.gain.setValueAtTime(150, now); // Vibrato/Frequency modulation width

      // Bandpass acoustic filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, now);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      // Connect FM modulator
      oscMod.connect(modGain);
      modGain.connect(osc.frequency);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      // Start frequencies
      oscMod.start(now);
      osc.start(now);
      
      oscMod.stop(now + 0.28);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  // A sci-fi low digital hum for server reboots
  public playReboot() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(65, now); // Super low C hum
      osc.frequency.linearRampToValueAtTime(220, now + 0.6);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {}
  }
}

export const cyberAudio = new CyberAudio();
