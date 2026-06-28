import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Speaking & Talks | Harshit Agarwal Portfolio',
  description: 'Lectures, tech talks, and conference presentations by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/speaking',
  },
};

export default function SpeakingPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">SPEAKING_TALKS</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Talks & Presentation Logs</h1>
          <p>Academic lectures, local tech chapter presentations, and workshop logs.</p>
          
          <h2>Featured Presentations</h2>
          <ul>
            <li><strong>Introduction to Diffusion Models (DDPM):</strong> Hosted at Microsoft Learn Student Ambassador - KIIT Chapter. Covered forward/backward transition kernels, noise estimation networks, and PyTorch implementations.</li>
            <li><strong>Scaling Async Monoliths with Redis:</strong> Local developer talk detailing socket pub/sub relays and distributed task locking patterns implemented at Famcare.</li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
