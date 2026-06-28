'use client';

import React, { useState } from 'react';

interface GalleryViewProps {
  isDarkMode: boolean;
  onOpenQuickLook: (images: string[], index: number, title: string) => void;
}

interface ImageItem {
  src: string;
  title?: string;
  description?: string;
}

export default function GalleryView({ isDarkMode }: GalleryViewProps) {
  const [activeTab, setActiveTab] = useState<'delhi' | 'niser' | 'illustrations'>('delhi');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  const delhiImages: ImageItem[] = [
    { src: '/gallery/delhi-shopping/1780959476156.jpeg' },
    { src: '/gallery/delhi-shopping/1780959476321.jpeg' },
    { src: '/gallery/delhi-shopping/1780959476161.jpeg' },
    { src: '/gallery/delhi-shopping/1780959475584.jpeg' },
    { src: '/gallery/delhi-shopping/1780959476608.jpeg' },
    { src: '/gallery/delhi-shopping/1780959476425.jpeg' },
    { src: '/gallery/delhi-shopping/1780959474802.jpeg' },
    { src: '/gallery/delhi-shopping/1780959476168.jpeg' },
    { src: '/gallery/delhi-shopping/1780959474708.jpeg' },
    { src: '/gallery/delhi-shopping/1780959475708.jpeg' },
    { src: '/gallery/delhi-shopping/1780959476299.jpeg' },
    { src: '/gallery/delhi-shopping/1780959476174.jpeg' },
  ];

  const niserImages: ImageItem[] = [
    { src: '/gallery/niser-times/1780776777123.jpeg' },
    { src: '/gallery/niser-times/1780776776660.jpeg' },
    { src: '/gallery/niser-times/1780776776714.jpeg' },
    { src: '/gallery/niser-times/1780776777775.jpeg' },
    { src: '/gallery/niser-times/1780776777243.jpeg' },
    { src: '/gallery/niser-times/1780776777038.jpeg' },
    { src: '/gallery/niser-times/1780776776680.jpeg' },
    { src: '/gallery/niser-times/1780776776706.jpeg' },
    { src: '/gallery/niser-times/1780776776160.jpeg' },
    { src: '/gallery/niser-times/1780776777024.jpeg' },
  ];

  const illustrationImages: ImageItem[] = [
    {
      src: '/gallery/illustrations/1782174990163.jpeg',
      title: 'Feature Flag Rollout Strategy',
      description: 'Flowchart explaining user routing, DB queries, hash validation, and safe fallback logic for rolling out new features.'
    },
    {
      src: '/gallery/illustrations/1781798754417.jpeg',
      title: 'Whitefield Traffic Hotspots Map',
      description: 'OpenStreetMap overlay of satellite map visualization showcasing local peak traffic latency hotspots.'
    },
    {
      src: '/gallery/illustrations/1780700866053.jpeg',
      title: 'Boilerplate Call Stack Trace',
      description: 'A visual look at AbstractBaseRequestHandlerFactory call stack frames illustrating standard enterprise Java/TS boilerplate pattern.'
    },
    {
      src: '/gallery/illustrations/1781729663413.jpeg',
      title: 'Today: Production vs Me',
      description: 'A humorous dashboard of 13 hotfixes, duplicate orders, webhook bugs, and price caching issues resolved in a single day.'
    },
    {
      src: '/gallery/illustrations/1782174989927.jpeg',
      title: 'Dr. STONE Space Rocket Episode',
      description: 'Senku 7 rocket scene in Season 4 Episode 32, illustrating target ambition and lunar planning context.'
    },
    {
      src: '/gallery/illustrations/1781798750123.jpeg',
      title: 'AWS ECS Task Architecture',
      description: 'API Container routing traffic to local OSRM sidecar with <2ms latency, replacing paid external maps APIs.'
    },
    {
      src: '/gallery/illustrations/1780700865883.jpeg',
      title: 'Technical Debt Curve',
      description: 'Chart showing how cost-to-fix compounding increases over time if architectural decisions are ignored after Day 90.'
    },
    {
      src: '/gallery/illustrations/1780700866000.jpeg',
      title: 'Software Architecture Comparison',
      description: 'Direct visual comparison of flat monoliths, modular monoliths, and microservice traps.'
    },
    {
      src: '/gallery/illustrations/1781729663439.jpeg',
      title: 'LLM Prompting Comparison',
      description: 'A contrast between vague prompts expecting miracles and surgical prompts outlining exact queries, highlighting that LLMs are only as good as codebase familiarity.'
    }
  ];

  const handleImageClick = (images: ImageItem[], index: number) => {
    const list = images.map(img => img.src);
    setLightboxImages(list);
    setLightboxIndex(index);
  };

  return (
    <div className="gallery-app">
      <div className="gallery-sidebar">
        <div 
          className={`sidebar-item ${activeTab === 'delhi' ? 'active' : ''}`}
          onClick={() => setActiveTab('delhi')}
        >
          <i className="fas fa-shopping-bag"></i> Delhi & Shopping
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'niser' ? 'active' : ''}`}
          onClick={() => setActiveTab('niser')}
        >
          <i className="fas fa-university"></i> NISER Times
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'illustrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('illustrations')}
        >
          <i className="fas fa-project-diagram"></i> Illustrations & Concepts
        </div>
      </div>

      <div className="gallery-content">
        {activeTab === 'delhi' && (
          <div className="gallery-grid">
            {delhiImages.map((img, i) => (
              <div 
                key={i} 
                className="gallery-card"
                onClick={() => handleImageClick(delhiImages, i)}
              >
                <img src={img.src} alt={`Delhi & Shopping ${i + 1}`} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'niser' && (
          <div className="gallery-grid">
            {niserImages.map((img, i) => (
              <div 
                key={i} 
                className="gallery-card"
                onClick={() => handleImageClick(niserImages, i)}
              >
                <img src={img.src} alt={`NISER Times ${i + 1}`} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'illustrations' && (
          <div className="gallery-list">
            {illustrationImages.map((img, i) => (
              <div key={i} className="illustration-row">
                <div 
                  className="illustration-img-container"
                  onClick={() => handleImageClick(illustrationImages, i)}
                >
                  <img src={img.src} alt={img.title} />
                  <div className="zoom-overlay"><i className="fas fa-search-plus"></i> Click to Zoom</div>
                </div>
                <div className="illustration-text">
                  <h4>{img.title}</h4>
                  <p>{img.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>×</button>
          
          <button 
            className="lightbox-nav prev" 
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length);
            }}
          >
            ‹
          </button>
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImages[lightboxIndex]} alt="Zoomed view" />
          </div>
          
          <button 
            className="lightbox-nav next" 
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((lightboxIndex + 1) % lightboxImages.length);
            }}
          >
            ›
          </button>
        </div>
      )}

      <style jsx>{`
        .gallery-app {
          display: flex;
          height: 100%;
          background: ${isDarkMode ? '#1e1e1e' : '#fff'};
          color: ${isDarkMode ? '#eee' : '#333'};
        }

        .gallery-sidebar {
          width: 220px;
          border-right: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          background: ${isDarkMode ? '#252525' : '#f5f5f7'};
          padding: 15px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-item {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-item:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        }

        .sidebar-item.active {
          background: var(--accent-color, #007aff);
          color: white;
        }

        .gallery-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
        }

        .gallery-card {
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          background: ${isDarkMode ? '#151515' : '#f9f9f9'};
        }

        .gallery-card:hover {
          transform: scale(1.03);
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }

        .gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-list {
          display: flex;
          flex-direction: column;
          gap: 25px;
          max-width: 800px;
          margin: 0 auto;
        }

        .illustration-row {
          display: flex;
          gap: 20px;
          padding-bottom: 25px;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          align-items: center;
        }

        .illustration-img-container {
          width: 180px;
          min-width: 180px;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
        }

        .illustration-img-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .illustration-img-container:hover img {
          transform: scale(1.05);
        }

        .zoom-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.4);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 600;
          transition: opacity 0.2s;
          gap: 5px;
        }

        .illustration-img-container:hover .zoom-overlay {
          opacity: 1;
        }

        .illustration-text h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .illustration-text p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          opacity: 0.8;
        }

        /* Lightbox CSS */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100000;
          animation: fadeIn 0.2s ease-out;
        }

        .lightbox-content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          max-height: 90vh;
          padding: 20px;
        }

        .lightbox-content img {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.7);
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 30px;
          background: none;
          border: none;
          color: rgba(255,255,255,0.7);
          font-size: 44px;
          cursor: pointer;
          transition: color 0.2s;
          z-index: 100001;
        }

        .lightbox-close:hover {
          color: white;
        }

        .lightbox-nav {
          background: rgba(255,255,255,0.08);
          border: none;
          color: rgba(255,255,255,0.8);
          font-size: 36px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 100001;
        }

        .lightbox-nav:hover {
          background: rgba(255,255,255,0.2);
          color: white;
          transform: scale(1.05);
        }

        .lightbox-nav.prev {
          margin-left: 30px;
        }

        .lightbox-nav.next {
          margin-right: 30px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 600px) {
          .gallery-app {
            flex-direction: column;
          }
          .gallery-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
            flex-direction: row;
            overflow-x: auto;
            white-space: nowrap;
          }
          .sidebar-item {
            padding: 8px 12px;
          }
          .illustration-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .illustration-img-container {
            width: 100%;
            height: 200px;
          }
          .lightbox-nav {
            width: 44px;
            height: 44px;
            font-size: 28px;
          }
          .lightbox-nav.prev { margin-left: 10px; }
          .lightbox-nav.next { margin-right: 10px; }
        }
      `}</style>
    </div>
  );
}
