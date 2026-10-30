import { MEMES, asset } from '../config/memes';

export function CheatSheet({ onClose }: { onClose: () => void }) {
  const sections = [
    { title: 'HANDS', items: MEMES.filter((m) => m.kind === 'hand') },
    { title: 'FACE', items: MEMES.filter((m) => m.kind === 'face') },
  ];
  return (
    <div className="fade-in fixed inset-0 z-50 flex flex-col bg-void/95" role="dialog" aria-label="All memes">
      <div className="safe-top flex items-center justify-between border-b border-neon/30 px-4 pb-3">
        <h2 className="neon-text font-display text-xl">CHEAT SHEET</h2>
        <button onClick={onClose} className="rounded-xl border border-neon/60 px-4 py-2 text-neon active:scale-95">
          CLOSE ✕
        </button>
      </div>
      <div className="safe-bottom flex-1 overflow-y-auto px-4 pt-4">
        <p className="mb-4 text-xs text-white/60">Hold a pose for about a second. One hand is enough. Face tricks work best with big, exaggerated expressions.</p>
        {sections.map((s) => (
          <section key={s.title} className="mb-6">
            <h3 className="mb-2 text-xs tracking-[0.3em] text-neon/70">{s.title}</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {s.items.map((m) => (
                <li key={m.trigger} className="overflow-hidden rounded-2xl border border-neon/25 bg-panel">
                  <img src={asset(m.media.src)} alt="" className="aspect-square w-full bg-white object-contain" loading="lazy" />
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-sm leading-tight">{m.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="pb-6 text-center text-[11px] text-white/40">Hamster art by Alma (@almarts27) and fans · sounds via Myinstants</p>
      </div>
    </div>
  );
}
