import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import './rides.css';
import SP160Showcase from './SP160Showcase';

const SITE_URL = 'https://www.aharshit123456.space';

type Ride = {
  slug: string; title: string; date: string; description: string;
  distance?: string; route?: string; bike?: string; emoji?: string;
};

function getRides(): Ride[] {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'public/rides/rides.json'), 'utf8');
    return (JSON.parse(raw) as Ride[]).sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch { return []; }
}

export const metadata: Metadata = {
  title: 'The Ride Log — Harshit Agarwal',
  description: 'Motorcycle trips, rented bikes and places worth the ride — mapped, with every stop.',
  alternates: { canonical: `${SITE_URL}/rides` },
  openGraph: { title: 'The Ride Log — Harshit Agarwal', description: 'Roads I have ridden.', url: `${SITE_URL}/rides`, type: 'website' },
};

export default function RidesIndex() {
  const rides = getRides();
  return (
    <div className="ridelog">
      <nav className="ridelog-nav">
        <Link href="/" className="ride-back">← Back to Desktop</Link>
        <span className="ride-badge">THE RIDE LOG</span>
      </nav>

      <header className="ridelog-head">
        <div className="ridelog-head-text">
          <h1>The Ride Log</h1>
          <p>Every road mapped, every stop worth making. A work in progress.</p>
        </div>
      </header>

      <SP160Showcase />

      <main className="ridelog-list">
        {rides.map((r, i) => (
          <Link key={r.slug} href={`/rides/${r.slug}`} className="ridelog-card">
            <span className="ridelog-no">{String(i + 1).padStart(2, '0')}</span>
            <div className="ridelog-card-body">
              <h2>{r.title}</h2>
              <p>{r.description}</p>
              <div className="ridelog-meta">
                {r.bike && <span className="ridelog-chip">{r.bike}</span>}
                {r.distance && <span className="ridelog-chip red">{r.distance}</span>}
                {r.route && <span className="ridelog-chip">{r.route}</span>}
              </div>
            </div>
          </Link>
        ))}
        {rides.length === 0 && <p>No rides written up yet. Soon.</p>}
      </main>
      <footer className="ridelog-foot">© 2026 Harshit Agarwal · ride safe.</footer>
    </div>
  );
}
