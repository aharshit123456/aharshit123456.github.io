'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PixelCharacterProps {
  isWalking?: boolean;
  flip?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export default function PixelCharacter({ isWalking = false, flip = false, onContextMenu }: PixelCharacterProps) {
  const [blink, setBlink] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isMature, setIsMature] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 5;
      const y = (e.clientY / window.innerHeight - 0.5) * 5;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearInterval(blinkInterval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const triggerClick = () => {
    if (isSpinning) return;
    
    // Play Herta's signature sound
    const audio = new Audio('/char_sounds/herta_kurukuru.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Audio playback prevented:', err));

    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 8) {
      setIsMature(true);
      setClickCount(0);
    }

    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1500);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: isWalking ? [0, -5, 0] : 0,
        opacity: 1,
        rotate: isWalking ? [0, -2, 2, 0] : 0,
        scaleX: flip ? -1 : 1,
        scale: isMature ? 1.4 : 1,
      }}
      transition={{ 
        y: { repeat: isWalking ? Infinity : 0, duration: 0.4 },
        rotate: { repeat: isWalking ? Infinity : 0, duration: 0.4 },
        scale: { duration: 1.5, ease: "backOut" }
      }}
      onClick={triggerClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e);
      }}
      style={{
        width: '140px',
        height: isMature ? '200px' : '140px',
        position: 'relative',
        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))',
        cursor: 'pointer',
        transformOrigin: 'bottom center',
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      <motion.div
        animate={{ 
          rotateY: isSpinning ? 720 : 0,
        }}
        transition={{ 
          duration: 1.5, 
          ease: "easeInOut" 
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* FRONT SIDE */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transformStyle: 'preserve-3d', transform: 'translateZ(1px)' }}>
          <svg viewBox={isMature ? "0 0 32 48" : "0 0 32 32"} style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}>
            {!isMature ? (
              <>
                {/* Chibi Herta Front */}
                <rect x="6" y="10" width="20" height="14" fill="#6b7280" />
                <rect x="5" y="12" width="22" height="10" fill="#6b7280" />
                <rect x="10" y="20" width="12" height="8" fill="#1e293b" />
                <rect x="11" y="24" width="10" height="6" fill="#f8fafc" />
                <motion.g animate={{ rotate: isWalking ? [0, 10, -10, 0] : 0 }} transition={{ repeat: isWalking ? Infinity : 0, duration: 0.4 }}>
                  <rect x="6" y="21" width="5" height="3" fill="#1e293b" />
                  <rect x="21" y="21" width="5" height="3" fill="#1e293b" />
                </motion.g>
                <rect x="8" y="8" width="16" height="14" rx="2" fill="#fff1f2" />
                <rect x="7" y="7" width="18" height="5" fill="#94a3b8" />
                <rect x="7" y="12" width="3" height="6" fill="#94a3b8" />
                <rect x="22" y="12" width="3" height="6" fill="#94a3b8" />
                <rect x="9" y="5" width="14" height="4" rx="1" fill="#0f172a" />
                <rect x="15" y="4" width="2" height="2" fill="#a855f7" />
                <motion.g animate={{ x: mousePos.x, y: mousePos.y }}>
                  {!blink ? (
                    <><rect x="11" y="14" width="3" height="4" fill="#7e22ce" /><rect x="18" y="14" width="3" height="4" fill="#7e22ce" /></>
                  ) : (
                    <><rect x="11" y="16" width="3" height="1" fill="#7e22ce" /><rect x="18" y="16" width="3" height="1" fill="#7e22ce" /></>
                  )}
                </motion.g>
                <rect x="14" y="21" width="4" height="1" fill="#eab308" />
              </>
            ) : (
              <>
                {/* Mature Herta Front */}
                <rect x="6" y="18" width="20" height="25" fill="#6b7280" />
                <rect x="4" y="12" width="24" height="2" fill="#0f172a" />
                <path d="M10 12 L16 2 L22 12 Z" fill="#0f172a" />
                <rect x="10" y="24" width="12" height="18" fill="#1e293b" />
                <rect x="11" y="26" width="10" height="4" fill="#f8fafc" />
                <rect x="14" y="27" width="4" height="1" fill="#eab308" />
                <rect x="11" y="16" width="10" height="10" rx="1" fill="#fff1f2" />
                <rect x="10" y="15" width="12" height="4" fill="#94a3b8" />
                <motion.g animate={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}>
                  {!blink ? (
                    <><rect x="13" y="19" width="2" height="3" fill="#7e22ce" /><rect x="17" y="19" width="2" height="3" fill="#7e22ce" /></>
                  ) : (
                    <rect x="13" y="20" width="6" height="1" fill="#7e22ce" />
                  )}
                </motion.g>
              </>
            )}
          </svg>
        </div>

        {/* BACK SIDE (Darker / Hair view) */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', transformStyle: 'preserve-3d' }}>
          <svg viewBox={isMature ? "0 0 32 48" : "0 0 32 32"} style={{ width: '100%', height: '100%', imageRendering: 'pixelated', filter: 'brightness(0.8)' }}>
            {!isMature ? (
              <>
                {/* Chibi Herta Back */}
                <rect x="6" y="10" width="20" height="14" fill="#6b7280" />
                <rect x="5" y="12" width="22" height="12" fill="#6b7280" />
                <rect x="10" y="20" width="12" height="8" fill="#111827" />
                <rect x="8" y="8" width="16" height="14" rx="2" fill="#6b7280" />
                <rect x="9" y="5" width="14" height="4" rx="1" fill="#0f172a" />
              </>
            ) : (
              <>
                {/* Mature Herta Back */}
                <rect x="6" y="18" width="20" height="28" fill="#4b5563" />
                <path d="M10 12 L16 2 L22 12 Z" fill="#020617" />
                <rect x="10" y="24" width="12" height="18" fill="#0f172a" />
                <rect x="11" y="16" width="10" height="10" fill="#4b5563" />
              </>
            )}
          </svg>
        </div>
      </motion.div>

      {/* Speech Bubble */}
      {(isSpinning || isMature) && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: 1, y: -30, scale: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: isMature ? '-60px' : '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: isMature ? '14px' : '12px',
            fontWeight: 'bold',
            color: '#7e22ce',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            border: '2px solid #a855f7',
            fontFamily: 'sans-serif',
            zIndex: 10
          }}
        >
          {isMature ? "Time to grow up~ 💎" : "Kurukuru~ 🌀"}
        </motion.div>
      )}

      {/* Floating Sparkles - More intense for Mature Herta */}
      <motion.div
        animate={{
          scale: [0, isMature ? 1.5 : 1, 0],
          opacity: [0, 1, 0],
          y: [0, -60],
          rotate: [0, 180]
        }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        style={{ position: 'absolute', top: '20px', right: '10px', pointerEvents: 'none' }}
      >
        ✨
      </motion.div>
      <motion.div
        animate={{
          scale: [0, isMature ? 1.2 : 0.8, 0],
          opacity: [0, 0.6, 0],
          y: [0, -50],
          x: [0, -20]
        }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 0.5, ease: "easeOut" }}
        style={{ position: 'absolute', top: '30px', left: '10px', pointerEvents: 'none' }}
      >
        🌸
      </motion.div>
      {isMature && (
        <motion.div
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0],
            y: [0, -80],
            x: [10, -10]
          }}
          transition={{ repeat: Infinity, duration: 3, delay: 1, ease: "easeOut" }}
          style={{ position: 'absolute', bottom: '20px', left: '50%', pointerEvents: 'none', color: '#a855f7' }}
        >
          💎
        </motion.div>
      )}
    </motion.div>
  );
}
