import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Source | Harshit Agarwal Portfolio',
  description: 'Open source packages, libraries, and generative video tools authored by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/open-source',
  },
};

export default function OpenSourcePage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">OPEN_SOURCE</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Open Source Contributions</h1>
          <p>Maintained libraries, packages, and custom workflow additions.</p>
          
          <h2>gaitSetPy</h2>
          <p>
            An open-source Python library designed for clinical gait analysis. Features over 50 preprocessing utilities, signal filtering algorithms (butterworth, ICA), and models to predict freezing of gait and imbalance events.
          </p>
          <ul>
            <li><strong>Repository:</strong> <a href="https://github.com/Alohomora-Labs/gaitSetPy" target="_blank" rel="noopener noreferrer">github.com/Alohomora-Labs/gaitSetPy</a></li>
            <li><strong>Coverage:</strong> Validated on Daphnet and custom sensor logs with 97% accuracy.</li>
          </ul>

          <h2>ComfyUI Nodes</h2>
          <p>
            Custom node additions for ComfyUI toolchains to automate media rendering pipelines, supporting Wan 2.2/2.6 models and LatentSync voice/lip alignment.
          </p>

          <h2>PreviouslyOn TV Tracker</h2>
          <p>
            A fullstack social TV tracking platform utilizing Next.js, Supabase, and Gemini AI for review tracking and recommendation feeds.
          </p>
          <ul>
            <li><strong>Repository:</strong> <a href="https://github.com/aharshit123456/previouslyon" target="_blank" rel="noopener noreferrer">github.com/aharshit123456/previouslyon</a></li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
