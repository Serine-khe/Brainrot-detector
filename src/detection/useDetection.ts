import { useEffect, useRef, useState } from 'react';
import {
  FaceLandmarker,
  GestureRecognizer,
  type FaceLandmarkerResult,
  type GestureRecognizerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import type { TriggerId } from '../config/memes';
import { readFace } from './faceExpressions';
import { readHand } from './handGestures';
import { TriggerGate } from './triggerGate';
import type { VisionEngines } from './vision';

const HAND_HOLD_MS = 300;
const FACE_HOLD_MS = 450;
const DEBUG = new URLSearchParams(location.search).has('debug');

export interface DetectionStatus {
  handVisible: boolean;
  faceVisible: boolean;
  candidate: TriggerId | null;
  progress: number;
  debug: string;
}

const IDLE: DetectionStatus = { handVisible: false, faceVisible: false, candidate: null, progress: 0, debug: '' };

interface Options {
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  engines: VisionEngines | null;
  faceEnabled: boolean;
  onTrigger: (trigger: TriggerId) => void;
}

export function useDetection({ video, canvas, engines, faceEnabled, onTrigger }: Options) {
  const [status, setStatus] = useState<DetectionStatus>(IDLE);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    if (!video || !canvas || !engines) return;
    const ctx = canvas.getContext('2d')!;
    const gate = new TriggerGate<TriggerId>({ holdMs: HAND_HOLD_MS, releaseMs: 450, cooldownMs: 1400 });

    let raf = 0;
    let frame = 0;
    let lastVideoTime = -1;
    let handResult: GestureRecognizerResult | null = null;
    let faceResult: FaceLandmarkerResult | null = null;
    let prev = IDLE;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
      lastVideoTime = video.currentTime;
      frame++;

      // Alternate the two models frame by frame to keep phones smooth.
      try {
        if (!faceEnabled || frame % 2 === 0) handResult = engines.gesture.recognizeForVideo(video, performance.now());
        else faceResult = engines.face.detectForVideo(video, performance.now());
      } catch (err) {
        console.warn('detection frame failed', err);
        return;
      }

      const hand = readHand(handResult);
      const face = faceEnabled ? readFace(faceResult) : null;

      // A deliberate hand gesture beats whatever the face is doing.
      const candidate = hand.gesture ?? face?.expression ?? null;
      const now = performance.now();
      const { fired, progress } = gate.update(candidate, now, hand.gesture ? HAND_HOLD_MS : FACE_HOLD_MS);
      if (fired) onTriggerRef.current(fired);

      draw(ctx, video, hand.landmarks, face?.landmarks ?? null, progress);

      const next: DetectionStatus = {
        handVisible: !!hand.landmarks,
        faceVisible: !!face?.landmarks,
        candidate,
        progress: Math.round(progress * 10) / 10,
        debug: DEBUG ? debugText(hand.raw, face?.blendshapes ?? null) : '',
      };
      if (
        next.handVisible !== prev.handVisible ||
        next.faceVisible !== prev.faceVisible ||
        next.candidate !== prev.candidate ||
        next.progress !== prev.progress ||
        next.debug !== prev.debug
      ) {
        prev = next;
        setStatus(next);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setStatus(IDLE);
    };
  }, [video, canvas, engines, faceEnabled]);

  return status;
}

const NEON = '#39ff14';

function draw(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  hand: NormalizedLandmark[] | null,
  face: NormalizedLandmark[] | null,
  progress: number,
) {
  const { videoWidth: w, videoHeight: h } = video;
  if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
    ctx.canvas.width = w;
    ctx.canvas.height = h;
  }
  ctx.clearRect(0, 0, w, h);
  const unit = w / 640;

  ctx.lineCap = 'round';
  ctx.shadowColor = NEON;

  if (face) {
    ctx.strokeStyle = 'rgba(57,255,20,0.45)';
    ctx.lineWidth = 1.5 * unit;
    ctx.shadowBlur = 6 * unit;
    for (const set of [
      FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      FaceLandmarker.FACE_LANDMARKS_LIPS,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    ]) {
      ctx.beginPath();
      for (const { start, end } of set) {
        ctx.moveTo(face[start].x * w, face[start].y * h);
        ctx.lineTo(face[end].x * w, face[end].y * h);
      }
      ctx.stroke();
    }
  }

  if (hand) {
    // The skeleton glows brighter as a gesture "charges up".
    ctx.strokeStyle = NEON;
    ctx.lineWidth = (3 + progress * 3) * unit;
    ctx.shadowBlur = (10 + progress * 20) * unit;
    ctx.beginPath();
    for (const { start, end } of GestureRecognizer.HAND_CONNECTIONS) {
      ctx.moveTo(hand[start].x * w, hand[start].y * h);
      ctx.lineTo(hand[end].x * w, hand[end].y * h);
    }
    ctx.stroke();
    ctx.fillStyle = '#eaffe3';
    for (const p of hand) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 4 * unit, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

function debugText(handRaw: string, b: Record<string, number> | null) {
  const f = (k: string) => (b?.[k] ?? 0).toFixed(2);
  return [
    `hand: ${handRaw}`,
    b
      ? `jaw ${f('jawOpen')} smile ${f('mouthSmileLeft')}/${f('mouthSmileRight')} browIn ${f('browInnerUp')} ` +
        `browOut ${f('browOuterUpLeft')}/${f('browOuterUpRight')} pucker ${f('mouthPucker')} frown ${f('mouthFrownLeft')}/${f('mouthFrownRight')}`
      : 'face: none',
  ].join('\n');
}
