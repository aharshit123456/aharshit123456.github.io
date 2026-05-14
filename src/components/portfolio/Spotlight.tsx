'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  apps: { id: string, name: string, icon: string, onClick: () => void }[];
}

export default function Spotlight({ isOpen, onClose, apps }: SpotlightProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % filteredApps.length);
    }
    if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filteredApps.length) % filteredApps.length);
    }
    if (e.key === 'Enter' && filteredApps[selectedIndex]) {
      filteredApps[selectedIndex].onClick();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div className="spotlight-container" onClick={e => e.stopPropagation()}>
        <div className="spotlight-input-wrapper">
          <i className="fas fa-search"></i>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Spotlight Search" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        {filteredApps.length > 0 && (
          <div className="spotlight-results">
            {filteredApps.map((app, index) => (
              <div 
                key={app.id} 
                className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => { app.onClick(); onClose(); }}
              >
                <img src={app.icon} alt="" />
                <span>{app.name}</span>
                <span className="shortcut">Application</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .spotlight-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.2);
          z-index: 20000;
          display: flex;
          justify-content: center;
          padding-top: 15vh;
        }
        .spotlight-container {
          width: 600px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
          overflow: hidden;
          animation: spotlightFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes spotlightFade {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .spotlight-input-wrapper {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          gap: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .spotlight-input-wrapper i {
          font-size: 24px;
          opacity: 0.5;
          color: white;
        }
        input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 22px;
          outline: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        input::placeholder { color: rgba(255, 255, 255, 0.3); }
        
        .spotlight-results {
          padding: 8px;
          max-height: 400px;
          overflow-y: auto;
        }
        .result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          color: white;
        }
        .result-item.selected {
          background: #007aff;
        }
        .result-item img {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        .result-item span { flex: 1; font-size: 15px; }
        .shortcut { opacity: 0.5; font-size: 12px !important; text-align: right; }
      `}</style>
    </div>
  );
}
