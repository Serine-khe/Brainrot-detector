import type { FaceExpression } from '../detection/faceExpressions';
import type { HandGesture } from '../detection/handGestures';

export type TriggerId = HandGesture | FaceExpression;

export interface MemeConfig {
  trigger: TriggerId;
  kind: 'hand' | 'face';
  /** What the user should do, shown in the cheat sheet and HUD. */
  label: string;
  emoji: string;
  /** Caption shown under the meme when it fires. */
  caption: string;
  media: { type: 'image' | 'video'; src: string };
  /** Separate sound effect. Omit for videos that play their own audio. */
  sound?: string;
  /** For video memes: play the clip's own soundtrack instead of `sound`. */
  useVideoAudio?: boolean;
}

/**
 * The whole machine in one table. To add a meme: drop files in public/memes and
 * public/sounds, then add a line here. Spare sounds live in public/sounds/_alternates.
 */
export const MEMES: MemeConfig[] = [
  // ── Hands ──
  { trigger: 'Thumb_Up', kind: 'hand', label: 'Thumbs up', emoji: '👍', caption: 'APPROVED.', media: { type: 'image', src: 'memes/thumbs-up.gif' }, sound: 'sounds/apple-pay.mp3' },
  { trigger: 'Thumb_Down', kind: 'hand', label: 'Thumbs down', emoji: '👎', caption: 'mission failed', media: { type: 'image', src: 'memes/thumbs-down.gif' }, sound: 'sounds/spongebob-fail.mp3' },
  { trigger: 'Victory', kind: 'hand', label: 'Peace sign', emoji: '✌️', caption: 'hee hee', media: { type: 'image', src: 'memes/peace.gif' }, sound: 'sounds/hee-hee.mp3' },
  { trigger: 'Pointing_Up', kind: 'hand', label: 'Point up', emoji: '☝️', caption: 'erm, actually…', media: { type: 'image', src: 'memes/nerd.gif' }, sound: 'sounds/erm-actually.mp3' },
  { trigger: 'Open_Palm', kind: 'hand', label: 'Open hand', emoji: '✋', caption: 'PURE JOY UNLOCKED', media: { type: 'image', src: 'memes/unicorn.gif' }, sound: 'sounds/anime-wow.mp3' },
  { trigger: 'Closed_Fist', kind: 'hand', label: 'Fist', emoji: '✊', caption: 'BONK', media: { type: 'image', src: 'memes/anvil.jpg' }, sound: 'sounds/metal-pipe.mp3' },
  { trigger: 'ILoveYou', kind: 'hand', label: 'Love-you sign', emoji: '🤟', caption: 'unspoken rizz', media: { type: 'image', src: 'memes/heart-eyes.jpg' }, sound: 'sounds/rizz.mp3' },
  { trigger: 'OK_Sign', kind: 'hand', label: 'OK sign', emoji: '👌', caption: 'FAHHHHHH', media: { type: 'image', src: 'memes/lollipop.gif' }, sound: 'sounds/fahhh.mp3' },

  // ── Face ──
  { trigger: 'Mouth_Open', kind: 'face', label: 'Open mouth wide', emoji: '😮', caption: 'OMG', media: { type: 'image', src: 'memes/omg.gif' }, sound: 'sounds/vine-boom.mp3' },
  { trigger: 'Smile', kind: 'face', label: 'Big smile', emoji: '😁', caption: 'he knows something', media: { type: 'image', src: 'memes/grin.gif' }, sound: 'sounds/fart.mp3' },
  { trigger: 'Brows_Up', kind: 'face', label: 'Raise eyebrows', emoji: '🤨', caption: 'suspicious…', media: { type: 'image', src: 'memes/eyebrow.jpg' }, sound: 'sounds/dun-dun-dun.mp3' },
  { trigger: 'Kiss', kind: 'face', label: 'Kiss lips', emoji: '😗', caption: 'romanceeee', media: { type: 'image', src: 'memes/kiss.gif' }, sound: 'sounds/romance.mp3' },
  { trigger: 'Frown', kind: 'face', label: 'Sad frown', emoji: '☹️', caption: 'emotional damage', media: { type: 'image', src: 'memes/crying.gif' }, sound: 'sounds/sad-violin.mp3' },
];

export const MEME_BY_TRIGGER = new Map(MEMES.map((m) => [m.trigger, m]));

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
