import React from 'react';
import type { Stop } from './RideMap';

const SHOW = new Set(['food', 'city', 'dest', 'offroad']);
const ICON: Record<string, string> = { food: '🍴', city: '🏙️', dest: '⛪', offroad: '🥾', toll: '🧾' };

/** A short guide to the stops worth making if you ride this route. No prices — just places to pull over. */
export default function RideTimeline({ stops }: { stops: Stop[] }) {
  const steps = stops.filter((s) => SHOW.has(s.kind));
  if (!steps.length) return null;
  return (
    <section className="rt-wrap">
      <div className="rt-inner">
        <p className="rt-kick">If you ride this</p>
        <h2 className="rt-title">Where to pull over</h2>
        <p className="rt-lede">
          The good breaks along the way &mdash; a highway chai, a proper meal, and the sights at the far end.
          Tap any of them on the map above to open it in Maps.
        </p>
      </div>
      <ol className="rt-list">
        {steps.map((s, i) => (
          <li key={i} className={`rt-step rt-${s.kind}`}>
            <div className="rt-card">
              <span className="rt-ic" aria-hidden="true">{ICON[s.kind] || '📍'}</span>
              {s.label && <span className="rt-label">{s.label}</span>}
              <span className="rt-name">{s.name}</span>
              {(s.treat || s.note) && <p className="rt-note">{s.treat || s.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
