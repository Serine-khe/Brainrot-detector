export interface GateOptions {
  /** How long the same candidate must be held before it fires. */
  holdMs: number;
  /** How long a fired trigger must be absent before it can fire again. */
  releaseMs: number;
  /** Minimum gap between any two triggers. */
  cooldownMs: number;
}

export interface GateResult<T> {
  fired: T | null;
  /** 0..1 progress of the current hold, for the "charging" bar. */
  progress: number;
}

/**
 * Turns a noisy per-frame candidate into clean, deliberate triggers:
 * - must be held steadily (filters out poses passed through while moving),
 * - can't re-fire while still held,
 * - global cooldown between memes.
 */
export class TriggerGate<T extends string> {
  private candidate: T | null = null;
  private since = 0;
  private locked: T | null = null;
  private lockAbsentSince: number | null = null;
  private lastFire = -Infinity;

  constructor(private opts: GateOptions) {}

  update(next: T | null, now: number, holdMs = this.opts.holdMs): GateResult<T> {
    if (next !== this.candidate) {
      this.candidate = next;
      this.since = now;
    }

    if (this.locked) {
      if (next === this.locked) {
        this.lockAbsentSince = null;
      } else {
        this.lockAbsentSince ??= now;
        if (now - this.lockAbsentSince >= this.opts.releaseMs) this.locked = null;
      }
    }

    if (!this.candidate || this.candidate === this.locked || now - this.lastFire < this.opts.cooldownMs) {
      return { fired: null, progress: 0 };
    }

    const progress = Math.min(1, (now - this.since) / holdMs);
    if (progress < 1) return { fired: null, progress };

    const fired = this.candidate;
    this.locked = fired;
    this.lockAbsentSince = null;
    this.lastFire = now;
    return { fired, progress: 1 };
  }

  reset() {
    this.candidate = null;
    this.locked = null;
    this.lockAbsentSince = null;
    this.lastFire = -Infinity;
  }
}
