export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private biomeGain: GainNode | null = null;
  private biomeOscillators: OscillatorNode[] = [];
  private biomeNoiseSource: AudioBufferSourceNode | null = null;
  private currentBiome = -1;
  private glopScheduled = false;
  private nextGallopTime = 0;
  private gallopInterval = 0.28;
  private gallopBeat = 0;
  private isGalloping = false;
  private isSprinting = false;
  private sprintNoise: AudioBufferSourceNode | null = null;
  private sprintFilter: BiquadFilterNode | null = null;
  private sprintGain: GainNode | null = null;
  private muted = false;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
  }

  private resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx!.currentTime, 0.1);
    }
    return this.muted;
  }

  // ── Biome ambient ──────────────────────────────────────────────────────────

  private makeNoise(duration = 3): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  setBiome(biomeIndex: number) {
    if (biomeIndex === this.currentBiome) return;
    this.currentBiome = biomeIndex;
    this.resume();

    // Fade out old
    if (this.biomeGain) {
      this.biomeGain.gain.setTargetAtTime(0, this.ctx!.currentTime, 1.5);
      const old = this.biomeGain;
      setTimeout(() => {
        this.biomeOscillators.forEach(o => { try { o.stop(); } catch {} });
        this.biomeOscillators = [];
        if (this.biomeNoiseSource) { try { this.biomeNoiseSource.stop(); } catch {} this.biomeNoiseSource = null; }
        old.disconnect();
      }, 4000);
    }

    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain!);
    this.biomeGain = gain;

    const configs: { freqs: number[]; detune: number; noiseFreq?: number; noiseGain?: number; type: OscillatorType }[] = [
      // Verdant Plains — warm C major drone: C2, E2, G2, C3
      { freqs: [65.41, 82.41, 98.0, 130.81], detune: 3, type: "sine", noiseFreq: 200, noiseGain: 0.02 },
      // Crystal Void — eerie Bb minor: Bb1, Db2, F2, Bb2 (high, thin)
      { freqs: [58.27, 69.3, 87.31, 116.54, 220, 349.23], detune: 8, type: "triangle", noiseFreq: 2000, noiseGain: 0.03 },
      // Ember Wastes — dark low rumble: E1, B1, E2 with distortion
      { freqs: [41.2, 61.74, 82.41, 164.81], detune: 12, type: "sawtooth", noiseFreq: 80, noiseGain: 0.06 },
    ];

    const cfg = configs[biomeIndex] ?? configs[0];

    cfg.freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = cfg.type;
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * cfg.detune * 2;

      const oscGain = ctx.createGain();
      const vol = biomeIndex === 2 ? 0.07 : biomeIndex === 1 ? 0.04 : 0.05;
      oscGain.gain.value = vol / (i + 1);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + Math.random() * 0.08;
      lfo.type = "sine";
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.004;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start();
      this.biomeOscillators.push(osc, lfo);
    });

    // Noise layer
    if (cfg.noiseGain && cfg.noiseGain > 0) {
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.makeNoise(4);
      noiseSrc.loop = true;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = cfg.noiseFreq ?? 400;
      noiseFilter.Q.value = 0.5;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = cfg.noiseGain;
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gain);
      noiseSrc.start();
      this.biomeNoiseSource = noiseSrc;
    }

    gain.gain.setTargetAtTime(1, ctx.currentTime, 2.5);
  }

  // ── Gallop hoofbeats ───────────────────────────────────────────────────────

  private scheduleHoofbeat(time: number, isSprint: boolean) {
    const ctx = this.ctx!;

    // Pattern: FL, BR, FR, BL — alternating pairs
    const patterns = [
      [0, 0.01],
      [0.14, 0.145],
      [0.28, 0.29],
      [0.42, 0.425],
    ];
    const pair = patterns[this.gallopBeat % 4];
    this.gallopBeat++;

    pair.forEach((offset, idx) => {
      const t = time + offset;

      // Thud — low burst
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(isSprint ? 90 : 70, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      // Click — sharp transient
      const click = ctx.createOscillator();
      click.type = "square";
      click.frequency.setValueAtTime(800, t);
      click.frequency.exponentialRampToValueAtTime(100, t + 0.015);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.25, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

      const thudGain = ctx.createGain();
      const vol = isSprint ? 0.6 : 0.45;
      thudGain.gain.setValueAtTime(vol, t);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      // Slight stereo pan alternation
      const panner = ctx.createStereoPanner();
      panner.pan.value = idx === 0 ? -0.3 : 0.3;

      osc.connect(thudGain);
      click.connect(clickGain);
      thudGain.connect(panner);
      clickGain.connect(panner);
      panner.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.15);
      click.start(t);
      click.stop(t + 0.03);
    });
  }

  updateGallop(isMoving: boolean, isSprinting: boolean) {
    if (!this.ctx) return;
    this.resume();

    if (!isMoving) {
      this.isGalloping = false;
      this.glopScheduled = false;
      this.stopSprint();
      return;
    }

    this.isGalloping = true;
    this.isSprinting = isSprinting;

    const now = this.ctx.currentTime;
    const interval = isSprinting ? 0.18 : 0.28;

    if (!this.glopScheduled || now + 0.05 >= this.nextGallopTime) {
      this.scheduleHoofbeat(Math.max(now, this.nextGallopTime), isSprinting);
      this.nextGallopTime = Math.max(now, this.nextGallopTime) + interval;
      this.glopScheduled = true;
    }

    // Sprint wind noise
    if (isSprinting && !this.sprintNoise) {
      this.startSprintWind();
    } else if (!isSprinting) {
      this.stopSprint();
    }
  }

  private startSprintWind() {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoise(4);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.4;

    const sprintGain = ctx.createGain();
    sprintGain.gain.value = 0;

    src.connect(filter);
    filter.connect(sprintGain);
    sprintGain.connect(this.masterGain!);
    src.start();

    sprintGain.gain.setTargetAtTime(0.12, ctx.currentTime, 0.3);
    filter.frequency.setTargetAtTime(1400, ctx.currentTime, 0.5);

    this.sprintNoise = src;
    this.sprintFilter = filter;
    this.sprintGain = sprintGain;
  }

  private stopSprint() {
    if (!this.sprintGain || !this.ctx) return;
    this.sprintGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    const src = this.sprintNoise;
    const g = this.sprintGain;
    setTimeout(() => {
      try { src?.stop(); } catch {}
      try { g.disconnect(); } catch {}
    }, 800);
    this.sprintNoise = null;
    this.sprintFilter = null;
    this.sprintGain = null;
  }

  // ── Jump ───────────────────────────────────────────────────────────────────

  playJump() {
    if (!this.ctx) return;
    this.resume();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.06);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(240, t);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.3);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc.connect(g); osc2.connect(g);
    g.connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.35);
    osc2.start(t); osc2.stop(t + 0.35);
  }

  // ── Drift Shard chime ──────────────────────────────────────────────────────

  playShardCollect(shardIndex: number) {
    if (!this.ctx) return;
    this.resume();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Rising arpeggio chord  C5, E5, G5, B5
    const notes = [523.25, 659.25, 783.99, 987.77];
    const baseNote = notes[shardIndex % notes.length];

    [0, 0.06, 0.12].forEach((delay, i) => {
      const freq = baseNote * (i === 0 ? 1 : i === 1 ? 1.25 : 1.5);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + delay + 0.4);

      // Shimmer overtone
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 2.01;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t + delay);
      env.gain.linearRampToValueAtTime(0.3, t + delay + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.7);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.value = 0.08;

      const reverb = ctx.createDelay(0.5);
      reverb.delayTime.value = 0.22;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.25;

      osc.connect(env);
      osc2.connect(shimmerGain);
      shimmerGain.connect(env);
      env.connect(this.masterGain!);
      env.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(this.masterGain!);

      osc.start(t + delay); osc.stop(t + delay + 0.8);
      osc2.start(t + delay); osc2.stop(t + delay + 0.8);
    });

    // Sparkle burst — fast rising noise
    const nBuf = this.makeNoise(0.1);
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = nBuf;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = "highpass";
    nFilter.frequency.value = 4000;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.15, t);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    nSrc.connect(nFilter); nFilter.connect(nGain); nGain.connect(this.masterGain!);
    nSrc.start(t); nSrc.stop(t + 0.1);
  }

  // ── Rear whoosh ────────────────────────────────────────────────────────────

  playRear() {
    if (!this.ctx) return;
    this.resume();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const nSrc = ctx.createBufferSource();
    nSrc.buffer = this.makeNoise(0.8);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 0.4);
    filter.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.05);
    g.gain.setTargetAtTime(0, t + 0.4, 0.15);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.4, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    nSrc.connect(filter); filter.connect(g); g.connect(this.masterGain!);
    osc.connect(og); og.connect(this.masterGain!);
    nSrc.start(t); nSrc.stop(t + 0.8);
    osc.start(t); osc.stop(t + 0.6);
  }

  // ── Land thud ─────────────────────────────────────────────────────────────

  playLand(velocity: number) {
    if (!this.ctx || velocity < 3) return;
    this.resume();
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const vol = Math.min(velocity / 20, 1) * 0.7;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.18);

    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(g); g.connect(this.masterGain!);
    osc.start(t); osc.stop(t + 0.3);
  }

  destroy() {
    try {
      this.biomeOscillators.forEach(o => o.stop());
      this.biomeNoiseSource?.stop();
      this.sprintNoise?.stop();
      this.ctx?.close();
    } catch {}
    this.ctx = null;
  }
}

export const audioEngine = new AudioEngine();
