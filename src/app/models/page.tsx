import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Models | Harshit Agarwal Portfolio',
  description: 'Trained deep learning model weights, fine-tuned transformer checkpoints, and inference pipelines.',
  alternates: {
    canonical: 'https://aharshit123456.space/models',
  },
};

export default function ModelsPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">MODELS</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Trained Deep Learning Models</h1>
          <p>Fine-tuned model checkpoints, weights, and specialized neural network pipelines.</p>
          
          <h2>Exploitability Prediction Transformers</h2>
          <p>
            Fine-tuned checkpoints of <strong>DistilBERT</strong> and <strong>GPT-2</strong> architectures trained on the NVD Exploit Likelihood Corpus to classify raw vulnerability descriptions into exploit probability percentiles.
          </p>

          <h2>PD Gait Classifier GCN</h2>
          <p>
            Weights for a <strong>Graph Convolutional Network (GCN)</strong> designed to identify Parkinson's Disease gait anomalies and FOG precursors from 3D sensor graph topology streams.
          </p>

          <h2>Wan 2.2/2.6 Lip-Sync Adapter</h2>
          <p>
            Optimized configurations and ComfyUI pipeline definitions for avatar lip-sync inference using LatentSync and F5 voice cloning adapters.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
