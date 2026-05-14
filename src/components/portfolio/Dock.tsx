'use client';

import React, { useRef, useState } from 'react';

interface DockItem {
  id: string;
  name: string;
  icon: string;
  onClick: () => void;
  isOpen?: boolean;
}

interface DockProps {
  items: DockItem[];
}

export default function Dock({ items }: DockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dockRef.current) return;
    const { clientX } = e;
    const items = dockRef.current.querySelectorAll('.dock-item');
    
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const distance = Math.abs(clientX - centerX);
      const scale = Math.max(1, 1.8 - distance / 150);
      (item as HTMLElement).style.setProperty('--scale', scale.toString());
    });
  };

  const handleMouseLeave = () => {
    if (!dockRef.current) return;
    const items = dockRef.current.querySelectorAll('.dock-item');
    items.forEach((item) => {
      (item as HTMLElement).style.setProperty('--scale', '1');
    });
    setHoveredIndex(null);
  };

  return (
    <div className="dock-wrapper">
      <div 
        className="dock-container" 
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {items.map((item, index) => (
          <div 
            key={item.id}
            className="dock-item-wrapper"
            onMouseEnter={() => setHoveredIndex(index)}
          >
            <div 
              className="dock-item"
              onClick={item.onClick}
              title={item.name}
            >
              <img src={item.icon} alt={item.name} />
              {item.isOpen && <div className="dot-indicator" />}
            </div>
            {hoveredIndex === index && (
              <div className="dock-tooltip">{item.name}</div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .dock-wrapper {
          position: fixed;
          bottom: 10px;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          z-index: 10000;
          padding: 10px;
          perspective: 1000px;
          pointer-events: none;
        }
        .dock-container {
          pointer-events: auto;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          padding: 8px;
          border-radius: 20px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dock-item-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .dock-item {
          width: 50px;
          height: 50px;
          cursor: pointer;
          transition: transform 0.1s ease-out;
          transform: scale(var(--scale, 1));
          transform-origin: bottom center;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .dock-item img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
        }
        .dot-indicator {
          position: absolute;
          bottom: -8px;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 5px white;
        }
        .dock-tooltip {
          position: absolute;
          bottom: 75px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          pointer-events: none;
          animation: tooltipFade 0.2s ease;
          border: 1px solid rgba(255,255,255,0.1);
        }
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
