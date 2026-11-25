import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import './blog.css';
import { Metadata } from 'next';
import { Figtree, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Sans, Instrument_Serif, Outfit } from 'next/font/google';
import SeriesJourney from './SeriesJourney';
import { liveJourneys } from './postNav';

const figtree = Figtree({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-figtree' });
const instrumentSans = Instrument_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-instrument-sans' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-instrument-serif' });
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-plex-mono' });
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-outfit' });

/** Reading time per series post (about 230 words a minute). */
function seriesReadMinutes(blogsDirectory: string): Record<string, number> {
  const minutes: Record<string, number> = {};
  const slugs = liveJourneys().flatMap((j) => j.stages.flatMap((s) => s.posts.map((p) => p.slug)));
  for (const slug of slugs) {
    if (!slug) continue;
    try {
      const md = fs.readFileSync(path.join(blogsDirectory, `${slug}.md`), 'utf8');
      const words = md.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
      minutes[slug] = Math.max(1, Math.round(words / 230));
    } catch {
      // Missing file: card shows no reading time.
    }
  }
  return minutes;
}

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest blog posts and research articles by Harshit Agarwal.',
  alternates: {
    canonical: 'https://www.aharshit123456.space/blog',
    types: { 'application/rss+xml': [{ url: 'https://www.aharshit123456.space/feed.xml', title: 'Harshit Agarwal Tech Blog' }] },
  },
};

export default async function BlogIndexPage() {
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  let blogs: { slug: string; title: string; date?: string }[] = [];
  try {
    const blogsJsonPath = path.join(blogsDirectory, 'blogs.json');

    if (fs.existsSync(blogsJsonPath)) {
      blogs = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf8'));
    } else {
      const files = fs.readdirSync(blogsDirectory);
      blogs = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          slug: file.replace('.md', ''),
          title: file.replace('.md', '').replace(/-/g, ' '),
          date: '',
        }));
    }
  } catch (error) {
    console.error("Error reading blogs:", error);
  }

  const readMinutes = seriesReadMinutes(blogsDirectory);

  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">TECH_BLOG</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Tech Blog</h1>
          <p>Writing about fullstack systems, artificial intelligence, computer vision, and theoretical physics.</p>
        </article>

        {liveJourneys()
          // Hide a series until at least one of its posts exists.
          .filter((series) => series.stages.some((stage) => stage.posts.some((p) => p.slug)))
          .map((series) => (
          <SeriesJourney
            key={series.id}
            series={series}
            readMinutes={readMinutes}
            fontClassName={`${figtree.variable} ${instrumentSans.variable} ${instrumentSerif.variable} ${plexSans.variable} ${plexMono.variable} ${outfit.variable}`}
          />
        ))}

        <article className="article-card markdown-body">
          <div className="blog-list" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {blogs.map((blog) => (
              <div key={blog.slug} className="blog-item" style={{ borderBottom: '1px solid rgba(255, 77, 77, 0.1)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  {blog.date && (
                    <span className="date" style={{ color: 'var(--accent-color)', fontSize: '14px', fontFamily: 'monospace' }}>
                      [{blog.date}]
                    </span>
                  )}
                  <Link href={`/blog/${blog.slug}`} className="blog-link" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {blog.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
