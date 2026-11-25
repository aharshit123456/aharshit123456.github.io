import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Studies | Harshit Agarwal Portfolio',
  description: 'Deep-dive case studies: the Building FamCare series (voice agent, system design, slots and pricing), plus the FamCARE marketplace, shoppin\' AI discovery, and WHAM! OTT video engine.',
  alternates: {
    canonical: 'https://aharshit123456.space/case-studies',
  },
};

const FAMCARE_STUDIES = [
  {
    slug: 'voice-agent',
    title: '1. A Voice Agent That Only Drafts',
    summary:
      'Parents talk for three minutes instead of filling a form. The LLM proposes, the parent confirms, and nothing it says can change a child\'s record on its own. Covers the cost model, model evals, and fallbacks.',
  },
  {
    slug: 'system-design',
    title: '2. A Care Marketplace on One Boring Backend',
    summary:
      'One backend, four apps, a booking state machine, real-time channels per role, a Terraform import of hand-built production, staging on a shared load balancer, over-the-air patches, and feature flags.',
  },
  {
    slug: 'slots-and-pricing',
    title: '3. Honest Slots, Priced Idle Time',
    summary:
      'Making every screen agree on who can take a booking, proving it with 270 YAML scenarios on a real database, then pricing idle hours with price drops and evening flash sales.',
  },
];

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

          <h2>Building FamCare: a three-part series</h2>
          <p>
            Long-form write-ups of systems I built as Lead Engineer at FamCare, a home-care marketplace:
            the problem, the design, the alternatives we rejected, what broke, and what we got out of it.
          </p>
          {FAMCARE_STUDIES.map((study) => (
            <section key={study.slug}>
              <h3>{study.title}</h3>
              <p>{study.summary}</p>
              <p>
                <Link href={`/blog/famcare-${study.slug}`}>Read the post</Link>
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
