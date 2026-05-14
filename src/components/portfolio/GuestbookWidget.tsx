'use client';

import React, { useState, useEffect } from 'react';

interface Note {
  id: number;
  created_at: string;
  user_name: string;
  message: string;
}

export default function GuestbookWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUPABASE_URL = 'https://kolqskhjijhzghnrteqi.supabase.co/rest/v1/guestbook_notes';
  // Note: The user needs to provide their Supabase Anon/Public Key
  const SUPABASE_KEY = 'sb_publishable_yUihxNM1P39vLWQ5jS0Y-Q_mCby5zgz';

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const postNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !message) return;

    setIsPosting(true);
    setError(null);

    try {
      // Get user IP (optional but requested)
      let userIp = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIp = ipData.ip;
      } catch (e) { }

      // Silently collect ABSOLUTE MAXIMUM metadata
      const getGpuInfo = () => {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) return 'unknown';
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          return debugInfo ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
        } catch (e) { return 'error'; }
      };

      let batteryInfo: any = 'unavailable';
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          batteryInfo = {
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          };
        }
      } catch (e) {}

      const userMetadata = {
        userAgent: window.navigator.userAgent,
        language: window.navigator.language,
        languages: window.navigator.languages,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
          pixelDepth: window.screen.pixelDepth,
          orientation: window.screen.orientation?.type
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        referrer: document.referrer || 'direct',
        platform: (window.navigator as any).platform,
        hardware: {
          cores: window.navigator.hardwareConcurrency,
          memory: (window.navigator as any).deviceMemory,
          gpu: getGpuInfo(),
          maxTouchPoints: window.navigator.maxTouchPoints
        },
        browser: {
          pdfViewer: window.navigator.pdfViewerEnabled,
          cookieEnabled: window.navigator.cookieEnabled,
          doNotTrack: window.navigator.doNotTrack,
          webdriver: window.navigator.webdriver
        },
        battery: batteryInfo,
        connection: (window.navigator as any).connection ? {
          type: (window.navigator as any).connection.effectiveType,
          downlink: (window.navigator as any).connection.downlink,
          rtt: (window.navigator as any).connection.rtt,
          saveData: (window.navigator as any).connection.saveData
        } : 'unknown',
        media: {
          prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
          prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        }
      };

      const response = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_name: userName,
          message: message,
          user_ip: userIp,
          user_metadata: userMetadata
        })
      });

      if (response.ok) {
        setUserName('');
        setMessage('');
        fetchNotes();
      } else {
        setError('Failed to post note. check API Key.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="guestbook-widget">
      <div className="widget-header">
        <i className="fas fa-sticky-note"></i>
        <span>Desktop Notes</span>
      </div>

      <div className="notes-container">
        {notes.length === 0 ? (
          <div className="no-notes">No notes yet. Be the first!</div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="note-item">
              <div className="note-meta">
                <span className="note-user">{note.user_name}</span>
                <span className="note-date">{new Date(note.created_at).toLocaleDateString()}</span>
              </div>
              <p className="note-text">{note.message}</p>
            </div>
          ))
        )}
      </div>

      <form className="note-form" onSubmit={postNote}>
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
        />
        <textarea
          placeholder="Leave a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button type="submit" disabled={isPosting}>
          {isPosting ? 'Posting...' : 'Post Note'}
        </button>
        {error && <div className="error-msg">{error}</div>}
      </form>

      <style jsx>{`
        .guestbook-widget {
          width: 260px;
          background: rgba(255, 255, 150, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          color: #333;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid rgba(0,0,0,0.1);
          transform: rotate(-1deg);
          transition: transform 0.3s;
        }
        .guestbook-widget:hover {
          transform: rotate(0deg) scale(1.02);
        }
        .widget-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          padding-bottom: 5px;
        }
        .notes-container {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 5px;
        }
        .notes-container::-webkit-scrollbar {
          width: 4px;
        }
        .notes-container::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 2px;
        }
        .note-item {
          background: rgba(255,255,255,0.3);
          padding: 8px;
          border-radius: 8px;
          font-size: 0.8rem;
        }
        .note-meta {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          margin-bottom: 4px;
          font-size: 0.7rem;
          opacity: 0.7;
        }
        .note-text { margin: 0; line-height: 1.4; }
        .note-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .note-form input, .note-form textarea {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 0.8rem;
          outline: none;
        }
        .note-form textarea { height: 60px; resize: none; }
        .note-form button {
          background: #333;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .note-form button:hover { background: #000; }
        .note-form button:disabled { opacity: 0.5; }
        .error-msg { font-size: 0.7rem; color: #d32f2f; text-align: center; }
        .no-notes { font-size: 0.8rem; opacity: 0.5; text-align: center; padding: 20px 0; }
      `}</style>
    </div>
  );
}
