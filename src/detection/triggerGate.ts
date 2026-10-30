export interface GateOptions {
  /** How long the same candidate must be held before it fires. */
  holdMs: number;
  /** How long a fired trigger must be absent before it can fire again. */
  releaseMs: number;
  /** Minimum gap between any two triggers. */
  cooldownMs: number;
  /** A change must last this long to count, so 1-2 frame tracking dropouts don't reset a hold. */
  settleMs: number;
}

export interface GateResult<T> {
  fired: T | null;
  /** 0..1 progress of the current hold, for the "charging" bar. */
  progress: number;
}

/**
 * Turns a noisy per-frame candidate into clean, deliberate triggers:
 * - ignores flickers shorter than settleMs (tracking hiccups),
 * - must be held steadily (filters out poses passed through while moving),
 * - can't re-fire while still held,
 * - global cooldown between memes.
 */
export class TriggerGate<T extends string> {
  private raw: T | null = null;
  private rawSince = 0;
  private candidate: T | null = null;
  private since = 0;
  private locked: T | null = null;
  private lockAbsentSince: number | null = null;
  private lastFire = -Infinity;

  constructor(private opts: GateOptions) {}

  /** The settled (de-flickered) candidate. */
  get current() {
    return this.candidate;
  }

  update(next: T | null, now: number, holdMs = this.opts.holdMs): GateResult<T> {
    if (next !== this.raw) {
      this.raw = next;
      this.rawSince = now;
    }
    // Picking up a gesture is instant (the hold time guards it); losing or switching one must persist.
    if (this.raw !== this.candidate && (this.candidate === null || now - this.rawSince >= this.opts.settleMs)) {
      this.candidate = this.raw;
      this.since = this.rawSince;
    }

    if (this.locked) {
      if (this.candidate === this.locked) {
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
    this.raw = null;
    this.candidate = null;
    this.locked = null;
    this.lockAbsentSince = null;
    this.lastFire = -Infinity;
  }
}
