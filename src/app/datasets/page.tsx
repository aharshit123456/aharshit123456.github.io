import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datasets | Harshit Agarwal Portfolio',
  description: 'Curated and published datasets for AI research, gait analysis, and exploit forecasting.',
  alternates: {
    canonical: 'https://aharshit123456.space/datasets',
  },
};

export default function DatasetsPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">DATASETS</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Datasets</h1>
          <p>Curated datasets and corpora developed or structured during research work.</p>
          
          <h2>NVD Exploit Likelihood Corpus</h2>
          <p>
            A compilation of over 56,000 security vulnerability descriptions annotated with corresponding EPSS (Exploit Prediction Scoring System) likelihood scores and verified exploit release statuses. Used for fine-tuning NLP classification pipelines.
          </p>

          <h2>Parkinson's Wearable Sensor Logs</h2>
          <p>
            Multi-axis accelerometer and gyroscope time-series logs capturing gait imbalances and annotated freezing of gait (FOG) event tags, curated and formatted for graph message-passing models.
          </p>

          <h2>Lexical Analysis EEG Trials</h2>
          <p>
            A dataset of raw and filtered EEG signals collected using a 14-channel Emotiv headband during lexical analysis cognitive tasks. The trials are preprocessed (ICA, Bandpass filtering) and annotated to study working-memory retrieval and cognitive load during visual language stimulus presentation.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
