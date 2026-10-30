import { useEffect, useRef } from 'react';
import { audio } from '../audio/audioManager';
import { asset, type MemeConfig } from '../config/memes';

export interface ActiveMeme {
  meme: MemeConfig;
  /** Changes on every trigger so the entrance animation replays. */
  key: number;
}

interface Props {
  active: ActiveMeme | null;
  onDone: () => void;
}

export function MemeOverlay({ active, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // One persistent <video> element: iOS only lets an element play with sound
  // once it has been started from a tap, so we keep reusing the primed one.
  useEffect(() => {
    audio.registerVideo(videoRef.current);
    return () => audio.registerVideo(null);
  }, []);

  const isVideo = active?.meme.media.type === 'video';

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!active || !isVideo) {
      v.pause();
      return;
    }
    v.src = asset(active.meme.media.src);
    v.muted = audio.isMuted() || !active.meme.useVideoAudio;
    v.currentTime = 0;
    v.play().catch(() => {
      // Sound blocked: still show the clip silently rather than nothing.
      v.muted = true;
      void v.play();
    });
  }, [active, isVideo]);

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center px-4 ${active ? '' : 'pointer-events-none'}`}
      onClick={active ? onDone : undefined}
    >
      {active && (
        <>
          <div key={`bg${active.key}`} className="fade-in absolute inset-0 bg-black/85" />
          <div key={`flash${active.key}`} className="flash absolute inset-0 bg-neon" />
        </>
      )}

      <div
        key={active?.key}
        className={`relative flex w-full max-w-[min(92vw,30rem,62dvh)] flex-col items-center ${active ? 'meme-pop' : 'hidden'}`}
      >
        <div className="meme-wobble relative w-full overflow-hidden rounded-3xl border-4 border-neon bg-white shadow-neon">
          {active && !isVideo && (
            <img src={asset(active.meme.media.src)} alt={active.meme.caption} className="aspect-square w-full object-contain" />
          )}
          <video
            ref={videoRef}
            playsInline
            preload="auto"
            onEnded={onDone}
            className={isVideo ? 'aspect-square w-full bg-black object-contain' : 'hidden'}
          />
          {active && (
            <span className="absolute -right-1 -top-1 rounded-bl-2xl bg-neon px-3 py-1 text-3xl" aria-hidden>
              {active.meme.emoji}
            </span>
          )}
        </div>
        {active && (
          <p className="neon-text mt-5 text-center font-display text-3xl uppercase leading-tight sm:text-4xl">
            {active.meme.caption}
          </p>
        )}
      </div>
    </div>
  );
}
