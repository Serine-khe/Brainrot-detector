import type { GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision';

/** MediaPipe's built-in categories plus our own landmark-based ones (OK_Sign). */
export const HAND_GESTURES = [
  'Thumb_Up',
  'Thumb_Down',
  'Victory',
  'Pointing_Up',
  'Open_Palm',
  'Closed_Fist',
  'ILoveYou',
  'OK_Sign',
] as const;
export type HandGesture = (typeof HAND_GESTURES)[number];

const BUILT_IN_MIN_SCORE = 0.6;

export interface HandReading {
  gesture: HandGesture | null;
  score: number;
  landmarks: NormalizedLandmark[] | null;
  raw: string;
}

const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

/** A finger counts as extended when its tip is clearly farther from the wrist than its middle joint. */
function isExtended(lm: NormalizedLandmark[], tip: number, pip: number) {
  return dist(lm[0], lm[tip]) > dist(lm[0], lm[pip]) * 1.1;
}

/** 👌 thumb tip touching index tip, other three fingers up. MediaPipe has no built-in category for it. */
function isOkSign(lm: NormalizedLandmark[]) {
  const handSize = dist(lm[0], lm[9]);
  const pinched = dist(lm[4], lm[8]) < handSize * 0.35;
  return pinched && isExtended(lm, 12, 10) && isExtended(lm, 16, 14) && isExtended(lm, 20, 18);
}

export function readHand(result: GestureRecognizerResult | null): HandReading {
  const landmarks = result?.landmarks?.[0] ?? null;
  if (!landmarks) return { gesture: null, score: 0, landmarks: null, raw: 'no hand' };

  const top = result?.gestures?.[0]?.[0];
  const raw = top ? `${top.categoryName} ${top.score.toFixed(2)}` : 'none';

  if (isOkSign(landmarks)) return { gesture: 'OK_Sign', score: 1, landmarks, raw };

  if (top && top.score >= BUILT_IN_MIN_SCORE && (HAND_GESTURES as readonly string[]).includes(top.categoryName)) {
    return { gesture: top.categoryName as HandGesture, score: top.score, landmarks, raw };
  }
  return { gesture: null, score: 0, landmarks, raw };
}
