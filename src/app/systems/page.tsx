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
          
          <h2>Architecture Decision (Day 0)</h2>
          <p>
            Most people treat architecture as a day 300 problem. It's not. It's a day 0 decision. Go with a modular monolith first instead of over-engineered microservices. 
            Smart service layers, clean repositories, and intentional abstractions. Observability and determinism (Sentry logging, Alembic migrations) must be baked in from the start.
            This structural discipline keeps development clean, ensuring devs know exactly where to look: service, repository, model.
          </p>

          <h2>Self-Hosted Routing Infrastructure (OSRM)</h2>
          <p>
            We cut routing API costs to basically zero and achieved sub-millisecond ETAs in the process. Instead of polling expensive commercial APIs every 20 seconds for active trip tracking, we self-hosted OSRM as a sidecar container sitting right next to the API service inside the same ECS task.
          </p>
          <ul>
            <li><strong>Localhost Queries:</strong> Zero external calls, zero bill, single-digit millisecond latency.</li>
            <li><strong>Custom Traffic Heuristics:</strong> Layered time-of-day multipliers and static penalties for key Bangalore junctions (Silk Board, Tin Factory, Kundalahalli Gate) to match real-world traffic profiles.</li>
            <li><strong>Graceful Fallbacks:</strong> Instant fallback to straight-line distance if the container experiences hiccups, ensuring routing never blocks bookings.</li>
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
