'use client';

import React from 'react';

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function ControlCenter({ isOpen, onClose, isDarkMode, toggleTheme }: ControlCenterProps) {
  if (!isOpen) return null;

  return (
    <div className="control-center-wrapper" onClick={onClose}>
      <div className="control-center-panel" onClick={(e) => e.stopPropagation()}>
        <div className="control-grid">
          <div className="control-block main-controls">
            <div className="control-item active">
              <i className="fas fa-wifi"></i>
              <div className="control-info">
                <span className="label">Wi-Fi</span>
                <span className="value">aharshit123456.space</span>
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
              <div className="slider-bg">
                <div className="slider-fill" style={{ width: '85%' }}></div>
                <i className="fas fa-sun slider-icon"></i>
              </div>
            </div>
            <div className="slider-item">
              <span className="label">Sound</span>
              <div className="slider-bg">
                <div className="slider-fill" style={{ width: '60%' }}></div>
                <i className="fas fa-volume-up slider-icon"></i>
              </div>
            </div>
          </div>

          <div className="control-block now-playing">
            <i className="fas fa-music"></i>
            <div className="music-info">
              <span className="song">Starlight</span>
              <span className="artist">Muse</span>
            </div>
            <i className="fas fa-play"></i>
          </div>
        </div>
      </div>

      <style jsx>{`
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
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
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
        }
        .slider-fill {
          height: 100%;
          background: #fff;
          opacity: 0.8;
        }
        .slider-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #000;
          opacity: 0.5;
        }

        .now-playing {
          grid-column: span 2;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .now-playing i { font-size: 18px; opacity: 0.8; }
        .music-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .song { font-size: 11px; font-weight: 600; }
        .artist { font-size: 10px; opacity: 0.6; }
      `}</style>
    </div>
  );
}
