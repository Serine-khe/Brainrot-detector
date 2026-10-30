import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision';

export const FACE_EXPRESSIONS = ['Mouth_Open', 'Smile', 'Brows_Up', 'Kiss', 'Frown'] as const;
export type FaceExpression = (typeof FACE_EXPRESSIONS)[number];

type Blendshapes = Record<string, number>;
const avg = (a = 0, b = 0) => (a + b) / 2;

/**
 * Each rule returns "how far past its threshold" the face is: >= 1 means active.
 * Thresholds are tuned for exaggerated, meme-worthy expressions, not subtle ones.
 * Open the app with ?debug to see live blendshape values while tuning.
 */
const RULES: Record<FaceExpression, (b: Blendshapes) => number> = {
  Mouth_Open: (b) => b.jawOpen / 0.55,
  Smile: (b) => avg(b.mouthSmileLeft, b.mouthSmileRight) / 0.65,
  Brows_Up: (b) => Math.max(b.browInnerUp, avg(b.browOuterUpLeft, b.browOuterUpRight)) / 0.6,
  Kiss: (b) => (b.jawOpen < 0.35 ? b.mouthPucker / 0.8 : 0),
  Frown: (b) => avg(b.mouthFrownLeft, b.mouthFrownRight) / 0.3,
};

export interface FaceReading {
  expression: FaceExpression | null;
  landmarks: NormalizedLandmark[] | null;
  blendshapes: Blendshapes | null;
}

export function readFace(result: FaceLandmarkerResult | null): FaceReading {
  const landmarks = result?.faceLandmarks?.[0] ?? null;
  const categories = result?.faceBlendshapes?.[0]?.categories;
  if (!landmarks || !categories) return { expression: null, landmarks, blendshapes: null };

  const blendshapes: Blendshapes = {};
  for (const c of categories) blendshapes[c.categoryName] = c.score;

  let best: FaceExpression | null = null;
  let bestScore = 1;
  for (const expr of FACE_EXPRESSIONS) {
    const s = RULES[expr](blendshapes);
    if (s >= bestScore) {
      best = expr;
      bestScore = s;
    }
  }
  return { expression: best, landmarks, blendshapes };
}
