'use client';

import { useState, useEffect } from 'react';

export default function SecretBoss({ isActive, onClose }: { isActive: boolean, onClose: () => void }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [direction, setDirection] = useState({ x: 1.5, y: 1.5 });

  useEffect(() => {
    if (isActive) {
      const audio = new Audio('https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Glass.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const moveInterval = setInterval(() => {
      setPosition(prev => {
        let newX = prev.x + direction.x;
        let newY = prev.y + direction.y;

        const margin = 10;
        let newDirX = direction.x;
        let newDirY = direction.y;

        if (newX <= margin || newX >= window.innerWidth - 150) {
          newDirX = -direction.x;
        }
        if (newY <= margin || newY >= window.innerHeight - 150) {
          newDirY = -direction.y;
        }

        if (newDirX !== direction.x || newDirY !== direction.y) {
          setDirection({ x: newDirX, y: newDirY });
        }

        return { x: newX, y: newY };
      });
    }, 16);

    return () => clearInterval(moveInterval);
  }, [isActive, direction]);

  if (!isActive) return null;

  return (
    <div className="boss-container" style={{ left: position.x, top: position.y }}>
      <div className="boss-sprite">
        <img src="me.png" alt="Secret Boss" className="boss-img" />
        <div className="hp-bar">
          <div className="hp-fill"></div>
        </div>
        <div className="boss-label">Final Boss: Harshit</div>
      </div>
      <button className="win95-close" onClick={onClose}>X</button>

      <style jsx>{`
        .boss-container {
          position: fixed;
          z-index: 100000;
          pointer-events: none;
          transition: transform 0.1s linear;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
        }

        .boss-sprite {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .boss-img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 10px;
          image-rendering: pixelated;
          border: 4px solid #c0c0c0;
          box-shadow: inset -2px -2px #000, inset 2px 2px #fff;
          background: #c0c0c0;
          pointer-events: auto;
          cursor: crosshair;
        }

        .hp-bar {
          width: 100px;
          height: 10px;
          background: #000;
          border: 2px solid #c0c0c0;
          margin-top: 10px;
        }

        .hp-fill {
          width: 80%;
          height: 100%;
          background: #ff0000;
        }

        .boss-label {
          color: #fff;
          font-family: 'MS Sans Serif', 'Courier New', monospace;
          font-size: 12px;
          background: #000080;
          padding: 2px 8px;
          margin-top: 5px;
          text-transform: uppercase;
        }

        .win95-close {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #c0c0c0;
          border: 2px solid;
          border-color: #fff #808080 #808080 #fff;
          width: 24px;
          height: 24px;
          font-weight: bold;
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .win95-close:active {
          border-color: #808080 #fff #fff #808080;
          padding: 2px 0 0 2px;
        }
      `}</style>
    </div>
  );
}
