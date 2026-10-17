/**
 * Super Pixel World - Procedural Web Audio Sound Engine & Global BGM System
 *
 * BGM System:
 * - 'Save State.mp3' for Main Menu and Level Editor
 * - 'Pixel Bounce.mp3' for Gameplay / Testing (GamePlayer)
 * - Default BGM volume 40% (0.4)
 * - Smooth fade-out / fade-in transitions between screens
 * - Never plays both tracks simultaneously
 * - Respects browser autoplay policies (starts on first user gesture)
 * - Reactive settings subscription and LocalStorage persistence
 *
 * SFX:
 * - Procedural arcade sound effects (jump, coin, click, bump, stomp, etc.)
 */

import saveStateUrl from './Save State.mp3';
import pixelBounceUrl from './Pixel Bounce.mp3';
import { SettingsManager } from '../services/storageManager';

export type BgmTrack = 'menu_editor' | 'gameplay' | 'none';

export interface SoundEngineSettings {
  sound: boolean;
  music: boolean;
  volume: number;
  isMuted: boolean;
}

export type SoundSettingsListener = (settings: SoundEngineSettings) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;

  // Audio elements for real BGM tracks
  private saveStateAudio: HTMLAudioElement | null = null;
  private pixelBounceAudio: HTMLAudioElement | null = null;

  private currentTrack: BgmTrack = 'none';
  private targetTrack: BgmTrack = 'none';
  private isFading: boolean = false;
  private fadeInterval: number | null = null;
  private hasUserInteracted: boolean = false;

  // Settings
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterVolume: number = 0.4; // 40% default BGM volume as requested
  private isMuted: boolean = false;

  // Reactive listeners
  private listeners: Set<SoundSettingsListener> = new Set();

  constructor() {
    // Load persisted settings from LocalStorage
    try {
      const saved = SettingsManager.getSettings();
      this.soundEnabled = saved.sound ?? true;
      this.musicEnabled = saved.music ?? true;
      this.masterVolume = typeof saved.volume === 'number' ? saved.volume : 0.4;
      this.isMuted = saved.isMuted ?? false;
    } catch {
      // ignore
    }

    // Initialize audio elements in browser environment
    if (typeof window !== 'undefined') {
      try {
        this.saveStateAudio = new Audio(saveStateUrl);
        this.saveStateAudio.loop = true;
        this.saveStateAudio.preload = 'auto';

        this.pixelBounceAudio = new Audio(pixelBounceUrl);
        this.pixelBounceAudio.loop = true;
        this.pixelBounceAudio.preload = 'auto';
      } catch (e) {
        console.warn('Audio element creation error:', e);
      }

      // Attach interaction listeners to unlock autoplay policy
      const unlockAutoplay = () => {
        this.registerInteraction();
      };

      ['click', 'keydown', 'touchstart', 'pointerdown'].forEach((evt) => {
        window.addEventListener(evt, unlockAutoplay, { once: true, capture: true });
      });
    }
  }

  // --- Interaction & Autoplay Unlocking ---

  public registerInteraction() {
    if (!this.hasUserInteracted) {
      this.hasUserInteracted = true;
      this.initContext();
      if (this.targetTrack !== 'none') {
        this.applyTrackSwitch(this.targetTrack);
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // --- Reactive Settings & Subscriptions ---

  public onSettingsChange(listener: SoundSettingsListener): () => void {
    this.listeners.add(listener);
    listener(this.getSettingsState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSettingsState(): SoundEngineSettings {
    return {
      sound: this.soundEnabled,
      music: this.musicEnabled,
      volume: this.masterVolume,
      isMuted: this.isMuted,
    };
  }

  private notifyListeners() {
    const state = this.getSettingsState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('Settings listener error:', e);
      }
    });
  }

  public applySettings(settings: { sound: boolean; music: boolean; volume: number; isMuted?: boolean }) {
    this.soundEnabled = settings.sound;
    this.musicEnabled = settings.music;
    this.masterVolume = Math.max(0, Math.min(1, settings.volume));
    if (typeof settings.isMuted === 'boolean') {
      this.isMuted = settings.isMuted;
    }

    SettingsManager.updateSettings({
      sound: this.soundEnabled,
      music: this.musicEnabled,
      volume: this.masterVolume,
      isMuted: this.isMuted,
    });

    this.updateActiveAudioVolume();
    this.notifyListeners();
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    SettingsManager.setVolume(this.masterVolume);
    this.updateActiveAudioVolume();
    this.notifyListeners();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    SettingsManager.setMuted(this.isMuted);
    this.updateActiveAudioVolume();
    this.notifyListeners();
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    SettingsManager.setMuted(this.isMuted);
    this.updateActiveAudioVolume();
    this.notifyListeners();
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    SettingsManager.setSound(enabled);
    this.notifyListeners();
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    SettingsManager.setMusic(enabled);
    this.updateActiveAudioVolume();
    this.notifyListeners();
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

  public getCurrentTrack(): BgmTrack {
    return this.currentTrack;
  }

  public getEffectiveBgmVolume(): number {
    if (this.isMuted || !this.musicEnabled) return 0;
    return this.masterVolume;
  }

  // --- Audio Element Helper ---

  private getAudioElement(track: BgmTrack): HTMLAudioElement | null {
    if (track === 'menu_editor') return this.saveStateAudio;
    if (track === 'gameplay') return this.pixelBounceAudio;
    return null;
  }

  private updateActiveAudioVolume() {
    const activeAudio = this.getAudioElement(this.currentTrack);
    const targetVol = this.getEffectiveBgmVolume();

    if (activeAudio) {
      if (!this.isFading) {
        activeAudio.volume = targetVol;
      }
      if (targetVol > 0 && activeAudio.paused && this.hasUserInteracted && this.currentTrack !== 'none') {
        activeAudio.play().catch(() => {});
      } else if (targetVol === 0 && !activeAudio.paused) {
        // When muted or volume is 0, we set volume to 0 to keep position smoothly
        activeAudio.volume = 0;
      }
    }
  }

  // --- BGM Control & Smooth Transitions ---

  /**
   * Switches BGM track with smooth fade-out and fade-in transitions.
   * Tracks:
   * - 'menu_editor' -> Save State.mp3
   * - 'gameplay' -> Pixel Bounce.mp3
   * - 'none' -> Stop BGM
   */
  public playBgm(track: BgmTrack) {
    this.targetTrack = track;

    if (!this.hasUserInteracted) {
      // Will auto-start once user clicks anywhere
      return;
    }

    this.applyTrackSwitch(track);
  }

  /**
   * Backward-compatible alias for older callers
   */
  public startBgm(_theme?: string) {
    this.playBgm('menu_editor');
  }

  public stopBgm() {
    this.playBgm('none');
  }

  private applyTrackSwitch(nextTrack: BgmTrack) {
    // If the requested track is already currently playing
    if (this.currentTrack === nextTrack) {
      const currentAudio = this.getAudioElement(this.currentTrack);
      if (currentAudio) {
        const targetVol = this.getEffectiveBgmVolume();
        if (!this.isFading) {
          currentAudio.volume = targetVol;
        }
        if (targetVol > 0 && currentAudio.paused) {
          currentAudio.play().catch(() => {});
        }
      }
      return;
    }

    // Clear any pending fade
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const prevTrack = this.currentTrack;
    const prevAudio = this.getAudioElement(prevTrack);
    const nextAudio = this.getAudioElement(nextTrack);
    const targetVol = this.getEffectiveBgmVolume();

    // Step 1: Smoothly fade out previous track (250ms)
    if (prevAudio && !prevAudio.paused && prevAudio.volume > 0.01) {
      this.isFading = true;
      const startVol = prevAudio.volume;
      const steps = 10;
      const stepTime = 25; // 250ms
      let currentStep = 0;

      this.fadeInterval = window.setInterval(() => {
        currentStep++;
        const factor = 1 - currentStep / steps;
        prevAudio.volume = Math.max(0, startVol * factor);

        if (currentStep >= steps || prevAudio.volume <= 0.01) {
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          prevAudio.pause();
          prevAudio.currentTime = 0;

          // Switch current track pointer and start next track
          this.currentTrack = nextTrack;
          this.startNextTrack(nextAudio, targetVol);
        }
      }, stepTime);
    } else {
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
      this.currentTrack = nextTrack;
      this.startNextTrack(nextAudio, targetVol);
    }
  }

  private startNextTrack(audio: HTMLAudioElement | null, targetVol: number) {
    if (!audio || this.currentTrack === 'none' || targetVol <= 0) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      this.isFading = false;
      return;
    }

    // Guarantee previous track is completely paused
    if (this.currentTrack === 'menu_editor' && this.pixelBounceAudio) {
      this.pixelBounceAudio.pause();
      this.pixelBounceAudio.currentTime = 0;
    } else if (this.currentTrack === 'gameplay' && this.saveStateAudio) {
      this.saveStateAudio.pause();
      this.saveStateAudio.currentTime = 0;
    }

    audio.currentTime = 0;
    audio.volume = 0;

    audio
      .play()
      .then(() => {
        this.isFading = true;
        const steps = 10;
        const stepTime = 25; // 250ms
        let currentStep = 0;

        this.fadeInterval = window.setInterval(() => {
          currentStep++;
          const factor = currentStep / steps;
          const currentTarget = this.getEffectiveBgmVolume();
          audio.volume = Math.min(1, Math.max(0, currentTarget * factor));

          if (currentStep >= steps) {
            if (this.fadeInterval) clearInterval(this.fadeInterval);
            this.fadeInterval = null;
            audio.volume = this.getEffectiveBgmVolume();
            this.isFading = false;
          }
        }, stepTime);
      })
      .catch((e) => {
        console.warn('Playback prevented by browser autoplay policy:', e);
        this.isFading = false;
      });
  }

  // --- Procedural Arcade Sound Effects (SFX) ---

  public playClick() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
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

  public playJump() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.14);

    const vol = 0.18 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.linearRampToValueAtTime(vol * 0.67, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playCoin() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
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

    const vol = 0.2 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
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
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66, 1760.0];
    const duration = 0.08;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * duration);

      const vol = 0.15 * this.masterVolume;
      gain.gain.setValueAtTime(vol, t + idx * duration);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx + 1) * duration + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * duration);
      osc.stop(t + (idx + 1) * duration + 0.06);
    });
  }

  public playEnemyStomp() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

    const vol = 0.25 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playBump() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);

    const vol = 0.2 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playHurt() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.22);

    const vol = 0.22 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playVictory() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.35 },
    ];

    let offset = 0;
    melody.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t + offset);

      const vol = 0.22 * this.masterVolume;
      gain.gain.setValueAtTime(vol, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + offset);
      osc.stop(t + offset + note.d + 0.02);

      offset += note.d * 0.9;
    });
  }

  public playGameOver() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const melody = [
      { f: 392.0, d: 0.2 },
      { f: 349.23, d: 0.2 },
      { f: 329.63, d: 0.2 },
      { f: 261.63, d: 0.45 },
    ];

    let offset = 0;
    melody.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t + offset);

      const vol = 0.18 * this.masterVolume;
      gain.gain.setValueAtTime(vol, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + offset);
      osc.stop(t + offset + note.d + 0.02);

      offset += note.d * 0.95;
    });
  }

  public playPlaceTile() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);

    const vol = 0.12 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playErase() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);

    const vol = 0.12 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playSelect() {
    this.registerInteraction();
    if (this.isMuted || !this.soundEnabled || this.masterVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.06);

    const vol = 0.12 * this.masterVolume;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }
}

export const sound = new SoundEngine();
