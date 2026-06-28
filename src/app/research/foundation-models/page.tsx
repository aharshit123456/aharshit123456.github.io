import React from 'react';
import Link from 'next/link';
import '../../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Foundation Models Research | Harshit Agarwal',
  description: 'Optimizing transformers, rewiring self-attention mechanisms, and scaling multimodal VLLM systems.',
  alternates: {
    canonical: 'https://aharshit123456.space/research/foundation-models',
  },
};

export default function FoundationModelsPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/research" className="back-link">
          Back to Research
        </Link>
        <div className="nav-logo">FOUNDATION_MODELS</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Foundation Models</h1>
          <p>Analyzing and optimizing the core architectures of Large Language Models (LLMs) and Multimodal models.</p>
          
          <h2>Rewiring Transformers</h2>
          <p>
            Investigated methods to "rewire" internal self-attention mechanics of transformers to optimize for specialized regression tasks. In this research, we adapted attention masks to prioritize technical terminology over generic syntactic words in cybersecurity texts, optimizing vulnerability analysis.
          </p>
          <ul>
            <li>Implemented custom attention heads in PyTorch.</li>
            <li>Modified context weightings to prevent degradation on long context sequences.</li>
          </ul>

          <h2>Multimodal Infrastructure & Serving</h2>
          <p>
            Deployed and managed production LLM/VLLM systems for automated tasks at scale:
          </p>
          <ul>
            <li><strong>shoppin' AI stack:</strong> Integrated and deployed CLIP/VLLM models to handle semantic matching across catalogs of 30-40 million items. Deployed these instances on AWS SageMaker.</li>
            <li><strong>endorphind Video Generation:</strong> Built pipelines using Wan 2.2/2.6, LatentSync, and InfiniteTalk (GGUF) for generative avatar lip-syncing and video rendering.</li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
