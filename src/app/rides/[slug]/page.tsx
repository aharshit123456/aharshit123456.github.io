import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import '../../blog/blog.css';
import '../rides.css';
import InteractiveArticle from '@/components/portfolio/InteractiveArticle';
import MapHero from '../MapHero';
import RideTimeline from '../RideTimeline';
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

      {/* full-bleed real map hero */}
      <section className="ride-hero">
        {ride.meta?.map && <MapHero stops={ride.meta.map.stops} fit={ride.meta.map.fit} />}
        <div className="ride-hero-top">
          <Link href="/rides" className="ride-back">← All rides</Link>
          <span className="ride-badge">THE RIDE LOG</span>
        </div>
        <div className="ride-hero-title">
          {dateStr && <p className="ride-kick">{dateStr} · {ride.meta?.route}</p>}
          <h1>{ride.meta?.title}</h1>
          <p className="ride-hero-sub">{ride.meta?.distance} · on a {ride.meta?.bike} · tap a pin, or scroll for the stops worth making</p>
          {dirUrl && (
            <a className="ride-dir" href={dirUrl} target="_blank" rel="noopener noreferrer">
              🧭 Open the full route in Google Maps →
            </a>
          )}
        </div>
      </section>

      {ride.meta?.map?.stops && <RideTimeline stops={ride.meta.map.stops} />}

      {ride.meta?.gallery && <RideGallery shots={ride.meta.gallery} />}

      <article className="ride-body">
        <div className="markdown-body">
          <InteractiveArticle content={ride.content.replace(/^#\s.*\r?\n/, '')} slug={slug} />
        </div>
        <p className="ride-foot"><Link href="/rides">← back to all rides</Link></p>
      </article>
    </div>
  );
}
