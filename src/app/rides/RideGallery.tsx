'use client';

import React, { useEffect, useState } from 'react';

export type Shot = { src: string; cap: string };

export default function RideGallery({ shots }: { shots: Shot[] }) {
  const [i, setI] = useState<number | null>(null);
  const go = (d: number) => setI((v) => (v === null ? v : (v + d + shots.length) % shots.length));

  useEffect(() => {
    if (i === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setI(null);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [i, shots.length]);

  if (!shots?.length) return null;

  return (
    <section className="gal-wrap">
      <div className="gal-inner">
        <p className="rt-kick">From the road</p>
        <h2 className="rt-title">The gallery</h2>
      </div>
      <div className="gal-grid">
        {shots.map((s, idx) => (
          <button key={idx} className="gal-item" onClick={() => setI(idx)} aria-label={s.cap}>
            <img src={s.src} alt={s.cap} loading="lazy" />
            <span className="gal-cap">{s.cap}</span>
          </button>
        ))}
      </div>

      {i !== null && (
        <div className="gal-modal" role="dialog" aria-modal="true" onClick={() => setI(null)}>
          <button className="gal-close" onClick={() => setI(null)} aria-label="Close">×</button>
          <button className="gal-arrow gal-prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous">‹</button>
          <figure className="gal-figure" onClick={(e) => e.stopPropagation()}>
            <img src={shots[i].src} alt={shots[i].cap} />
            <figcaption>{shots[i].cap} <span>({i + 1}/{shots.length})</span></figcaption>
          </figure>
          <button className="gal-arrow gal-next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next">›</button>
        </div>
      )}
    </section>
  );
}
