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

          <h2>shoppin' Fashion Search & Model Training</h2>
          <p>
            Building a fashion discovery search lens that maps snap-to-search items compared across 10 websites. 
            Designed and benchmarked 10-12 image search methods with full performance metrics.
          </p>
          <ul>
            <li><strong>Model Training:</strong> Ran model training on extensive image sets to construct search matching.</li>
            <li><strong>Cosplay Search Node:</strong> Designed a cosplay search extension feeding characters to extract and match coordinates for clothes across the web.</li>
            <li><strong>Multimodal Vector Ingestion:</strong> Managed large-scale product catalogs matching 3-4 crore catalog items using CLIP embedding models, deployed on AWS SageMaker pipelines.</li>
          </ul>
          
          <h2>Transformer Optimizations</h2>
          <p>
            Adapted attention mechanics inside transformer-based architectures (DistilBERT, GPT-2) to prioritize technical semantics and vulnerability text reports, improving cyber-vulnerability exploit prediction accuracy to 85.6%.
          </p>

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
