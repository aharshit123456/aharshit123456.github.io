'use client';

import React, { useEffect, useState } from 'react';

/** The owner's current bike. A banner on the index that opens a centered showcase. */
export default function SP160Showcase() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <section className="sp160-wrap">
      <button className="sp160-card" onClick={() => setOpen(true)} aria-label="My current bike: Honda SP160. Tap to view.">
        <img src="/assets/rides/sp160.png" alt="Honda SP160" className="sp160-thumb" />
        <span className="sp160-cardtext">
          <span className="sp160-kick">My current ride</span>
          <span className="sp160-name">Honda SP160</span>
          <span className="sp160-tap">12,000 km · since Jan 2026 · tap to view →</span>
        </span>
      </button>

      {open && (
        <div className="sp160-modal" role="dialog" aria-modal="true" aria-label="Honda SP160" onClick={() => setOpen(false)}>
          <div className="sp160-stage" onClick={(e) => e.stopPropagation()}>
            <button className="sp160-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            <img src="/assets/rides/sp160.png" alt="Honda SP160" className="sp160-big" />
            <div className="sp160-specs">
              <p className="sp160-kick">The daily</p>
              <h3>Honda SP160</h3>
              <p className="sp160-sub">My own bike, back home in Cuttack. Not the one in these stories &mdash; those are rentals &mdash; but the one that does the real miles.</p>
              <ul className="sp160-stats">
                <li><b>12,000</b><span>km and counting</span></li>
                <li><b>Jan&nbsp;2026</b><span>on the road since</span></li>
              </ul>
              <div className="sp160-pred">
                <img src="/assets/rides/kamshot.png" alt="Kamshot, the white Honda Activa" />
                <div>
                  <b>Replaced &ldquo;Kamshot&rdquo;</b>
                  <span>a very old white Activa that earned its retirement.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
