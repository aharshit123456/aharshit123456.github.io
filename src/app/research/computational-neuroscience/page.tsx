import React from 'react';
import Link from 'next/link';
import '../../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Computational Neuroscience Research | Harshit Agarwal',
  description: 'Deep Learning models applied to Parkinson\'s gait analysis, Alzheimer\'s progression, and EEG signal decoding.',
  alternates: {
    canonical: 'https://aharshit123456.space/research/computational-neuroscience',
  },
};

export default function ComputationalNeurosciencePage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/research" className="back-link">
          Back to Research
        </Link>
        <div className="nav-logo">COMPUTATIONAL_NEUROSCIENCE</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Computational Neuroscience</h1>
          <p>Modeling and decoding complex biological neural dynamics using spatial-temporal graph models and convolutional architectures.</p>
          
          <h2>Parkinson's Disease & Gait Dynamics</h2>
          <p>
            Collaborating with Dr. Jayeeta Chakraborty at Alohomora Labs, we focused on detecting and predicting **Freezing of Gait (FOG)** events in Parkinson's Disease patients.
          </p>
          <ul>
            <li><strong>gaitSetPy:</strong> Built an open-source Python library for high-throughput gait feature preprocessing and modeling.</li>
            <li><strong>Graph Neural Networks (GNNs):</strong> Modeled joint connections and acceleration metrics over graph networks to capture spatial relationships.</li>
            <li><strong>CNN-LSTM Fusion:</strong> Combined spatial feature extraction from sensor streams with sequential temporal dependencies, achieving a 97% classification accuracy.</li>
          </ul>

          <h2>EEG Working Memory & Affective States</h2>
          <p>
            Conducted research in NISER & Sensing and Computing Lab using **14-channel Emotiv EEG systems** to capture and classify human working-memory and lexical processing states.
          </p>
          <ul>
            <li>Designed and coded PsychoPy trials for stimulus orchestration.</li>
            <li>Preprocessed raw EEG signals using ICA (Independent Component Analysis) and Bandpass filtering to isolate alpha, beta, and theta bands.</li>
            <li>Constructed deep classifier architectures to map neurological frequency changes to specific cognitive stress levels.</li>
          </ul>

          <h2>Alzheimer's Disease Diagnostic Models</h2>
          <p>
            Developing prediction systems for Alzheimer's progression through multimodal imaging and cognitive metrics. By leveraging Graph Convolutional Networks (GCNs) on structural MRI connectomes, we aim to map neural pathway degradation over time to assist in early clinical diagnoses.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
