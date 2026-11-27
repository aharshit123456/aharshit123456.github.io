import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import '../../blog/blog.css';
import '../rides.css';
import InteractiveArticle from '@/components/portfolio/InteractiveArticle';
import JourneyClient from '../JourneyClient';
import RideGallery, { type Shot } from '../RideGallery';
import type { Stop } from '../RideMap';

const SITE_URL = 'https://www.aharshit123456.space';
const RIDES_DIR = path.join(process.cwd(), 'public/rides');

type Ride = {
  slug: string; title: string; date: string; description: string;
  distance?: string; route?: string; bike?: string; emoji?: string; keywords?: string[];
  map?: { fit?: [[number, number], [number, number]]; stops: Stop[] };
  gallery?: Shot[];
};

function getRide(slug: string): { content: string; meta?: Ride } | null {
  const filePath = path.join(RIDES_DIR, `${slug}.md`);
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    let meta: Ride | undefined;
    try {
      const idx: Ride[] = JSON.parse(fs.readFileSync(path.join(RIDES_DIR, 'rides.json'), 'utf8'));
      meta = idx.find((r) => r.slug === slug);
    } catch { /* index optional */ }
    return { content, meta };
  } catch { return null; }
}

export async function generateStaticParams() {
  try {
    return fs.readdirSync(RIDES_DIR).filter((f) => f.endsWith('.md')).map((f) => ({ slug: f.replace('.md', '') }));
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ride = getRide(slug);
  if (!ride) return { title: 'Ride Not Found' };
  const titleMatch = ride.content.match(/^# (.*)/m);
  const title = ride.meta?.title || (titleMatch ? titleMatch[1] : 'A Ride');
  const description = ride.meta?.description || 'A motorcycle story from Harshit Agarwal.';
  const url = `${SITE_URL}/rides/${slug}`;
  return {
    title: `${title} — Rides`, description,
    alternates: { canonical: url }, keywords: ride.meta?.keywords,
    openGraph: { title, description, url, type: 'article', siteName: 'Harshit Agarwal Portfolio', publishedTime: ride.meta?.date },
    twitter: { card: 'summary_large_image', title, description, creator: '@aharshit123456' },
    authors: [{ name: 'Harshit Agarwal', url: SITE_URL }],
  };
}

export default async function RidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ride = getRide(slug);

  if (!ride) {
    return (
      <div className="rides-outer">
        <nav className="rides-nav"><Link href="/rides" className="back-link">← All rides</Link></nav>
        <div className="rides-article"><h1>Ride not found</h1><p>This story has not been written yet.</p></div>
      </div>
    );
  }

  const dateStr = ride.meta?.date
    ? new Date(ride.meta.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : undefined;

  const stops = ride.meta?.map?.stops ?? [];
  const dirUrl = stops.length > 1
    ? `https://www.google.com/maps/dir/${stops.map((s) => `${s.lat},${s.lng}`).join('/')}`
    : undefined;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: ride.meta?.title, description: ride.meta?.description,
    url: `${SITE_URL}/rides/${slug}`, inLanguage: 'en-US',
    ...(ride.meta?.date ? { datePublished: ride.meta.date } : {}),
    author: { '@type': 'Person', name: 'Harshit Agarwal', url: `${SITE_URL}/` },
  };

  return (
    <div className="ride-page">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* clean editorial hero */}
      <header className="ed-hero">
        <div className="ed-hero-inner">
          <div className="ed-hero-text">
            <Link href="/rides" className="ed-back">← All rides</Link>
            <p className="ed-kick"><span>Ride Log 01</span>{dateStr}</p>
            <h1>{ride.meta?.title}</h1>
            <p className="ed-sub">A solo birthday ride from a sleeping Bengaluru out to the church at Shettihalli and back &mdash; {ride.meta?.distance}, on a rented {ride.meta?.bike}.</p>
            <dl className="ed-meta">
              <div><dt>{ride.meta?.distance}</dt><dd>in a day</dd></div>
              <div><dt>13</dt><dd>stops</dd></div>
              <div><dt>1</dt><dd>drowned church</dd></div>
            </dl>
          </div>
          <div className="ed-hero-bike">
            <img src="/assets/rides/cb350-static.png" alt="The rented Honda CB350" />
            <span className="ed-bike-cap">The ride for the day</span>
          </div>
        </div>
      </header>

      {/* INTERACTIVE JOURNEY: step through the route, stop by stop */}
      <section className="journey-section reveal" id="ride-route">
        {ride.meta?.map && <JourneyClient stops={ride.meta.map.stops} fit={ride.meta.map.fit} />}
        {dirUrl && (
          <div className="journey-foot">
            <span className="map-foot-hint">prefer to just ride it?</span>
            <a className="ride-dir" href={dirUrl} target="_blank" rel="noopener noreferrer">
              Open the full route in Google Maps →
            </a>
          </div>
        )}
      </section>

      {/* STORY SPREAD: article column + data sidebar */}
      <section className="story-spread reveal">
        <article className="ride-body">
          <div className="markdown-body">
            <InteractiveArticle content={ride.content.replace(/^#\s.*\r?\n/, '')} slug={slug} />
          </div>
          <p className="ride-foot"><Link href="/rides">← back to all rides</Link></p>
        </article>
        <aside className="story-side">
          <div className="side-card reveal side-bike">
            <img src="/assets/rides/cb350-static.png" alt="The rented Honda CB350" />
            <span className="side-cap">The ride for the day — a rented Honda CB350</span>
          </div>
          <div className="side-card reveal side-facts">
            <h4>The run</h4>
            <ul>
              <li><b>~600</b><span>km in a day</span></li>
              <li><b>48 h</b><span>rental window</span></li>
              <li><b>₹4,033</b><span>all-in, fine included</span></li>
              <li><b>1</b><span>drowned church</span></li>
            </ul>
          </div>
        </aside>
      </section>

      {ride.meta?.gallery && <RideGallery shots={ride.meta.gallery} />}
    </div>
  );
}
