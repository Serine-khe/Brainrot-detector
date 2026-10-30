import { useEffect, useState } from 'react';
import { audio } from './audio/audioManager';
import { IntroScreen } from './components/IntroScreen';
import { MachineScreen } from './components/MachineScreen';
import { MEMES, asset } from './config/memes';
import { loadVision, type VisionEngines } from './detection/vision';

type Phase = 'intro' | 'starting' | 'running';

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (!window.isSecureContext) return 'The camera only works over HTTPS. Open the https:// link.';
  if (name === 'NotAllowedError')
    return 'Camera access was blocked. Tap the icon next to the address bar, allow the camera, then reload the page.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera found on this device.';
  if (name === 'NotReadableError') return 'Your camera is busy in another app. Close it and try again.';
  return 'The machine could not start. Reload the page and try again.';
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [engines, setEngines] = useState<VisionEngines | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start downloading the models and memes while the user reads the intro.
  useEffect(() => {
    loadVision().then(setEngines, (err) => console.error('model load failed', err));
    for (const m of MEMES) if (m.media.type === 'image') new Image().src = asset(m.media.src);
  }, []);

  const start = async () => {
    setError(null);
    audio.unlock(); // must happen synchronously in the tap
    void audio.preload(MEMES.flatMap((m) => (m.sound ? [asset(m.sound)] : [])));
    setPhase('starting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('no mediaDevices', 'NotFoundError');
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      try {
        setEngines(await loadVision());
      } catch (err) {
        s.getTracks().forEach((t) => t.stop());
        throw err;
      }
      setStream(s);
      setPhase('running');
    } catch (err) {
      console.error(err);
      setError(cameraErrorMessage(err));
      setPhase('intro');
    }
  };

  const stop = () => {
    stream?.getTracks().forEach((t) => t.stop());
    audio.stop();
    setStream(null);
    setPhase('intro');
  };

  if (phase === 'running' && stream && engines) {
    return <MachineScreen stream={stream} engines={engines} onStop={stop} />;
  }
  return <IntroScreen onStart={start} starting={phase === 'starting'} modelsReady={!!engines} error={error} />;
}
