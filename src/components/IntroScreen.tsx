import { asset } from '../config/memes';

interface Props {
  onStart: () => void;
  starting: boolean;
  modelsReady: boolean;
  error: string | null;
}

export function IntroScreen({ onStart, starting, modelsReady, error }: Props) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-8 px-4 py-10 text-center">
      <img
        src={asset('memes/unicorn.gif')}
        alt=""
        className="bob h-40 w-40 rounded-3xl border-2 border-neon bg-white object-cover shadow-neon"
      />

      <div>
        <h1 className="font-display text-4xl leading-none">
          <span className="neon-text">BRAINROT</span> <span className="text-white">DETECTOR</span>
        </h1>
        <p className="mt-3 text-white/70">Make a gesture. Get a hamster.</p>
      </div>

      <button
        onClick={onStart}
        disabled={starting}
        className="pulse-glow w-full max-w-sm rounded-2xl bg-neon px-6 py-5 font-display text-2xl text-black transition active:scale-95 disabled:opacity-70"
      >
        {starting ? (modelsReady ? 'STARTING…' : 'LOADING…') : 'START THE CHAOS'}
      </button>

      {error && (
        <p role="alert" className="w-full max-w-sm rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <p className="text-xs text-white/40">📷 Runs on your device. Nothing is uploaded.</p>
    </main>
  );
}
