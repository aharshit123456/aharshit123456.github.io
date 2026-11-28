'use client';

import { useState } from 'react';

type Table = {
  id: string;
  name: string;
  tag: string;
  src: string;
};

const TABLES: Table[] = [
  { id: 'sabzi', name: 'Sabzi Market Run', tag: 'CB350 · Bengaluru street dash', src: '/arcade/sabzi-run/index.html' },
  { id: 'banzai', name: 'Banzai Run', tag: 'Williams 1988 replica · Banzai Hill', src: '/arcade/banzai-run/index.html' },
  { id: 'harley', name: 'Harley-Davidson', tag: 'Milwaukee Iron · V-Twin · the Strip', src: '/arcade/harley-run/index.html' },
];

export default function PinballArcade() {
  const [active, setActive] = useState<string>(TABLES[0].id);
  const table = TABLES.find((t) => t.id === active) ?? TABLES[0];

  return (
    <div className="pinball-arcade">
      <div className="pinball-tabs">
        {TABLES.map((t) => (
          <button
            key={t.id}
            className={`pinball-tab ${t.id === active ? 'active' : ''}`}
            onClick={() => setActive(t.id)}
            title={t.tag}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="pinball-stage">
        <iframe
          key={table.id}
          src={table.src}
          title={table.name}
          className="pinball-frame"
          scrolling="no"
          tabIndex={0}
        />
      </div>
      <div className="pinball-caption">{table.name} — {table.tag}</div>
    </div>
  );
}
