import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../audio/audioManager';
import { MEME_BY_TRIGGER, asset, type TriggerId } from '../config/memes';
import { useDetection } from '../detection/useDetection';
import type { VisionEngines } from '../detection/vision';
import { CheatSheet } from './CheatSheet';
import { MemeOverlay, type ActiveMeme } from './MemeOverlay';

const MIN_SHOW_MS = 2200;
const MAX_SHOW_MS = 7000;

interface Props {
  stream: MediaStream;
  engines: VisionEngines;
  onStop: () => void;
}

export function MachineScreen({ stream, engines, onStop }: Props) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [faceEnabled, setFaceEnabled] = useState(true);
  const [muted, setMuted] = useState(audio.isMuted());
  const [count, setCount] = useState(0);
  const [active, setActive] = useState<ActiveMeme | null>(null);
  const [showCheat, setShowCheat] = useState(false);
  const hideTimer = useRef<number>();

  useEffect(() => {
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
  }, [video, stream]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const dismiss = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setActive(null);
  }, []);

  const onTrigger = useCallback(
    (trigger: TriggerId) => {
      const meme = MEME_BY_TRIGGER.get(trigger);
      if (!meme) return;
      let soundMs = 0;
      if (meme.sound && !meme.useVideoAudio) soundMs = audio.play(asset(meme.sound));
      else audio.stop();
      navigator.vibrate?.(60);
      setActive({ meme, key: performance.now() });
      setCount((c) => c + 1);

      window.clearTimeout(hideTimer.current);
      // Videos dismiss themselves when they end; images stay for the length of their sound.
      if (meme.media.type === 'image') {
        const ms = Math.min(MAX_SHOW_MS, Math.max(MIN_SHOW_MS, soundMs + 500));
        hideTimer.current = window.setTimeout(() => setActive(null), ms);
      }
    },
    [],
  );

  const status = useDetection({ video, canvas, engines, faceEnabled, onTrigger });
  const candidateMeme = status.candidate ? MEME_BY_TRIGGER.get(status.candidate) : null;

  const toggleMute = () => {
    audio.setMuted(!muted);
    setMuted(!muted);
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-void">
      {/* Camera + tracking layer, mirrored like a selfie. */}
      <div className="absolute inset-0 -scale-x-100">
        <video ref={setVideo} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-80" />
        <canvas ref={setCanvas} className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="scanlines absolute inset-0" aria-hidden />
      <div className="scan-beam absolute inset-x-0 top-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(7,9,10,.85)_100%)]" aria-hidden />
      <Brackets />

      {/* Top HUD */}
      <header className="safe-top absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 px-4">
        <div>
          <p className="font-display text-lg leading-none">
            <span className="neon-text">BRAINROT</span> <span className="text-white">DETECTOR</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] uppercase">
            <Chip on={status.handVisible}>{status.handVisible ? '✋ hand locked' : '✋ no hand'}</Chip>
            {faceEnabled && <Chip on={status.faceVisible}>{status.faceVisible ? '🙂 face locked' : '🙂 no face'}</Chip>}
            <Chip on>{engines.delegate}</Chip>
          </div>
        </div>
        <div className="rounded-2xl border border-neon/50 bg-black/60 px-3 py-2 text-center backdrop-blur">
          <p className="text-[10px] tracking-widest text-neon/70">MEMES</p>
          <p className="neon-text font-display text-2xl leading-none tabular-nums">{String(count).padStart(2, '0')}</p>
        </div>
      </header>

      {status.debug && (
        <pre className="absolute left-4 top-28 z-10 whitespace-pre-wrap rounded bg-black/70 p-2 text-[10px] text-neon">{status.debug}</pre>
      )}

      {/* Bottom HUD */}
      <footer className="safe-bottom absolute inset-x-0 bottom-0 z-10 px-4 landscape:left-auto landscape:w-[22rem]">
        <div className="mx-auto max-w-md rounded-3xl border border-neon/40 bg-black/70 p-4 backdrop-blur">
          <p className="text-[10px] tracking-[0.3em] text-neon/70">DETECTED</p>
          <p className="mt-1 min-h-[2.25rem] font-display text-2xl leading-tight">
            {candidateMeme ? (
              <span>
                {candidateMeme.emoji} <span className="text-white">{candidateMeme.label}</span>
              </span>
            ) : (
              <span className="text-white/40">{status.handVisible || status.faceVisible ? 'hmm… do something' : 'show yourself'}</span>
            )}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-neon shadow-neon transition-[width] duration-100" style={{ width: `${status.progress * 100}%` }} />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            <Control onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'} icon={muted ? '🔇' : '🔊'} active={!muted} />
            <Control onClick={() => setFaceEnabled((f) => !f)} label={faceEnabled ? 'Face on' : 'Face off'} icon={faceEnabled ? '😜' : '😶'} active={faceEnabled} />
            <Control onClick={() => setShowCheat(true)} label="Memes" icon="📖" />
            <Control onClick={onStop} label="Stop" icon="⏹" danger />
          </div>
        </div>
      </footer>

      <MemeOverlay active={active} onDone={dismiss} />
      {showCheat && <CheatSheet onClose={() => setShowCheat(false)} />}
    </main>
  );
}

function Chip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 backdrop-blur ${
        on ? 'border-neon/70 bg-neon/15 text-neon' : 'border-white/20 bg-black/50 text-white/50'
      }`}
    >
      {children}
    </span>
  );
}

function Control({ onClick, label, icon, active, danger }: { onClick: () => void; label: string; icon: string; active?: boolean; danger?: boolean }) {
  const tone = danger
    ? 'border-red-500/60 text-red-300'
    : active
      ? 'border-neon/70 text-neon bg-neon/10'
      : 'border-white/25 text-white/80';
  return (
    <button onClick={onClick} className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border ${tone} text-[11px] uppercase transition active:scale-95`}>
      <span className="text-2xl leading-none">{icon}</span>
      {label}
    </button>
  );
}

/** Targeting-reticle corners for the experimental-machine vibe. */
function Brackets() {
  const c = 'absolute h-10 w-10 border-neon/70';
  return (
    <div className="pointer-events-none absolute inset-6 top-24 bottom-56 landscape:bottom-6 landscape:right-[23rem]" aria-hidden>
      <span className={`${c} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${c} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${c} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${c} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}
