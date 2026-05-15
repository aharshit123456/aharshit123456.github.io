'use client';

import React, { useState, useMemo } from 'react';

interface AppIcon {
  id: string;
  name: string;
  icon: string;
  onClick: () => void;
}

interface LaunchpadProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppIcon[];
}

export default function Launchpad({ isOpen, onClose, apps }: LaunchpadProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const filteredApps = useMemo(() => {
    return apps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apps, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="launchpad-overlay" onClick={onClose}>
      <div className="launchpad-content" onClick={(e) => e.stopPropagation()}>
        <div className="search-container">
          <i className="fas fa-search search-icon"></i>
          <input 
            type="text" 
            placeholder="Search" 
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="apps-grid">
          {filteredApps.map(app => (
            <div key={app.id} className="launchpad-app" onClick={() => { 
              triggerHaptic(20);
              app.onClick(); 
              onClose(); 
            }}>
              <div className="app-icon-wrapper">
                <img src={app.icon} alt={app.name} />
              </div>
              <span className="app-name">{app.name}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .launchpad-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          z-index: 999999;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeIn 0.3s ease-out;
        }

        .launchpad-content {
          width: 80%;
          max-width: 1200px;
          height: 80%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 50px;
        }

        .search-container {
          position: relative;
          width: 300px;
          margin-bottom: 50px;
        }

        .search-container input {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 10px 8px 35px;
          color: white;
          font-size: 0.9rem;
          outline: none;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
        }

        .apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 40px;
          width: 100%;
          justify-items: center;
          overflow-y: auto;
          padding: 20px;
        }

        .launchpad-app {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .launchpad-app:hover {
          transform: scale(1.1);
        }

        .app-icon-wrapper {
          width: 80px;
          height: 80px;
          filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
        }

        .app-icon-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .app-name {
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
