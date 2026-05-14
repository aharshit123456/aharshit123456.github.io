'use client';

import React, { useRef } from 'react';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  brightness: number;
  setBrightness: (val: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  activeWifi: string;
}

export default function ControlCenter({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  toggleTheme,
  brightness,
  setBrightness,
  volume,
  setVolume,
  activeWifi
}: ControlCenterProps) {
  const brightnessRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSliderClick = (e: React.MouseEvent, type: 'brightness' | 'volume', ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.round(Math.min(Math.max((x / rect.width) * 100, 0), 100));
    
    if (type === 'brightness') setBrightness(percentage);
    else setVolume(percentage);
  };

  return (
    <div className="control-center-wrapper" onClick={onClose}>
      <div className="control-center-panel" onClick={(e) => e.stopPropagation()}>
        <div className="control-grid">
          <div className="control-block main-controls">
            <div className="control-item active">
              <i className="fas fa-wifi"></i>
              <div className="control-info">
                <span className="label">Wi-Fi</span>
                <span className="value">{activeWifi}</span>
              </div>
            </div>
            <div className="control-item active">
              <i className="fab fa-bluetooth-b"></i>
              <div className="control-info">
                <span className="label">Bluetooth</span>
                <span className="value">On</span>
              </div>
            </div>
            <div className="control-item">
              <i className="fas fa-satellite-dish"></i>
              <div className="control-info">
                <span className="label">AirDrop</span>
                <span className="value">Contacts Only</span>
              </div>
            </div>
          </div>

          <div className="control-block secondary-controls">
            <div className={`control-item square ${isDarkMode ? 'active' : ''}`} onClick={toggleTheme}>
              <i className={isDarkMode ? "fas fa-moon" : "fas fa-sun"}></i>
              <span className="label">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="control-item square">
              <i className="fas fa-keyboard"></i>
              <span className="label">Keyboard</span>
            </div>
          </div>

          <div className="control-block slider-controls">
            <div className="slider-item">
              <span className="label">Display</span>
              <div 
                className="slider-bg" 
                ref={brightnessRef} 
                onClick={(e) => handleSliderClick(e, 'brightness', brightnessRef)}
              >
                <div className="slider-fill" style={{ width: `${brightness}%` }}></div>
                <i className="fas fa-sun slider-icon"></i>
              </div>
            </div>
            <div className="slider-item">
              <span className="label">Sound</span>
              <div 
                className="slider-bg" 
                ref={volumeRef} 
                onClick={(e) => handleSliderClick(e, 'volume', volumeRef)}
              >
                <div className="slider-fill" style={{ width: `${volume}%` }}></div>
                <i className="fas fa-volume-up slider-icon"></i>
              </div>
            </div>
          </div>

          <div className="control-block now-playing-spotify">
            <iframe 
              style={{ borderRadius: '12px', border: 'none' }} 
              src="https://open.spotify.com/embed/track/776AftMmFFAWUIEAb3lHhw?utm_source=generator&theme=0" 
              width="100%" 
              height="152" 
              allowFullScreen 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>

      <style jsx>{`
        .now-playing-spotify {
          grid-column: span 2;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          height: 152px;
          overflow: hidden;
        }
        .control-center-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 11000;
        }
        .control-center-panel {
          position: absolute;
          top: 35px;
          right: 10px;
          width: 320px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          padding: 15px;
          animation: panelSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes panelSlide {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .control-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .control-block {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .main-controls {
          grid-column: span 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .control-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .control-item i {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 14px;
        }
        .control-item.active i {
          background: #007aff;
          color: white;
        }
        .control-info {
          display: flex;
          flex-direction: column;
        }
        .control-info .label { font-size: 11px; font-weight: 600; }
        .control-info .value { font-size: 10px; opacity: 0.6; }

        .secondary-controls {
          grid-column: span 1;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          background: transparent;
          padding: 0;
        }
        .control-item.square {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 10px;
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .control-item.square.active {
          background: #007aff;
          color: white;
        }
        .control-item.square i {
          background: transparent;
          width: auto;
          height: auto;
          font-size: 18px;
        }
        .control-item.square .label { font-size: 11px; font-weight: 600; }

        .slider-controls {
          grid-column: span 2;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .slider-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .slider-item .label { font-size: 11px; font-weight: 600; }
        .slider-bg {
          height: 28px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .slider-fill {
          height: 100%;
          background: #fff;
          opacity: 0.8;
          transition: width 0.1s ease-out;
        }
        .slider-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #000;
          opacity: 0.5;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
