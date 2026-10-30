# 🐹 Brainrot Detector

Make a hand gesture or pull a face → a hamster meme slams onto the screen with its sound.
Runs entirely in the browser (MediaPipe on-device). No backend, nothing uploaded.

## Triggers

| Trigger | Meme | Sound |
|---|---|---|
| 👍 Thumbs up | thumbs-up hamster | Apple Pay ding |
| 👎 Thumbs down | thumbs-down hamster | SpongeBob fail |
| ✌️ Peace sign | double-peace hamster | MJ "hee hee" |
| ☝️ Point up | nerd hamster | "erm, actually" |
| ✋ Open hand | unicorn rider | anime wow |
| ✊ Fist | anvil bonk | metal pipe |
| 🤟 Love-you sign | heart-eyes hamster | rizz |
| 👌 OK sign | propeller + lollipop | FAHHHH |
| 😮 Mouth wide open | OMG hamster | vine boom |
| 😁 Big smile | grin hamster | fart |
| 🤨 Raised eyebrows | eyebrow hamster | dun dun dunnn |
| 😗 Kiss lips | kissy hamster | romanceeee |
| ☹️ Frown | crying hamster | sad violin |

Edit everything in [`src/config/memes.ts`](src/config/memes.ts). Spare sounds are in `public/sounds/_alternates/`.
Video memes are supported: `media: { type: 'video', src: 'memes/x.mp4' }, useVideoAudio: true`.

## Develop

```bash
npm install
npm run dev
```

Open the "Network" URL on your phone (same Wi-Fi). Note: phones only allow the camera over HTTPS,
so for real phone testing use the Vercel deploy (or `npx vite --host` behind an HTTPS tunnel).

Add `?debug` to the URL to see live gesture scores and face blendshape values (for tuning
thresholds in `src/detection/faceExpressions.ts`).

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On vercel.com → **Add New Project** → import the repo. Vercel detects Vite automatically
   (build `npm run build`, output `dist`). Click **Deploy**.
3. Send the `https://….vercel.app` link. That's it: open, allow camera, play.

Or from the terminal: `npx vercel --prod`.

## Credits

Hamster art by Alma ([@almarts27](https://www.instagram.com/almarts27)) and fan-made variants.
Sounds from Myinstants community uploads. Tracking by Google MediaPipe (Apache-2.0).
