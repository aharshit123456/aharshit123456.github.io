import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artificial Intelligence | Harshit Agarwal Portfolio',
  description: 'AI research, machine learning pipelines, and deep neural network developments by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/ai',
  },
};

export default function AiClusterPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">AI_RESEARCH</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Artificial Intelligence & Deep Learning</h1>
          <p>Investigating core representations, attention rewiring, and scalable ML inference systems.</p>
          
          <h2>Key Domains</h2>
          <ul>
            <li><strong>Transformer Optimizations:</strong> Adapting self-attention filters to prioritize technical semantics for cyber-vulnerability forecasts.</li>
            <li><strong>Multimodal Vector Retrieval:</strong> Deploying large-scale CLIP embeddings on AWS SageMaker pipelines to serve catalog lookups across tens of millions of items.</li>
            <li><strong>Generative Video Adapters:</strong> Fine-tuning lip-sync adapters and pipeline nodes for ComfyUI.</li>
          </ul>

          <h2>Relevant Resources</h2>
          <p>
            Read about our published research at the <Link href="/papers">Publications Page</Link> or examine my open-source packages at the <Link href="/open-source">Open Source Page</Link>.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
