import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';
import { FAMCARE_SERIES } from '../blog/seriesData';

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'Deep-dive case studies: the nine-part Building FamCare series (system design, slots and pricing, golden screens, Flutter OTA, alerting, voice AI, live captions, demand analytics, CRM), plus the FamCARE marketplace, shoppin\' AI discovery, and WHAM! OTT video engine.',
  alternates: {
    canonical: 'https://www.aharshit123456.space/case-studies',
  },
};

const FAMCARE_STUDIES = FAMCARE_SERIES.map((post, i) => ({ ...post, title: `${i + 1}. ${post.title}` }));

export default function CaseStudiesPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">CASE_STUDIES</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Case Studies</h1>
          <p>Architectural deep dives into production-grade systems and AI infrastructure.</p>

          <h2>Building FamCare: a nine-part series</h2>
          <p>
            Long-form write-ups of systems I built as Lead Engineer at FamCare, a home-care marketplace:
            the problem, the design, the alternatives we rejected, what broke, and what we got out of it.
          </p>
          {FAMCARE_STUDIES.map((study) => (
            <section key={study.slug}>
              <h3>{study.title}</h3>
              <p>{study.summary}</p>
              <p>
                <Link href={`/blog/${study.slug}`}>Read the post</Link>
              </p>
            </section>
          ))}

          <h2>Earlier work</h2>
          
          <h3>FamCARE: Hyper-Local Service Marketplace Architecture</h3>
          <p>
            An in-depth analysis of how we built a modular monolith using FastAPI and PostgreSQL to coordinate customers, caregivers, and managers. 
          </p>
          <ul>
            <li><strong>Ghost Assignment Prevention:</strong> Implemented atomic proposals and Redis-backed reservations with 180-second TTL cleanup task schedulers.</li>
            <li><strong>Real-Time Broadcasts:</strong> Built a WebSocket system backed by a Redis Pub/Sub backplane to synchronize state changes across clients in under 300ms.</li>
            <li><strong>Stress Testing:</strong> Benchmarked the system to handle 2,000+ requests/minute under 100 concurrent operational slots.</li>
          </ul>

          <h3>shoppin&apos;: Large Scale Multimodal Search Infrastructure</h3>
          <p>
            How we scaled ML ingestion and retrieval to serve 30-40 million fashion catalog items.
          </p>
          <ul>
            <li><strong>Multimodal CLIP Retrieval:</strong> Deployed CLIP/VLLM vector index pipelines on AWS SageMaker with Redis cache overlays.</li>
            <li><strong>GitOps & Rancher:</strong> Configured AWS EKS clusters using Terraform, enabling automated failover and zero-downtime deployment pipelines.</li>
          </ul>

          <h3>WHAM! OTT: Hybrid Video Stream Engine</h3>
          <p>
            Engineering a hybrid video playback client with comic-book UI layouts and postMessage sync layers.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
