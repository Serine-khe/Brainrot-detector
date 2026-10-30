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

  const onTrigger = useCallback((trigger: TriggerId) => {
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
  }, []);

  const status = useDetection({ video, canvas, engines, faceEnabled: true, onTrigger });
  const candidateMeme = status.candidate ? MEME_BY_TRIGGER.get(status.candidate) : null;
  const tracking = status.handVisible || status.faceVisible;

  const toggleMute = () => {
    audio.setMuted(!muted);
    setMuted(!muted);
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-void">
      {/* Camera + tracking layer, mirrored like a selfie. */}
      <div className="absolute inset-0 -scale-x-100">
        <video ref={setVideo} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        <canvas ref={setCanvas} className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <header className="safe-top absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4">
        <span className="rounded-full bg-black/60 px-4 py-2 font-display text-lg text-neon backdrop-blur">🐹 {count}</span>
        <div className="flex gap-2">
          <IconButton onClick={() => setShowCheat(true)} label="All memes">?</IconButton>
          <IconButton onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</IconButton>
          <IconButton onClick={onStop} label="Stop camera">✕</IconButton>
        </div>
      </header>

      {status.debug && (
        <pre className="absolute left-4 top-20 z-10 whitespace-pre-wrap rounded bg-black/70 p-2 text-[10px] text-neon">{status.debug}</pre>
      )}

      {/* One pill: what the machine sees, filling up as the gesture is held. */}
      <footer className="safe-bottom absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4">
        <div
          className={`relative w-full max-w-xs overflow-hidden rounded-full border-2 bg-black/70 px-5 py-3 text-center backdrop-blur ${
            tracking ? 'border-neon' : 'border-white/20'
          }`}
        >
          <div className="absolute inset-y-0 left-0 bg-neon/30 transition-[width] duration-100" style={{ width: `${status.progress * 100}%` }} />
          <p className="relative font-display text-lg">
            {candidateMeme ? (
              <>
                {candidateMeme.emoji} {candidateMeme.label}
              </>
            ) : (
              <span className="text-white/60">{tracking ? 'Hold a pose…' : '✋ Show your hand'}</span>
            )}
          </p>
        </div>
      </footer>

      <MemeOverlay active={active} onDone={dismiss} />
      {showCheat && <CheatSheet onClose={() => setShowCheat(false)} />}
    </main>
  );
}

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-xl text-white backdrop-blur transition active:scale-90"
    >
      {children}
    </button>
  );
}
