/**
 * One sound at a time, through the Web Audio API.
 *
 * - Must be unlocked from a tap (mobile autoplay rules), which the START button does.
 * - A new meme cuts off the previous sound; otherwise sounds finish naturally.
 * - Buffers are decoded up front so triggers play instantly.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<void>>();
  private current: AudioBufferSourceNode | null = null;
  private video: HTMLVideoElement | null = null;
  private muted = false;

  /** Call synchronously inside a user tap handler. */
  unlock() {
    // iOS: without this, Web Audio is silenced by the ring/silent switch.
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';

    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.muted ? 0 : 1;
      this.gain.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    // Play one silent sample inside the gesture: the classic iOS unlock.
    const silent = this.ctx.createBufferSource();
    silent.buffer = this.ctx.createBuffer(1, 1, 22050);
    silent.connect(this.ctx.destination);
    silent.start(0);

    // Prime the shared video element so video memes may play with sound later.
    if (this.video?.src) {
      this.video.play().then(() => this.video?.pause(), () => {});
    }
  }

  registerVideo(el: HTMLVideoElement | null) {
    this.video = el;
  }

  preload(urls: string[]) {
    return Promise.all(urls.map((u) => this.load(u)));
  }

  private load(url: string): Promise<void> {
    if (this.buffers.has(url)) return Promise.resolve();
    let p = this.pending.get(url);
    if (!p) {
      p = (async () => {
        if (!this.ctx) return;
        const data = await (await fetch(url)).arrayBuffer();
        this.buffers.set(url, await this.ctx.decodeAudioData(data));
      })().catch((err) => console.warn('Could not load sound', url, err));
      this.pending.set(url, p);
    }
    return p;
  }

  /** Plays a sound, replacing any current one. Returns its duration in ms (0 if unavailable). */
  play(url: string): number {
    this.stop();
    const buffer = this.buffers.get(url);
    if (!this.ctx || !this.gain || !buffer) {
      void this.load(url);
      return 0;
    }
    void this.ctx.resume();
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.gain);
    src.onended = () => {
      if (this.current === src) this.current = null;
    };
    src.start();
    this.current = src;
    return buffer.duration * 1000;
  }

  stop() {
    try {
      this.current?.stop();
    } catch {
      /* already stopped */
    }
    this.current = null;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    if (this.video) this.video.muted = muted;
  }

  isMuted() {
    return this.muted;
  }
}

export const audio = new AudioManager();
