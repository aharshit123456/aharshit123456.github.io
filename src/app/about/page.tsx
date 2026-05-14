'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="about-wrapper">
      <div className="nebula"></div>
      <div className="about-content">
        <div className="terminal-card">
          <div className="terminal-header">
            <div className="dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="terminal-title">aharshit123456@space: ~about</div>
          </div>
          <div className="terminal-body">
            <p className="line"><span className="prompt">$</span> whoami</p>
            <p className="response">Harshit Agarwal. A carbon-based lifeform obsessed with silicon logic.</p>
            
            <p className="line"><span className="prompt">$</span> cat mission.txt</p>
            <p className="response">Building scalable AI systems that actually solve human problems, not just benchmarks.</p>
            
            <p className="line"><span className="prompt">$</span> ls skills/</p>
            <p className="response">FastAPI, Flutter, Python, React, Next.js, SystemDesign, ML_Pipelines</p>
            
            <div className="bio-text">
              <p>Hey there! I'm Harshit. I spend my time at the intersection of product engineering and research. Currently leading the technical ecosystem at <strong>Famcare</strong> and architecting visual AI at <strong>shoppin'</strong>.</p>
              <p>When I'm not coding, you can find me practicing kickboxing or deep-diving into the latest generative AI papers.</p>
            </div>
            
            <p className="line blink"><span className="prompt">$</span> _</p>
          </div>
        </div>
        
        <Link href="/" className="back-btn">
          <i className="fas fa-arrow-left"></i> Return to the OS
        </Link>
      </div>

      <style jsx>{`
        .about-wrapper {
          min-height: 100vh;
          background: #050505;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          color: #f0f0f0;
          font-family: 'Fira Code', monospace;
        }
        .nebula {
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(142, 45, 226, 0.1) 0%, transparent 40%),
                      radial-gradient(circle at 30% 30%, rgba(74, 0, 224, 0.1) 0%, transparent 40%);
          animation: drift 20s linear infinite;
        }
        .about-content {
          z-index: 1;
          width: 100%;
          max-width: 600px;
          animation: slideUp 0.6s ease-out;
        }
        .terminal-card {
          background: rgba(13, 13, 13, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        .terminal-header {
          background: rgba(255,255,255,0.05);
          padding: 10px 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dots { display: flex; gap: 8px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .terminal-title {
          flex: 1;
          text-align: center;
          font-size: 0.75rem;
          opacity: 0.5;
        }
        .terminal-body {
          padding: 25px;
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .line { color: #27c93f; margin-bottom: 5px; }
        .prompt { color: #ff7b72; }
        .response { color: #a5d6ff; margin-bottom: 20px; }
        .bio-text {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          color: #ccc;
          font-family: sans-serif;
        }
        .bio-text p { margin-bottom: 15px; }
        .blink { animation: blink 1s step-end infinite; }
        
        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 40px;
          text-decoration: none;
          color: #888;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .back-btn:hover { color: #fff; }
        
        @keyframes drift {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
