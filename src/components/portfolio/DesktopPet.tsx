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
  <motion.svg viewBox="0 0 20 20" width="64" height="64" style={{ imageRendering: 'pixelated' }}>
    <ellipse cx="10" cy="18" rx="6" ry="2" fill="rgba(0,0,0,0.1)" />
    <motion.rect x="2" y="10" width="4" height="2" fill="white" stroke="#000" strokeWidth="0.5" animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 1 }} />
    <rect x="5" y="8" width="10" height="8" rx="1" fill="white" stroke="#000" strokeWidth="0.5" />
    <rect x="7" y="4" width="8" height="7" rx="1" fill="white" stroke="#000" strokeWidth="0.5" />
    <path d="M7 4 L7 2 L9 4 Z" fill="white" stroke="#000" strokeWidth="0.5" />
    <path d="M13 4 L15 2 L15 4 Z" fill="white" stroke="#000" strokeWidth="0.5" />
    <rect x="9" y="7" width="1.5" height="1.5" fill="#000" />
    <rect x="12" y="7" width="1.5" height="1.5" fill="#000" />
    <motion.path d="M10 9 Q11 10 12 9" fill="none" stroke="#000" strokeWidth="0.5" animate={{ d: state === 'action' ? "M10 9 Q11 11 12 9" : "M10 9 Q11 10 12 9" }} />
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
