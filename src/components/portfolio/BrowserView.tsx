'use client';

import React, { useState, useEffect } from 'react';

interface Article {
  id: number;
  title: string;
  author: string;
  date: string;
  image: string;
  category: string;
  steps: { title: string; content: string }[];
  expertTip: string;
  thingsYouNeed: string[];
  qa: { q: string; a: string }[];
  warnings: string[];
}

const BRAINROT_ARTICLES: Article[] = [
  {
    id: 1,
    title: "How to Rizz up a Skibidi Toilet in Ohio",
    author: "Kai Cenat",
    date: "May 16, 2026",
    category: "Relationships",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400",
    steps: [
      { title: "Secure a Level 5 Gyatt", content: "You cannot expect to rizz up a Skibidi Toilet with basic stats. Hit the gym and focus on your lower body until you reach Level 5." },
      { title: "Master the Lightskin Stare", content: "Approach the toilet slowly. Tilt your head slightly and squint your eyes. This creates an immediate aura of mystery." },
      { title: "Speak in Cursive", content: "When you finally make contact, do not use normal English. Speak in a way that sounds like a slowed + reverb TikTok audio." }
    ],
    expertTip: "If the toilet starts singing, immediately hit the 'Griddy' to establish dominance.",
    thingsYouNeed: [
      "Level 5 Gyatt (Minimum)",
      "Slowed + Reverb Audio Filter",
      "Skibidi Permit (Ohio Edition)",
      "Blue Raspberry Prime"
    ],
    qa: [
      { q: "Is this safe for Alphas?", a: "Only if you have at least 2000 Aura. Betas should stay away." },
      { q: "Does this work in Michigan?", a: "L + Ratio + No. Ohio only." }
    ],
    warnings: [
      "Exposure to Ohio physics may cause permanent Glazing.",
      "Do not attempt without a valid Skibidi Permit."
    ]
  },
  {
    id: 2,
    title: "How to Escape the Fanum Tax at 3 AM (Working 2026)",
    author: "Duke Dennis",
    date: "May 15, 2026",
    category: "Survival",
    image: "https://images.unsplash.com/photo-1555529669-2269763671c0?auto=format&fit=crop&q=80&w=400",
    steps: [
      { title: "Lead-Lined Snack Storage", content: "Fanum can detect chips from 3 miles away. Store all high-value snacks in a lead-lined container to block the scent." },
      { title: "Deploy the Decoy Prime", content: "Leave an empty bottle of Prime in the middle of the hallway. This will distract the taxman for at least 30 seconds." },
      { title: "The Mach 1 Exit", content: "The moment you hear 'FANUM!', don't look back. Sprint towards the nearest exit at Mach 1 speed." }
    ],
    expertTip: "Never eat in the dark; that's when the tax is highest.",
    thingsYouNeed: [
      "Lead-lined Doritos Bag",
      "Decoy Prime Bottle",
      "Mach 1 Running Shoes",
      "Soundproof Eating Room"
    ],
    qa: [
      { q: "Can I pay the tax in crypto?", a: "Fanum only accepts physical calories. Crypto is for Betas." },
      { q: "What if he's already in my walls?", a: "It's over for you. Just give up the snacks." }
    ],
    warnings: [
      "Fanum is faster than he looks.",
      "Losing your snacks may result in a permanent loss of 500 Aura."
    ]
  },
  {
    id: 3,
    title: "10 Steps to Maximize Your Aura by Edge-maxxing",
    author: "Baby Gronk",
    date: "May 14, 2026",
    category: "Personal Growth",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=400",
    steps: [
      { title: "Never Blink in Public", content: "Blinking is a sign of weakness. Keep your eyes open at all times to maintain a constant flow of aura." },
      { title: "Formal Gym Attire", content: "Showing up to the gym in a 3-piece tuxedo immediately grants you +5000 aura. Lift heavy while looking like a CEO." },
      { title: "Phonk-Only Audio Diet", content: "Your ears should only hear slowed + reverb phonk. This aligns your brainwaves with the Sigma frequency." }
    ],
    expertTip: "If someone asks for the time, tell them 'it's time to grind' and walk away without checking your watch.",
    thingsYouNeed: [
      "3-Piece Tuxedo (Gym Grade)",
      "Bluetooth Headphones (Phonk Locked)",
      "Aura Meter",
      "Patrick Bateman Poster"
    ],
    qa: [
      { q: "Is my Aura debt-collectible?", a: "Yes, the IRS (Internal Rizz Service) can seize your Aura if you fall below 100." },
      { q: "How much Aura does Baby Gronk have?", a: "Infinite. He is the Rizzer of Oz." }
    ],
    warnings: [
      "Edge-maxxing too hard may cause you to float away.",
      "Avoid Alphas who smell like Axe Body Spray; they are Aura vampires."
    ]
  },
  {
    id: 4,
    title: "How to Identify a Sigma Male in the Wild",
    author: "Patrick Bateman",
    date: "May 13, 2026",
    category: "Biology",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    steps: [
      { title: "Check for the Thousand-Yard Stare", content: "A true Sigma is always looking at a future that doesn't exist yet. If they look like they're dissociating, they're probably just grinding." },
      { title: "The American Psycho Metric", content: "Does the subject possess an overly complex skincare routine and a collection of transparent raincoats? If yes, Sigma detected." },
      { title: "Silent Presence", content: "Sigmas do not speak unless necessary. If they communicate via head nods and intense eye contact, they are high-level." }
    ],
    expertTip: "Sigmas often travel alone, except when they are leading a pack of Alphas who don't know they're being led.",
    thingsYouNeed: [
      "Business Card (Bone color, Silian Rail lettering)",
      "Transparent Raincoat",
      "Skincare Routine (15 Steps)",
      "Sigma Grindset Playlist"
    ],
    qa: [
      { q: "Can a Sigma have friends?", a: "Only business associates and rivals. Friends are for people who don't edge-maxx." },
      { q: "Do Sigmas sleep?", a: "No, they just close their eyes and calculate ROI." }
    ],
    warnings: [
      "Approaching a Sigma during a grind session may result in being Roasted by Siri.",
      "Highly infectious grindset energy."
    ]
  },
  {
    id: 5,
    title: "Why You Should Stop Being a Beta and Start Mewing",
    author: "Livvy Dunne",
    date: "May 12, 2026",
    category: "Health",
    image: "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&q=80&w=400",
    steps: [
      { title: "Tongue-to-Roof Contact", content: "Place your tongue firmly against the roof of your mouth. Do not let it drop. This is the foundation of your new jawline." },
      { title: "The Sleep Tape Method", content: "Tape your mouth shut before bed. This forces nasal breathing and prevents you from losing your gains while sleeping." },
      { title: "Hard Chewing Exercises", content: "Chew on frozen carrots or jawline exercisers for 2 hours daily. Your jaw should be able to cut glass by week 4." }
    ],
    expertTip: "If you have to speak, use sign language to avoid breaking your mewing streak.",
    thingsYouNeed: [
      "Mouth Tape (Industrial Grade)",
      "Frozen Carrots",
      "Jawline Exerciser",
      "Sign Language Dictionary"
    ],
    qa: [
      { q: "Can I mew while rizzing?", a: "It's actually encouraged. The jawline adds +50 Rizz." },
      { q: "Will my jaw ever stop hurting?", a: "Pain is just the Beta leaving the body." }
    ],
    warnings: [
      "Do not mew while eating; it's physically impossible and will cause a glitch in the Matrix.",
      "Excessive mewing may result in your jaw becoming a lethal weapon."
    ]
  },
  {
    id: 6,
    title: "How to survive a Grimace Shake from 2023",
    author: "The Rock",
    date: "May 11, 2026",
    category: "Emergency",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400",
    steps: [
      { title: "Pre-emptive Sigma Elixir", content: "Before even looking at the purple shake, consume 500ml of raw Sigma Elixir to build an internal shield." },
      { title: "The 5-Mile Exclusion Zone", content: "If a McDonald's is spotted, maintain a 5-mile radius. The purple energy is airborne and highly contagious." },
      { title: "Counter-TikTok Protocol", content: "If you accidentally drink it, do not film yourself. The camera is what triggers the Grimace transformation." }
    ],
    expertTip: "Carry a mirror at all times; the purple monster cannot stand its own reflection in Ohio.",
    thingsYouNeed: [
      "Sigma Elixir",
      "Mirror",
      "Gas Mask (Purple Filter)",
      "Hazmat Suit"
    ],
    qa: [
      { q: "Is the shake really that bad?", a: "It deleted 3 of my friends from the server. Yes." },
      { q: "Can I rizz up Grimace?", a: "He has negative Aura. Don't even try." }
    ],
    warnings: [
      "The purple energy is sentient.",
      "If you hear 'Happy Birthday Grimace', RUN."
    ]
  }
];

