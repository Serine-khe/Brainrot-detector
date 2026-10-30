import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision';

export const FACE_EXPRESSIONS = ['Mouth_Open', 'Smile', 'Brows_Up', 'Kiss', 'Frown'] as const;
export type FaceExpression = (typeof FACE_EXPRESSIONS)[number];

type Blendshapes = Record<string, number>;
const avg = (a = 0, b = 0) => (a + b) / 2;

/** Frames of resting face needed before the frown (which is relative to it) can fire. */
const WARMUP_FRAMES = 20;
/** How quickly the resting-face baseline follows slow changes (head angle, lighting). */
const BASELINE_RATE = 0.03;

/**
 * How far the mouth corners sit below the middle of the lips, as a fraction of face height.
 * Goes up when frowning, down when smiling. Uses landmark geometry because MediaPipe's
 * mouthFrown blendshape barely responds for many faces.
 */
function cornerDrop(lm: NormalizedLandmark[]) {
  const faceHeight = Math.abs(lm[152].y - lm[10].y) || 1;
  const corners = (lm[61].y + lm[291].y) / 2;
  const lipCenter = (lm[13].y + lm[14].y) / 2;
  return (corners - lipCenter) / faceHeight;
}

export interface FaceReading {
  expression: FaceExpression | null;
  landmarks: NormalizedLandmark[] | null;
  blendshapes: Blendshapes | null;
  /** Frown signals relative to this person's resting face, for ?debug. */
  frown: { shape: number; drop: number } | null;
}

/**
 * Turns blendshapes into expressions. Most rules use absolute thresholds tuned for
 * exaggerated, meme-worthy faces. The frown compares against a learned resting face,
 * since resting mouths differ a lot from person to person.
 */
export class FaceReader {
  private baseShape = 0;
  private baseDrop = 0;
  private samples = 0;

  read(result: FaceLandmarkerResult | null): FaceReading {
    const landmarks = result?.faceLandmarks?.[0] ?? null;
    const categories = result?.faceBlendshapes?.[0]?.categories;
    if (!landmarks || !categories) return { expression: null, landmarks, blendshapes: null, frown: null };

    const b: Blendshapes = {};
    for (const c of categories) b[c.categoryName] = c.score;

    const shape = avg(b.mouthFrownLeft, b.mouthFrownRight);
    const drop = cornerDrop(landmarks);
    const frown = { shape: shape - this.baseShape, drop: drop - this.baseDrop };
    const mouthClosed = b.jawOpen < 0.3;

    const scores: Record<FaceExpression, number> = {
      Mouth_Open: b.jawOpen / 0.55,
      Smile: avg(b.mouthSmileLeft, b.mouthSmileRight) / 0.65,
      Brows_Up: Math.max(b.browInnerUp, avg(b.browOuterUpLeft, b.browOuterUpRight)) / 0.6,
      Kiss: b.jawOpen < 0.35 ? b.mouthPucker / 0.8 : 0,
      Frown: mouthClosed && this.samples >= WARMUP_FRAMES ? Math.max(frown.shape / 0.12, frown.drop / 0.012) : 0,
    };

    let expression: FaceExpression | null = null;
    let best = 1;
    for (const e of FACE_EXPRESSIONS) {
      if (scores[e] >= best) {
        expression = e;
        best = scores[e];
      }
    }

    // Learn the resting face only while nothing is being pulled, so a held frown isn't absorbed.
    const neutral = Object.values(scores).every((s) => s < 0.6) && mouthClosed;
    if (neutral) {
      const k = this.samples < WARMUP_FRAMES ? 1 / (this.samples + 1) : BASELINE_RATE;
      this.baseShape += (shape - this.baseShape) * k;
      this.baseDrop += (drop - this.baseDrop) * k;
      this.samples++;
    }

    return { expression, landmarks, blendshapes: b, frown };
  }
}
