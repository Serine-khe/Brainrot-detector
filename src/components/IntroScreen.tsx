import { asset } from '../config/memes';

interface Props {
  onStart: () => void;
  starting: boolean;
  modelsReady: boolean;
  error: string | null;
}

const MASCOTS = [
  { src: 'memes/unicorn.gif', r: '-6deg', delay: '0s' },
  { src: 'memes/lollipop.gif', r: '5deg', delay: '.4s' },
  { src: 'memes/omg.gif', r: '-4deg', delay: '.8s' },
];

export function IntroScreen({ onStart, starting, modelsReady, error }: Props) {
  return (
    <main className="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-10 text-center">
      <div className="grid-bg absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#07090a_75%)]" aria-hidden />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        <p className="rounded-full border border-neon/40 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neon/80">
          experimental unit · mk-iii
        </p>

        <h1 className="flicker font-display text-5xl leading-[0.95] sm:text-6xl">
          <span className="neon-text">BRAINROT</span>
          <br />
          <span className="text-white">DETECTOR</span>
        </h1>

        <div className="flex items-end justify-center gap-2" aria-hidden>
          {MASCOTS.map((m) => (
            <img
              key={m.src}
              src={asset(m.src)}
              alt=""
              className="bob h-24 w-24 rounded-xl border-2 border-neon/60 bg-white object-cover shadow-neon sm:h-28 sm:w-28"
              style={{ ['--r' as string]: m.r, animationDelay: m.delay }}
            />
          ))}
        </div>

        <p className="max-w-xs text-sm leading-relaxed text-white/80">
          A highly scientific machine that converts your hand gestures and facial crimes into{' '}
          <span className="text-neon">hamster memes</span>. Peer reviewed by zero scientists.
        </p>

        <button
          onClick={onStart}
          disabled={starting}
          className="pulse-glow w-full rounded-2xl bg-neon px-6 py-5 font-display text-2xl text-black transition active:scale-95 disabled:opacity-70"
        >
          {starting ? 'WARMING UP HAMSTERS…' : 'START THE CHAOS'}
        </button>

        {error && (
          <p role="alert" className="w-full rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <ul className="space-y-1 text-xs text-white/50">
          <li>1. Allow the camera when asked</li>
          <li>2. Show one hand, or pull a face</li>
          <li>3. Hold it for a second. Chaos ensues.</li>
        </ul>

        <p className="text-[11px] text-white/40">
          📷 Everything runs on your phone. Nothing is recorded or uploaded.
          <br />
          <span className={modelsReady ? 'text-neon/70' : ''}>
            {modelsReady ? '● hamster brain loaded' : '○ loading hamster brain…'}
          </span>
        </p>
      </div>
    </main>
  );
}