interface Tab {
  id: string;
  url: string;
  history: string[];
  historyIndex: number;
  title: string;
}

interface BrowserViewProps {
  onArticleView?: (isArticle: boolean) => void;
}

export default function BrowserView({ onArticleView }: BrowserViewProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: 'https://www.wikihow.com', history: ['https://www.wikihow.com'], historyIndex: 0, title: 'wikiHow' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [inputUrl, setInputUrl] = useState('https://www.wikihow.com');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; articleId: number | null }>({ visible: false, x: 0, y: 0, articleId: null });

  const activeTab = tabs.find(t => t.id === activeTabId)!;

  useEffect(() => {
    setInputUrl(activeTab.url);
  }, [activeTabId, activeTab.url]);

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let newUrl = inputUrl;
    if (!newUrl.startsWith('http')) {
      newUrl = 'https://' + newUrl;
    }
    
    const newHistory = [...activeTab.history.slice(0, activeTab.historyIndex + 1), newUrl];
    updateTab(activeTabId, {
      url: newUrl,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      title: newUrl.includes('wikihow.com') ? 'wikiHow' : newUrl
    });
  };

  const goBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const newUrl = activeTab.history[newIndex];
      updateTab(activeTabId, {
        historyIndex: newIndex,
        url: newUrl,
        title: newUrl.includes('wikihow.com') ? 'wikiHow' : newUrl
      });
    }
  };

  const goForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const newUrl = activeTab.history[newIndex];
      updateTab(activeTabId, {
        historyIndex: newIndex,
        url: newUrl,
        title: newUrl.includes('wikihow.com') ? 'wikiHow' : newUrl
      });
    }
  };

  const openNewTab = (url: string = 'https://www.wikihow.com') => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTab: Tab = {
      id: newId,
      url,
      history: [url],
      historyIndex: 0,
      title: url.includes('wikihow.com') ? 'wikiHow' : url
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleArticleClick = (articleId: number) => {
    const article = BRAINROT_ARTICLES.find(a => a.id === articleId);
    if (!article) return;
    
    const newUrl = `https://www.wikihow.com/article/${articleId}`;
    const newHistory = [...activeTab.history.slice(0, activeTab.historyIndex + 1), newUrl];
    
    updateTab(activeTabId, {
      url: newUrl,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      title: article.title
    });
  };

  const handleArticleContextMenu = (e: React.MouseEvent, articleId: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      articleId
    });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isWikiHow = activeTab.url.includes('wikihow.com');
  const isArticlePage = activeTab.url.includes('/article/');
  const currentArticleId = isArticlePage ? parseInt(activeTab.url.split('/').pop() || '0') : null;
  const currentArticle = BRAINROT_ARTICLES.find(a => a.id === currentArticleId);

  useEffect(() => {
    if (onArticleView) {
      onArticleView(isArticlePage);
    }
  }, [isArticlePage, onArticleView]);


  return (
    <div className="browser-container">
      <div className="tab-bar-container">
        <div className="browser-tabs">
          {tabs.map(tab => (
            <div 
              key={tab.id} 
              className={`browser-tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <i className="fas fa-globe"></i>
              <span className="tab-title">{tab.title}</span>
              <span className="tab-close" onClick={(e) => closeTab(e, tab.id)}>
                <i className="fas fa-times"></i>
              </span>
            </div>
          ))}
          <div className="new-tab-btn" onClick={() => openNewTab()}>
            <i className="fas fa-plus"></i>
          </div>
        </div>
      </div>

      <div className="browser-toolbar">
        <div className="nav-buttons">
          <button onClick={goBack} disabled={activeTab.historyIndex === 0}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button onClick={goForward} disabled={activeTab.historyIndex === activeTab.history.length - 1}>
            <i className="fas fa-chevron-right"></i>
          </button>
          <button onClick={refresh}>
            <i className={`fas fa-redo ${isRefreshing ? 'fa-spin' : ''}`}></i>
          </button>
        </div>
        <form className="address-bar" onSubmit={handleNavigate}>
          <div className="security-icon">
            <i className="fas fa-lock"></i>
          </div>
          <input 
            type="text" 
            value={inputUrl} 
            onChange={(e) => setInputUrl(e.target.value)}
          />
        </form>
        <div className="browser-actions">
          <i className="fas fa-share-square"></i>
          <i className="fas fa-plus" onClick={() => openNewTab()}></i>
          <i className="fas fa-copy"></i>
        </div>
      </div>

      <div className="browser-content">
        {isWikiHow ? (
          <div className="wikihow-wrapper">
            <header className="wikihow-header">
              <div className="wikihow-logo">
                <span className="wiki">wiki</span><span className="how">How</span>
              </div>
              <div className="wikihow-search">
                <input type="text" placeholder="Search for anything..." />
                <button><i className="fas fa-search"></i></button>
              </div>
              <nav className="wikihow-nav">
                <span>Explore</span>
                <span>Write</span>
                <span>Log in</span>
              </nav>
            </header>
            
            <main className="wikihow-main">
              {isArticlePage && currentArticle ? (
                <div className="article-page">
                  <div className="breadcrumb">
                    <span>wikiHow</span> {' > '} <span>{currentArticle.category}</span> {' > '} <span>{currentArticle.title}</span>
                  </div>
                  <h1>{currentArticle.title}</h1>
                  <div className="article-author-info">
                    <img src="https://ui-avatars.com/api/?name=Brainrot+Editor" alt="Author" />
                    <div>
                      <div className="author-name">Updated by <strong>{currentArticle.author}</strong></div>
                      <div className="publish-date">Last updated: {currentArticle.date}</div>
                    </div>
                  </div>
                  <div className="article-hero-image" style={{ backgroundImage: `url(${currentArticle.image})` }}></div>
                  
                  <div className="article-steps">
                    {currentArticle.steps.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <h2>Step {idx + 1}: {step.title}</h2>
                        <p>{step.content}</p>
                      </React.Fragment>
                    ))}
                    
                    <div className="expert-tip">
                      <strong>Expert Tip:</strong> {currentArticle.expertTip}
                    </div>

                    <div className="things-needed">
                      <h3>Things You'll Need</h3>
                      <ul>
                        {currentArticle.thingsYouNeed.map((thing, idx) => (
                          <li key={idx}>{thing}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="qa-section">
                      <h3>Community Q&A</h3>
                      {currentArticle.qa.map((item, idx) => (
                        <div key={idx} className="qa-item">
                          <div className="question"><strong>Q:</strong> {item.q}</div>
                          <div className="answer"><strong>A:</strong> {item.a}</div>
                        </div>
                      ))}
                    </div>

                    <div className="warnings-section">
                      <h3>Warnings</h3>
                      <ul>
                        {currentArticle.warnings.map((warning, idx) => (
                          <li key={idx} className="warning-item"><i className="fas fa-exclamation-triangle"></i> {warning}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="related-articles-section">
                      <h3>You Might Also Like</h3>
                      <div className="related-grid">
                        {BRAINROT_ARTICLES.filter(a => a.id !== currentArticle.id).slice(0, 3).map(related => (
                          <div key={related.id} className="related-item" onClick={() => handleArticleClick(related.id)}>
                            <div className="related-thumb" style={{ backgroundImage: `url(${related.image})` }}></div>
                            <span>{related.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <section className="featured-section">
                    <h1>Welcome to BrainrotHow</h1>
                    <p>The most trusted how-to site on the internet (in Ohio).</p>
                  </section>

                  <div className="article-grid">
                    {BRAINROT_ARTICLES.map(article => (
                      <div 
                        key={article.id} 
                        className="article-card"
                        onClick={() => handleArticleClick(article.id)}
                        onContextMenu={(e) => handleArticleContextMenu(e, article.id)}
                      >
                        <div className="article-image" style={{ backgroundImage: `url(${article.image})` }}>
                          <span className="category-tag">{article.category}</span>
                        </div>
                        <div className="article-info">
                          <h3>{article.title}</h3>
                          <div className="article-meta">
                            <span>By {article.author}</span>
                            <span>•</span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </main>

            <footer className="wikihow-footer">
              <div className="footer-links">
                <span>About wikiHow</span>
                <span>Terms of Use</span>
                <span>Privacy Policy</span>
              </div>
              <p>© 2026 wikiHow, Inc. All rights reserved.</p>
            </footer>
          </div>
        ) : (
          <div className="generic-page">
            <div className="error-content">
              <i className="fas fa-globe-americas"></i>
              <h2>This site is blocked by your ISP (In Ohio).</h2>
              <p>Please visit <strong>wikihow.com</strong> for the best experience.</p>
              <button onClick={() => { 
                updateTab(activeTabId, { url: 'https://www.wikihow.com', title: 'wikiHow' });
                setInputUrl('https://www.wikihow.com'); 
              }}>Go to wikiHow</button>
            </div>
          </div>
        )}
      </div>

      {contextMenu.visible && (
        <div 
          className="browser-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-item" onClick={() => {
            if (contextMenu.articleId) {
              openNewTab(`https://www.wikihow.com/article/${contextMenu.articleId}`);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }
          }}>
            Open in New Tab
          </div>
          <div className="menu-item" onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}>
            Copy Link Address
          </div>
        </div>
      )}

      <style jsx>{`
        .browser-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: relative;
        }
        .tab-bar-container {
          background: #e0e0e0;
          padding: 8px 8px 0 8px;
          border-bottom: 1px solid #ccc;
        }
        .browser-tabs {
          display: flex;
          gap: 4px;
          align-items: flex-end;
        }
        .browser-tab {
          background: #d0d0d0;
          padding: 6px 12px;
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          min-width: 120px;
          max-width: 200px;
          cursor: pointer;
          border: 1px solid #ccc;
          border-bottom: none;
          color: #555;
          position: relative;
        }
        .browser-tab.active {
          background: #f1f1f1;
          color: #000;
          z-index: 2;
          height: 32px;
        }
        .tab-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tab-close {
          opacity: 0.5;
          padding: 2px;
          border-radius: 50%;
        }
        .tab-close:hover {
          background: rgba(0,0,0,0.1);
          opacity: 1;
        }
        .new-tab-btn {
          padding: 8px;
          color: #555;
          cursor: pointer;
        }
        .new-tab-btn:hover {
          color: #000;
        }
        .browser-toolbar {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: #f1f1f1;
          border-bottom: 1px solid #ddd;
          gap: 15px;
        }
        .nav-buttons {
          display: flex;
          gap: 10px;
        }
        .nav-buttons button {
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          font-size: 14px;
          padding: 5px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .nav-buttons button:hover:not(:disabled) {
          background: #e0e0e0;
        }
        .nav-buttons button:disabled {
          opacity: 0.3;
          cursor: default;
        }
        .address-bar {
          flex: 1;
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 4px 10px;
          gap: 8px;
        }
        .security-icon {
          color: #27ae60;
          font-size: 12px;
        }
        .address-bar input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13px;
          color: #333;
        }
        .browser-actions {
          display: flex;
          gap: 15px;
          color: #555;
          font-size: 14px;
          cursor: pointer;
        }
        .browser-content {
          flex: 1;
          overflow-y: auto;
          background: #fff;
        }

        /* wikiHow Styles */
        .wikihow-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100%;
        }
        .wikihow-header {
          padding: 15px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #e6f2da;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .wikihow-logo {
          font-size: 24px;
          font-weight: 800;
        }
        .wiki { color: #333; }
        .how { color: #93be3d; }
        .wikihow-search {
          display: flex;
          flex: 0 1 500px;
          margin: 0 20px;
        }
        .wikihow-search input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #ccc;
          border-right: none;
          border-radius: 4px 0 0 4px;
          outline: none;
        }
        .wikihow-search button {
          padding: 0 15px;
          background: #93be3d;
          color: white;
          border: 1px solid #93be3d;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
        }
        .wikihow-nav {
          display: flex;
          gap: 20px;
          font-weight: 600;
          color: #555;
        }
        .wikihow-main {
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .featured-section {
          text-align: center;
          margin-bottom: 40px;
        }
        .featured-section h1 {
          font-size: 32px;
          color: #333;
          margin-bottom: 10px;
        }
        .featured-section p {
          color: #666;
          font-size: 18px;
        }
        .article-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 25px;
        }
        .article-card {
          border: 1px solid #eee;
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .article-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
        .article-image {
          height: 200px;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .category-tag {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #93be3d;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .article-info {
          padding: 15px;
        }
        .article-info h3 {
          font-size: 18px;
          color: #333;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .article-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #888;
        }
        .wikihow-footer {
          margin-top: auto;
          padding: 40px;
          background: #f9f9f9;
          text-align: center;
          border-top: 1px solid #eee;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 10px;
          color: #93be3d;
          font-weight: 600;
        }
        .wikihow-footer p {
          color: #888;
          font-size: 14px;
        }

        .article-page {
          max-width: 800px;
          margin: 0 auto;
          text-align: left;
        }
        .breadcrumb {
          font-size: 12px;
          color: #888;
          margin-bottom: 20px;
        }
        .breadcrumb span {
          color: #93be3d;
          cursor: pointer;
        }
        .article-page h1 {
          font-size: 36px;
          margin-bottom: 20px;
          color: #333;
        }
        .article-author-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .article-author-info img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        .author-name { font-size: 14px; }
        .publish-date { font-size: 12px; color: #888; }
        .article-hero-image {
          height: 400px;
          background-size: cover;
          background-position: center;
          border-radius: 12px;
          margin-bottom: 40px;
        }
        .article-steps h2 {
          font-size: 24px;
          color: #333;
          margin: 30px 0 15px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .article-steps h2::before {
          content: "✓";
          background: #93be3d;
          color: white;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 14px;
        }
        .article-steps p {
          font-size: 16px;
          line-height: 1.6;
          color: #444;
          margin-bottom: 20px;
        }
        .expert-tip {
          background: #f4f9e9;
          border-left: 4px solid #93be3d;
          padding: 20px;
          border-radius: 0 8px 8px 0;
          margin: 30px 0;
        }
        .things-needed, .qa-section, .warnings-section, .related-articles-section {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
        .things-needed h3, .qa-section h3, .warnings-section h3, .related-articles-section h3 {
          font-size: 20px;
          margin-bottom: 20px;
          color: #333;
        }
        .things-needed ul {
          list-style: disc;
          padding-left: 20px;
        }
        .things-needed li {
          margin-bottom: 10px;
          color: #555;
        }
        .qa-item {
          margin-bottom: 20px;
        }
        .question { color: #333; margin-bottom: 5px; }
        .answer { color: #666; font-size: 14px; }
        .warning-item {
          color: #e67e22;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .related-item {
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .related-item:hover {
          opacity: 0.8;
        }
        .related-thumb {
          height: 80px;
          background-size: cover;
          background-position: center;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .related-item span {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .browser-context-menu {
          position: fixed;
          background: #fff;
          border: 1px solid #ccc;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 5px 0;
          z-index: 10000;
          min-width: 160px;
        }
        .browser-context-menu .menu-item {
          padding: 8px 15px;
          font-size: 12px;
          cursor: pointer;
          color: #333;
        }
        .browser-context-menu .menu-item:hover {
          background: #3498db;
          color: #fff;
        }

        .generic-page {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px;
        }
        .error-content i {
          font-size: 64px;
          color: #ccc;
          margin-bottom: 20px;
        }
        .error-content h2 {
          font-size: 24px;
          color: #333;
          margin-bottom: 10px;
        }
        .error-content p {
          color: #666;
          margin-bottom: 20px;
        }
        .error-content button {
          padding: 10px 20px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
