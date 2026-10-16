/**
 * Super Pixel World - Procedural Web Audio Sound Engine
 * Synthesizes 100% offline, zero-network arcade sound effects and chiptune melodies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;
  private currentMusicTheme: string | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterVolume: number = 0.8;

  public applySettings(settings: { sound: boolean; music: boolean; volume: number }) {
    this.soundEnabled = settings.sound;
    this.musicEnabled = settings.music;
    this.masterVolume = Math.max(0, Math.min(1, settings.volume));
    if (!this.musicEnabled || this.isMuted) {
      this.stopBgm();
    }
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled && !this.isMuted;
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled && !this.isMuted;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public getMuted(): boolean {
    return this.isMuted || (!this.soundEnabled && !this.musicEnabled);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    }
    return this.isMuted;
  }

  // --- Cartoon Menu UI Click Sound ---
  public playClick() {
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Cheerful cartoon pop sound
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);

    const vol = 0.18 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // --- Sound Effects ---

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.14);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    osc2.frequency.setValueAtTime(987.77 * 2, t);
    osc2.frequency.setValueAtTime(1318.51 * 2, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  public playGem() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const delay = t + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, delay);

      gain.gain.setValueAtTime(0.15, delay);
      gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(delay);
      osc.stop(delay + 0.23);
    });
  }

  public playBump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playBreak() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // White noise burst for shattering brick
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  public playSpring() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.28);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.31);
  }

  public playStomp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playHurt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.25);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [220, 207.65, 196, 185]; // Sad descending minor chords
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const delay = t + idx * 0.14;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, delay);

      gain.gain.setValueAtTime(0.18, delay);
      gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(delay);
      osc.stop(delay + 0.35);
    });
  }

  public playCheckpoint() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chord = [440, 554.37, 659.25, 880]; // A major
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const delay = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, delay);

      gain.gain.setValueAtTime(0.18, delay);
      gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(delay);
      osc.stop(delay + 0.45);
    });
  }

  // Joyful ringing "Дзынь! Успех!" chime for educational mission completion
  public playMissionComplete() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 783.99, delay: 0.0 },   // G5
      { f: 1046.50, delay: 0.08 }, // C6
      { f: 1318.51, delay: 0.16 }, // E6
      { f: 1567.98, delay: 0.24 }, // G6
    ];

    notes.forEach(({ f, delay }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + delay;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startT);

      const vol = 0.22 * this.masterVolume;
      gain.gain.setValueAtTime(vol, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startT);
      osc.stop(startT + 0.48);
    });
  }

  // Healing heart chime: "Целебный дзынь" (+1 жизнь)
  public playHeal() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.0 },   // C5
      { f: 659.25, d: 0.07 },  // E5
      { f: 783.99, d: 0.14 },  // G5
      { f: 1046.50, d: 0.21 }, // C6
      { f: 1318.51, d: 0.28 }, // E6
    ];

    notes.forEach(({ f, d }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + d;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, startT);

      const vol = 0.22 * this.masterVolume;
      gain.gain.setValueAtTime(vol, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startT);
      osc.stop(startT + 0.38);
    });
  }

  // Pipe warp sound: classic whoosh / teleportation suction
  public playPipe() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.32);

    const vol = 0.2 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.linearRampToValueAtTime(vol * 0.8, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Ice slide swish sound
  public playIceSlide() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.18);

    const vol = 0.08 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Classic celebratory fanfare
    const notes = [
      { f: 523.25, d: 0.12, w: 0.0 }, // C5
      { f: 659.25, d: 0.12, w: 0.14 }, // E5
      { f: 783.99, d: 0.12, w: 0.28 }, // G5
      { f: 1046.5, d: 0.35, w: 0.42 }, // C6
      { f: 880.0, d: 0.15, w: 0.8 }, // A5
      { f: 1046.5, d: 0.6, w: 1.0 }, // C6
    ];

    notes.forEach(({ f, d, w }) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + w;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, startT);

      gain.gain.setValueAtTime(0.24, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + d);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startT);
      osc.stop(startT + d + 0.05);
    });
  }

  public playPlaceTile() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playErase() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playSelect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // --- Background Melody Loop ---

  public startBgm(theme: string = 'green_islands') {
    if (this.isMuted || !this.musicEnabled || this.masterVolume <= 0) return;
    if (this.musicInterval && this.currentMusicTheme === theme) return;
    this.stopBgm();
    this.initContext();
    if (!this.ctx) return;

    this.currentMusicTheme = theme;

    // Theme scales and melody sequences
    const greenMelody = [
      261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 392.0, 440.0,
      349.23, 440.0, 523.25, 440.0, 392.0, 329.63, 293.66, 261.63,
    ];
    const candyMelody = [
      329.63, 392.0, 493.88, 587.33, 493.88, 392.0, 440.0, 523.25,
      659.25, 523.25, 440.0, 392.0, 349.23, 392.0, 440.0, 493.88,
    ];
    const iceMelody = [
      440.0, 523.25, 659.25, 523.25, 440.0, 392.0, 440.0, 523.25,
      587.33, 523.25, 440.0, 392.0, 329.63, 392.0, 440.0, 392.0,
    ];
    const alienMelody = [
      220.0, 277.18, 329.63, 440.0, 329.63, 277.18, 220.0, 196.0,
      246.94, 293.66, 369.99, 293.66, 246.94, 220.0, 196.0, 164.81,
    ];

    const melody =
      theme === 'candy_land'
        ? candyMelody
        : theme === 'ice_world'
        ? iceMelody
        : theme === 'alien_jungle'
        ? alienMelody
        : greenMelody;

    let step = 0;
    const intervalMs = 220; // brisk cheerful tempo

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      const freq = melody[step % melody.length];
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = theme === 'alien_jungle' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);

      // Light bass pulse on beat 0, 4, 8, 12
      if (step % 4 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(freq / 2, t);
        bassGain.gain.setValueAtTime(0.05, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(t);
        bassOsc.stop(t + 0.28);
      }

      step++;
    }, intervalMs);
  }

  public stopBgm() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusicTheme = null;
  }
}

export const sound = new SoundEngine();
