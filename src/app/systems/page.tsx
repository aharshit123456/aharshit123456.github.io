import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Systems Engineering | Harshit Agarwal Portfolio',
  description: 'Distributed systems, high-performance backends, and cloud orchestration architectures by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/systems',
  },
};

export default function SystemsClusterPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">SYSTEMS_ENGINEERING</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Systems Design & Distributed Architectures</h1>
          <p>Engineering robust, transaction-safe monolithic and microservice systems that scale.</p>
          
          <h2>Key Architectures</h2>
          <ul>
            <li><strong>Modular Monoliths:</strong> Designing isolatable modules mapped out to accommodate the Strangler Pattern for progressive microservice transition.</li>
            <li><strong>WebSocket Pub/Sub:</strong> Engineering real-time connection routers using Redis message backplanes.</li>
            <li><strong>Self-Hosted Infrastructure:</strong> Running OSRM engines and Rancher dashboard systems locally to optimize cloud hosting costs.</li>
          </ul>

          <h2>Relevant Materials</h2>
          <p>
            Explore our architectural breakdowns at the <Link href="/case-studies">Case Studies Page</Link> or check my setups at the <Link href="/uses">Uses Page</Link>.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
