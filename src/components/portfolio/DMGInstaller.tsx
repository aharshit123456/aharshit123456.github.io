'use client';

import React, { useState, useRef, useEffect } from 'react';

interface DMGInstallerProps {
  onInstallComplete: () => void;
  onClose: () => void;
}

const DMGInstaller: React.FC<DMGInstallerProps> = ({ onInstallComplete, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [iconPos, setIconPos] = useState({ x: 50, y: 80 });
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const dragRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      x: e.clientX - iconPos.x,
      y: e.clientY - iconPos.y
    };
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragRef.current.x;
      const newY = e.clientY - dragRef.current.y;
      
      // Keep inside container bounds
      const boundedX = Math.max(0, Math.min(380, newX));
      const boundedY = Math.max(0, Math.min(200, newY));
      
      setIconPos({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      
      // Target is at x: ~300, y: ~80. Let's check distance.
      const dx = iconPos.x - 300;
      const dy = iconPos.y - 80;
      const distance = Math.sqrt(dx*dx + dy*dy);

      if (distance < 60) {
        startInstallation();
      } else {
        // Snap back to start
        setIconPos({ x: 50, y: 80 });
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, iconPos]);

  const startInstallation = () => {
    setIsInstalling(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 1.5; // Slightly slower for more "weight"
      setProgress(Math.min(current, 100));
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onInstallComplete();
        }, 800);
      }
    }, 50);
  };

  // Check if over target
  const dx = iconPos.x - 300;
  const dy = iconPos.y - 80;
  const isOverTarget = isDragging && Math.sqrt(dx*dx + dy*dy) < 80;

  return (
    <div className="dmg-content" ref={containerRef}>
      {!isInstalling ? (
        <div className="dmg-grid">
          <div 
            className="dmg-icon-source"
            style={{ 
              transform: `translate(${iconPos.x}px, ${iconPos.y}px)`,
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: isDragging ? 10 : 1,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseDown={handleMouseDown}
          >
            <img src="/pdf_icon.png" alt="Resume PDF" draggable="false" />
            <span>Harshit_Resume.pdf</span>
          </div>

          <div className="dmg-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>

          <div className={`dmg-icon-target ${isOverTarget ? 'target-hover' : ''}`}>
            <img src="/apps_icon.png" alt="Applications" draggable="false" />
            <span>Applications</span>
          </div>
          
          <div className="dmg-hint">Drag Harshit_Resume.pdf to the Applications folder to install</div>
        </div>
      ) : (
        <div className="installing-overlay">
          <div className="install-modal">
            <div className="install-header">
              <img src="/pdf_icon.png" style={{ width: '40px', height: '40px' }} alt="Copying" />
              <div className="install-text">
                <strong>Copying "Harshit_Resume.pdf" to "Applications"</strong>
                <span>{progress < 100 ? `About ${Math.ceil((100 - progress) / 20)} seconds remaining` : 'Finishing...'}</span>
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="install-footer">
               <button className="cancel-btn" onClick={onClose}>
                  <i className="fas fa-times-circle"></i>
               </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dmg-content {
          width: 500px;
          height: 300px;
          background: #fff;
          background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          position: relative;
          overflow: hidden;
          user-select: none;
        }
        .dmg-grid {
          position: relative;
          height: 100%;
        }
        .dmg-icon-source, .dmg-icon-target {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 120px;
          position: absolute;
        }
        .dmg-icon-source img, .dmg-icon-target img {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .dmg-icon-source span, .dmg-icon-target span {
          margin-top: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          text-align: center;
          text-shadow: 0 1px 2px rgba(255,255,255,0.8);
          max-width: 110px;
          word-break: break-all;
        }
        .dmg-icon-target {
          right: 80px;
          top: 80px;
          padding: 10px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .dmg-icon-target.target-hover {
          background: rgba(0, 122, 255, 0.1);
          transform: scale(1.05);
          box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
        }
        .dmg-arrow {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 40px;
          color: rgba(0,0,0,0.1);
        }
        .dmg-hint {
          position: absolute;
          bottom: 20px;
          width: 100%;
          text-align: center;
          font-size: 11px;
          color: #666;
          font-weight: 500;
        }
        .installing-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.15);
          backdrop-filter: blur(2px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        .install-modal {
          background: #f0f0f0;
          width: 380px;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
          border: 1px solid #fff;
          position: relative;
        }
        .install-header {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          align-items: center;
        }
        .install-text {
          display: flex;
          flex-direction: column;
          font-size: 13px;
        }
        .install-text strong {
          color: #000;
        }
        .install-text span {
          color: #666;
          margin-top: 4px;
        }
        .progress-container {
          width: 100%;
          height: 20px;
          background: #d0d0d0;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(to bottom, #72a8ff 0%, #007aff 100%);
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          transition: width 0.1s linear;
        }
        .install-footer {
          margin-top: 15px;
          display: flex;
          justify-content: flex-end;
        }
        .cancel-btn {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 16px;
          padding: 5px;
          transition: color 0.2s;
        }
        .cancel-btn:hover {
          color: #ff4757;
        }
      `}</style>
    </div>
  );
};

export default DMGInstaller;
