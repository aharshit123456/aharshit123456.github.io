'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ClapButtonProps {
  projectId: string;
}

export default function ClapButton({ projectId }: ClapButtonProps) {
  const [claps, setClaps] = useState(0);
  const [userClaps, setUserClaps] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const SUPABASE_URL = 'https://kolqskhjijhzghnrteqi.supabase.co/rest/v1/project_claps';
  const SUPABASE_KEY = 'sb_publishable_yUihxNM1P39vLWQ5jS0Y-Q_mCby5zgz';

  const fetchClaps = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}?project_id=eq.${projectId}&select=clap_count`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setClaps(data[0].clap_count);
      }
    } catch (e) {}
  };

  const handleClap = async () => {
    if (userClaps >= 50) return;

    // Visual feedback
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    
    const newLocalClaps = claps + 1;
    setClaps(newLocalClaps);
    setUserClaps(prev => prev + 1);

    // Persist to Supabase (Fetch latest first to minimize race condition)
    try {
      const response = await fetch(`${SUPABASE_URL}?project_id=eq.${projectId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ clap_count: newLocalClaps })
      });
    } catch (e) {}
  };

  useEffect(() => {
    fetchClaps();
    // Poll for updates every 30s
    const interval = setInterval(fetchClaps, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  return (
    <div className="clap-container">
      <button 
        className={`clap-btn ${isAnimating ? 'animating' : ''} ${userClaps >= 50 ? 'disabled' : ''}`}
        onClick={handleClap}
        title="Applaud this project"
      >
        <span className="clap-icon">👏</span>
        {claps > 0 && <span className="clap-count">{claps}</span>}
        {userClaps > 0 && <span className="user-clap-popup">+{userClaps}</span>}
      </button>

      <style jsx>{`
        .clap-container {
          display: inline-flex;
          align-items: center;
          margin-left: 10px;
          vertical-align: middle;
        }
        .clap-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 4px 12px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          transition: all 0.2s;
          position: relative;
          overflow: visible;
        }
        .clap-btn:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        .clap-btn.animating {
          animation: pulse 0.4s ease-out;
        }
        .clap-btn.disabled {
          opacity: 0.8;
          cursor: default;
          border-color: var(--accent-color);
        }
        .clap-icon { font-size: 1rem; }
        .clap-count { font-weight: 700; opacity: 0.9; }
        
        .user-clap-popup {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent-color);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 800;
          animation: floatUp 1s forwards;
          pointer-events: none;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        @keyframes floatUp {
          0% { opacity: 0; transform: translate(-50%, 0); }
          20% { opacity: 1; transform: translate(-50%, -10px); }
          100% { opacity: 0; transform: translate(-50%, -40px); }
        }
      `}</style>
    </div>
  );
}
