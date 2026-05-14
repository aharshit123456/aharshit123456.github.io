'use client';

import React from 'react';
import Link from 'next/link';

export default function LinksPage() {
  const links = [
    { name: 'GitHub', url: 'https://github.com/aharshit123456', icon: 'fab fa-github', color: '#333' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/aharshit123456/', icon: 'fab fa-linkedin', color: '#0077b5' },
    { name: 'Twitter', url: 'https://twitter.com/aharshit123456', icon: 'fab fa-twitter', color: '#1da1f2' },
    { name: 'Portfolio', url: '/', icon: 'fas fa-desktop', color: '#ff4757' },
    { name: 'Email', url: 'mailto:aharshit123456@gmail.com', icon: 'fas fa-envelope', color: '#ea4335' }
  ];

  return (
    <div className="links-wrapper">
      <style>{`
        .links-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          z-index: 9999;
          overflow-y: auto;
        }
        .stars {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url('https://www.transparenttextures.com/patterns/stardust.png');
          opacity: 0.3;
          pointer-events: none;
        }
        .links-container {
          width: 100%;
          max-width: 400px;
          z-index: 10;
          animation: fadeIn 0.8s ease-out;
          margin-top: auto;
          margin-bottom: auto;
        }
        .profile {
          text-align: center;
          margin-bottom: 30px;
        }
        .profile img {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.2);
          margin-bottom: 15px;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
          object-fit: cover;
        }
        .profile h1 { font-size: 1.5rem; margin: 0; font-weight: 700; color: white !important; }
        .profile p { font-size: 0.9rem; opacity: 0.6; margin: 5px 0 0 0; font-family: monospace; color: white !important; }
        
        .links-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .link-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 16px 24px;
          border-radius: 16px;
          text-decoration: none !important;
          color: white !important;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .link-card:hover {
          transform: scale(1.03);
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--hover-color);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .link-card i {
          font-size: 1.2rem;
          width: 25px;
          text-align: center;
        }
        .link-card span {
          font-weight: 500;
          font-size: 1rem;
        }
        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 30px;
          text-decoration: none !important;
          color: rgba(255,255,255,0.5) !important;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        .back-btn:hover { color: white !important; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="stars"></div>
      <div className="links-container">
        <div className="profile">
          <img src="/profile_new.jpg" alt="Harshit Agarwal" />
          <h1>Harshit Agarwal</h1>
          <p>aharshit123456.space</p>
        </div>
        
        <div className="links-grid">
          {links.map((link) => (
            <a 
              key={link.name} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="link-card"
              style={{ '--hover-color': link.color } as React.CSSProperties}
            >
              <i className={link.icon}></i>
              <span>{link.name}</span>
            </a>
          ))}
        </div>
        
        <Link href="/" className="back-btn">
          <i className="fas fa-chevron-left"></i> Back to Desktop
        </Link>
      </div>
    </div>
  );
}
