'use client';

import React from 'react';

const wallpapers = [
  { id: 'sonoma', name: 'Sonoma', url: '/wallpapers/sonoma.jpg' },
  { id: 'ventura', name: 'Ventura', url: '/wallpapers/ventura.jpg' },
  { id: 'monterey', name: 'Monterey', url: '/wallpapers/monterey.jpg' },
  { id: 'minimal', name: 'Deep Space', url: '/wallpapers/space.jpg' },
  { id: 'abstract', name: 'Abstract Flow', url: '/wallpapers/abstract.jpg' }
];

interface WallpaperSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: string;
  setWallpaper: (url: string) => void;
}

export default function WallpaperSwitcher({ isOpen, onClose, currentWallpaper, setWallpaper }: WallpaperSwitcherProps) {
  if (!isOpen) return null;

  return (
    <div className="wallpaper-overlay" onClick={onClose}>
      <div className="wallpaper-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Desktop Wallpaper</h3>
          <button onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <div className="wallpaper-grid">
          {wallpapers.map((wp) => (
            <div 
              key={wp.id} 
              className={`wallpaper-card ${currentWallpaper === wp.url ? 'active' : ''}`}
              onClick={() => setWallpaper(wp.url)}
            >
              <img src={wp.url} alt={wp.name} />
              <span>{wp.name}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .wallpaper-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 15000;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0,0,0,0.3);
        }
        .wallpaper-panel {
          width: 500px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          padding: 20px;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          color: white;
        }
        .panel-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
        .panel-header button {
          background: none;
          border: none;
          color: white;
          opacity: 0.5;
          cursor: pointer;
          font-size: 18px;
        }
        .wallpaper-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 5px;
        }
        .wallpaper-card {
          position: relative;
          cursor: pointer;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: all 0.2s;
        }
        .wallpaper-card.active {
          border-color: #007aff;
          box-shadow: 0 0 15px rgba(0, 122, 255, 0.5);
        }
        .wallpaper-card img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          display: block;
        }
        .wallpaper-card span {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.5);
          color: white;
          font-size: 11px;
          padding: 5px;
          text-align: center;
          backdrop-filter: blur(5px);
        }
        .wallpaper-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
