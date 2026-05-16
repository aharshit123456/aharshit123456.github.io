'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PixelCharacterProps {
  isWalking?: boolean;
  flip?: boolean;
}

export default function PixelCharacter({ isWalking = false, flip = false }: PixelCharacterProps) {
  const [blink, setBlink] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSpinning, setIsSpinning] = useState(false);

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

  const triggerSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1000);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: isWalking ? [0, -5, 0] : 0,
        opacity: 1,
        rotate: isWalking ? [0, -2, 2, 0] : 0,
        scaleX: flip ? -1 : 1
      }}
      transition={{ 
        y: { repeat: isWalking ? Infinity : 0, duration: 0.4 },
        rotate: { repeat: isWalking ? Infinity : 0, duration: 0.4 },
        opacity: { duration: 0.8 }
      }}
      onClick={triggerSpin}
      style={{
        width: '140px',
        height: '140px',
        position: 'relative',
        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))',
        cursor: 'pointer'
      }}
    >
      <motion.svg
        viewBox="0 0 32 32"
        animate={{ 
          rotate: isSpinning ? 360 : 0,
          scale: isSpinning ? [1, 1.1, 1] : 1
        }}
        transition={{ 
          duration: 1, 
          ease: "easeInOut" 
        }}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated'
        }}
      >
        {/* Herta Chibi Pixel Art */}
        
        {/* Hair (Back) */}
        <rect x="6" y="10" width="20" height="14" fill="#6b7280" />
        <rect x="5" y="12" width="22" height="10" fill="#6b7280" />

        {/* Body / Outfit */}
        <rect x="10" y="20" width="12" height="8" fill="#1e293b" />
        <rect x="9" y="22" width="14" height="6" fill="#1e293b" />
        <rect x="11" y="24" width="10" height="6" fill="#f8fafc" />
        
        {/* Arms */}
        <motion.g animate={{ rotate: isSpinning ? [0, 20, -20, 0] : (isWalking ? [0, 10, -10, 0] : 0) }} transition={{ repeat: isWalking ? Infinity : 0, duration: 0.4 }}>
          <rect x="6" y="21" width="5" height="3" fill="#1e293b" />
          <rect x="21" y="21" width="5" height="3" fill="#1e293b" />
          <rect x="5" y="21" width="1" height="3" fill="#f8fafc" />
          <rect x="26" y="21" width="1" height="3" fill="#f8fafc" />
        </motion.g>

        {/* Head Base */}
        <rect x="8" y="8" width="16" height="14" rx="2" fill="#fff1f2" />

        {/* Hair (Front/Bangs) */}
        <rect x="7" y="7" width="18" height="5" fill="#94a3b8" />
        <rect x="7" y="12" width="3" height="6" fill="#94a3b8" />
        <rect x="22" y="12" width="3" height="6" fill="#94a3b8" />
        <rect x="10" y="7" width="12" height="2" fill="#475569" />
        <rect x="20" y="9" width="4" height="2" fill="#a855f7" opacity="0.6" />

        {/* Beret / Hat */}
        <rect x="9" y="5" width="14" height="4" rx="1" fill="#0f172a" />
        <rect x="15" y="4" width="2" height="2" fill="#a855f7" />

        {/* Face Details */}
        <motion.g animate={{ x: mousePos.x, y: mousePos.y }}>
          {!blink ? (
            <>
              <rect x="11" y="14" width="3" height="4" fill="#7e22ce" />
              <rect x="18" y="14" width="3" height="4" fill="#7e22ce" />
              <rect x="11" y="14" width="1" height="1" fill="#fff" opacity="0.8" />
              <rect x="18" y="14" width="1" height="1" fill="#fff" opacity="0.8" />
            </>
          ) : (
            <>
              <rect x="11" y="16" width="3" height="1" fill="#7e22ce" />
              <rect x="18" y="16" width="3" height="1" fill="#7e22ce" />
            </>
          )}
          <rect x="15" y="19" width="2" height="1" fill="#475569" opacity="0.5" />
        </motion.g>

        {/* Blush */}
        <rect x="9" y="18" width="2" height="1" fill="#fda4af" opacity="0.6" />
        <rect x="21" y="18" width="2" height="1" fill="#fda4af" opacity="0.6" />

        {/* Gold Accents */}
        <rect x="14" y="21" width="4" height="1" fill="#eab308" />
        <rect x="15" y="22" width="2" height="2" fill="#eab308" />

      </motion.svg>

      {/* Speech Bubble */}
      {isSpinning && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{ opacity: 1, y: -30, scale: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
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
          Kurukuru~ 🌀
        </motion.div>
      )}

      {/* Floating Sparkles */}
      <motion.div
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
          y: [0, -40],
          rotate: [0, 90]
        }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        style={{ position: 'absolute', top: '20px', right: '10px', pointerEvents: 'none' }}
      >
        ✨
      </motion.div>
      <motion.div
        animate={{
          scale: [0, 0.8, 0],
          opacity: [0, 0.6, 0],
          y: [0, -30],
          x: [0, -10]
        }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 0.5, ease: "easeOut" }}
        style={{ position: 'absolute', top: '30px', left: '10px', pointerEvents: 'none' }}
      >
        🌸
      </motion.div>
    </motion.div>
  );
}
