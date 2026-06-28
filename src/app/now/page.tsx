import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Now | Harshit Agarwal Portfolio',
  description: 'What Harshit Agarwal is working on and learning right now.',
  alternates: {
    canonical: 'https://aharshit123456.space/now',
  },
};

export default function NowPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">CURRENTLY_NOW</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>What I'm Doing Now</h1>
          <p>This is a "/now" page detailing my active projects, learning interests, and current focus.</p>
          
          <h2>Current Focus Areas</h2>
          <ul>
            <li><strong>Founding SDE & Tech Lead @ Famcare:</strong> Scaling full-stack ecosystems, optimizing socket relays, and background caregiver authentication workflows.</li>
            <li><strong>AI & Video Engineering @ endorphind:</strong> Building generative lip-sync adaptors (Wan 2.2/2.6, LatentSync) and custom ComfyUI workflows.</li>
            <li><strong>Academic Submissions:</strong> Refining and compiling Parkinson's gait time-series graphs for publication.</li>
          </ul>

          <h2>Active Learning & Experiments</h2>
          <ul>
            <li>Deepening knowledge of geometric deep learning, SE(3) transformers, and diffusion-based protein folding backbones.</li>
            <li>Optimizing local LLM deployment pipelines and running context length evaluations.</li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
