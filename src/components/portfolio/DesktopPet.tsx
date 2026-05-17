'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PetType = 'cat' | 'frog' | 'crab';

interface DesktopPetProps {
  type: PetType;
  trigger?: boolean;
}

type PetState = 'idle' | 'walking' | 'action' | 'hidden';

const FrogSVG = ({ state }: { state: PetState }) => (
  <motion.svg viewBox="0 0 20 20" width="64" height="64" style={{ imageRendering: 'pixelated' }}>
    <ellipse cx="10" cy="18" rx="6" ry="2" fill="rgba(0,255,0,0.1)" />
    <motion.rect x="5" y="10" width="10" height="7" rx="2" fill="#4ade80" stroke="#166534" strokeWidth="0.5" animate={{ scaleY: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
    <rect x="7" y="6" width="6" height="5" rx="1" fill="#4ade80" stroke="#166534" strokeWidth="0.5" />
    <rect x="8" y="8" width="1.5" height="1.5" fill="#000" />
    <rect x="11" y="8" width="1.5" height="1.5" fill="#000" />
    {/* Sunglasses */}
    <motion.g animate={{ y: state === 'action' ? 0 : -2 }}>
      <rect x="7" y="7" width="3" height="2" fill="#000" />
      <rect x="11" y="7" width="3" height="2" fill="#000" />
      <rect x="10" y="7.5" width="1" height="0.5" fill="#000" />
    </motion.g>
  </motion.svg>
);

const CrabSVG = ({ state }: { state: PetState }) => (
  <motion.svg viewBox="0 0 20 20" width="64" height="64" style={{ imageRendering: 'pixelated' }}>
    <ellipse cx="10" cy="18" rx="6" ry="2" fill="rgba(255,0,0,0.1)" />
    <motion.rect x="4" y="10" width="12" height="6" rx="3" fill="#f87171" stroke="#991b1b" strokeWidth="0.5" />
    {/* Eyes on stalks */}
    <rect x="7" y="7" width="0.5" height="3" fill="#991b1b" />
    <rect x="12" y="7" width="0.5" height="3" fill="#991b1b" />
    <circle cx="7.25" cy="7" r="1.5" fill="white" stroke="#000" strokeWidth="0.2" />
    <circle cx="12.25" cy="7" r="1.5" fill="white" stroke="#000" strokeWidth="0.2" />
    <circle cx="7.25" cy="7" r="0.5" fill="black" />
    <circle cx="12.25" cy="7" r="0.5" fill="black" />
    {/* Claws */}
    <motion.path d="M3 10 Q1 8 3 6" stroke="#f87171" strokeWidth="2" fill="none" animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} />
    <motion.path d="M17 10 Q19 8 17 6" stroke="#f87171" strokeWidth="2" fill="none" animate={{ rotate: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} />
  </motion.svg>
);

const CatSVG = ({ state }: { state: PetState }) => (
  <motion.svg viewBox="0 0 24 24" width="80" height="80" style={{ imageRendering: 'pixelated' }}>
    {/* Shadow */}
    <ellipse cx="12" cy="20" rx="7" ry="1.5" fill="rgba(0,0,0,0.1)" />

    {/* Tail - Waggier 3-part tail */}
    <motion.g 
      style={{ originX: '18px', originY: '14px' }}
      animate={{ rotate: [0, 20, -10, 0] }} 
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <rect x="18" y="12" width="4" height="2" rx="1" fill="#f9fafb" stroke="#000" strokeWidth="0.5" />
      <motion.rect x="20" y="9" width="2" height="4" rx="1" fill="#f9fafb" stroke="#000" strokeWidth="0.5" animate={{ rotate: [0, 30, -30, 0] }} />
    </motion.g>

    {/* Body */}
    <motion.g animate={{ y: state === 'walking' ? [0, -0.5, 0] : 0 }} transition={{ repeat: Infinity, duration: 0.4 }}>
      <rect x="6" y="11" width="12" height="7" rx="3" fill="#f9fafb" stroke="#000" strokeWidth="0.5" />
      
      {/* Red Collar - Now placed between head and body */}
      <rect x="7" y="10.5" width="10" height="1.5" fill="#ef4444" stroke="#000" strokeWidth="0.2" />
      <motion.circle cx="12" cy="12" r="1.2" fill="#facc15" stroke="#854d0e" strokeWidth="0.3" animate={{ scale: [1, 1.2, 1] }} />
    </motion.g>

    {/* Head - Slightly larger and rounder */}
    <motion.g animate={{ y: state === 'walking' ? [-0.5, 0.5, -0.5] : 0 }} transition={{ repeat: Infinity, duration: 0.4 }}>
      <rect x="7" y="4" width="10" height="8" rx="4" fill="#f9fafb" stroke="#000" strokeWidth="0.5" />
      
      {/* Ears */}
      <path d="M7 6 L7 2 L10 5 Z" fill="#f9fafb" stroke="#000" strokeWidth="0.5" />
      <path d="M14 5 L17 2 L17 6 Z" fill="#f9fafb" stroke="#000" strokeWidth="0.5" />
      
      {/* Whiskers */}
      <motion.g animate={{ rotate: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
        <line x1="5" y1="9" x2="8" y2="9.5" stroke="#9ca3af" strokeWidth="0.5" />
        <line x1="5" y1="10" x2="8" y2="10" stroke="#9ca3af" strokeWidth="0.5" />
        <line x1="16" y1="9.5" x2="19" y2="9" stroke="#9ca3af" strokeWidth="0.5" />
        <line x1="16" y1="10" x2="19" y2="10" stroke="#9ca3af" strokeWidth="0.5" />
      </motion.g>

      {/* Eyes - Rounder and more expressive */}
      <motion.g animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 0.98, 1] }}>
        <rect x="9" y="7" width="2" height="2" rx="0.5" fill="#000" />
        <rect x="13" y="7" width="2" height="2" rx="0.5" fill="#000" />
        {/* Eye Shine */}
        <rect x="9.2" y="7.2" width="0.6" height="0.6" fill="#fff" />
        <rect x="13.2" y="7.2" width="0.6" height="0.6" fill="#fff" />
      </motion.g>

      {/* Blush */}
      <rect x="8" y="9.5" width="1.5" height="1" rx="0.5" fill="#fecaca" opacity="0.8" />
      <rect x="14.5" y="9.5" width="1.5" height="1" rx="0.5" fill="#fecaca" opacity="0.8" />

      {/* Mouth */}
      <motion.path 
        d="M11 10 Q12 11 13 10" 
        fill="none" stroke="#000" strokeWidth="0.5" 
        animate={{ d: state === 'action' ? "M11 10 Q12 12 13 10" : "M11 10 Q12 11 13 10" }}
      />
    </motion.g>

    {/* 4 Legs - Stubby and cute */}
    <motion.rect x="7" y="16.5" width="2" height="3" rx="1" fill="#f9fafb" stroke="#000" strokeWidth="0.5" animate={{ y: state === 'walking' ? [0, -2, 0] : 0 }} transition={{ repeat: Infinity, duration: 0.4, delay: 0 }} />
    <motion.rect x="10" y="16.5" width="2" height="3" rx="1" fill="#f9fafb" stroke="#000" strokeWidth="0.5" animate={{ y: state === 'walking' ? [0, -2, 0] : 0 }} transition={{ repeat: Infinity, duration: 0.4, delay: 0.2 }} />
    <motion.rect x="12" y="16.5" width="2" height="3" rx="1" fill="#f9fafb" stroke="#000" strokeWidth="0.5" animate={{ y: state === 'walking' ? [0, -2, 0] : 0 }} transition={{ repeat: Infinity, duration: 0.4, delay: 0.1 }} />
    <motion.rect x="15" y="16.5" width="2" height="3" rx="1" fill="#f9fafb" stroke="#000" strokeWidth="0.5" animate={{ y: state === 'walking' ? [0, -2, 0] : 0 }} transition={{ repeat: Infinity, duration: 0.4, delay: 0.3 }} />
  </motion.svg>
);

export default function DesktopPet({ type, trigger = false }: DesktopPetProps) {
  const [state, setState] = useState<PetState>('hidden');
  const [position, setPosition] = useState({ x: -100, y: 0 });
  const [speech, setSpeech] = useState<string | null>(null);

  useEffect(() => {
    if (trigger && state === 'hidden') {
      setState('walking');
      const startX = type === 'crab' ? window.innerWidth + 100 : -100;
      setPosition({ x: startX, y: window.innerHeight - 150 - (type === 'frog' ? 50 : 0) });
    }
  }, [trigger, state, type]);

  useEffect(() => {
    if (state === 'hidden') return;

    const interval = setInterval(() => {
      if (state === 'walking') {
        setPosition(prev => {
          const targetX = type === 'crab' ? window.innerWidth - 300 : 300;
          const direction = type === 'crab' ? -1 : 1;
          const speed = 2;
          if (Math.abs(prev.x - targetX) < 5) {
            setState('idle');
            return prev;
          }
          return { ...prev, x: prev.x + (speed * direction) };
        });
      }

      if (state === 'idle' && Math.random() > 0.98) {
        setState('action');
        const lines: Record<PetType, string[]> = {
          cat: ["Mew!", "Bye-bye! 👋", "Aura +1000", "Skibidi?"],
          frog: ["I'm in.", "Access granted.", "Hacking... 🐸", "Everything is 0s and 1s."],
          crab: ["Compile faster!", "Nice sudo.", "Scuttle scuttle.", "Rust is better."]
        };
        const phrases = lines[type];
        setSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
        setTimeout(() => {
          setSpeech(null);
          setState('idle');
        }, 3000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state, type]);

  return (
    <AnimatePresence>
      {state !== 'hidden' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 9999,
            pointerEvents: 'auto',
            cursor: 'grab'
          }}
          drag
        >
          {speech && (
            <motion.div initial={{ scale: 0, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="pet-speech">
              {speech}
              <div className="speech-arrow" />
            </motion.div>
          )}
          {type === 'cat' && <CatSVG state={state} />}
          {type === 'frog' && <FrogSVG state={state} />}
          {type === 'crab' && <CrabSVG state={state} />}

          <style jsx>{`
            .pet-speech {
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              border: 2px solid #000;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              margin-bottom: 10px;
              color: black;
              box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
            }
            .speech-arrow {
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 5px solid #000;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
