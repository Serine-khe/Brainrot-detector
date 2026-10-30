import { FaceLandmarker, FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export interface VisionEngines {
  gesture: GestureRecognizer;
  face: FaceLandmarker;
  delegate: 'GPU' | 'CPU';
}

const BASE = import.meta.env.BASE_URL;

/** Try the GPU first (much faster on phones); fall back to CPU on devices where WebGL isn't usable. */
async function withFallback<T>(create: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<[T, 'GPU' | 'CPU']> {
  try {
    return [await create('GPU'), 'GPU'];
  } catch (err) {
    console.warn('GPU delegate failed, falling back to CPU', err);
    return [await create('CPU'), 'CPU'];
  }
}

let loading: Promise<VisionEngines> | null = null;

/** Loads both models once; everything is served from our own /public folder, nothing leaves the device. */
export function loadVision(): Promise<VisionEngines> {
  loading ??= (async () => {
    const fileset = await FilesetResolver.forVisionTasks(`${BASE}mediapipe/wasm`);

    const [gesture, delegate] = await withFallback((d) =>
      GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${BASE}models/gesture_recognizer.task`, delegate: d },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.5,
      }),
    );

    const [face] = await withFallback((d) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: `${BASE}models/face_landmarker.task`, delegate: d },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
      }),
    );

    return { gesture, face, delegate };
  })();
  loading.catch(() => (loading = null));
  return loading;
}
