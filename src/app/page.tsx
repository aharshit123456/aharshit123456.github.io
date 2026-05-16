'use client';

import { useState, useEffect, useRef } from 'react';
import FamcareNotes from '@/components/portfolio/FamcareNotes';
import ShoppinStats from '@/components/portfolio/ShoppinStats';
import ProductionContent, { ProductionKey } from '@/components/portfolio/ProductionContent';
import FreelanceExperience from '@/components/portfolio/FreelanceExperience';
import TerminalView from '@/components/portfolio/TerminalView';
import MatrixRain from '@/components/portfolio/MatrixRain';
import DMGInstaller from '@/components/portfolio/DMGInstaller';
import Dock from '@/components/portfolio/Dock';
import ControlCenter from '@/components/portfolio/ControlCenter';
import Spotlight from '@/components/portfolio/Spotlight';
import WallpaperSwitcher from '@/components/portfolio/WallpaperSwitcher';
import GuestbookWidget from '@/components/portfolio/GuestbookWidget';
import Launchpad from '@/components/portfolio/Launchpad';
import ClapButton from '@/components/portfolio/ClapButton';
import SiriAssistant from '@/components/portfolio/SiriAssistant';
import DocumentsManager from '../components/portfolio/DocumentsManager';
import SecretBoss from '../components/portfolio/SecretBoss';
import MessagesView from '@/components/portfolio/MessagesView';
import BrowserView from '@/components/portfolio/BrowserView';
import DesktopPet from '@/components/portfolio/DesktopPet';


type Tab = {
  id: string;
  title: string;
  content: string | React.ReactNode;
  isIframe?: boolean;
};

export default function Portfolio() {
  const [activeTabId, setActiveTabId] = useState('main');
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'main', title: 'harshit_agarwal.dev', content: null }
  ]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFlipped, setIsFlipped] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [famcareScreenshotsVisible, setFamcareScreenshotsVisible] = useState(false);
  const [shoppinScreenshotsVisible, setShoppinScreenshotsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [iconPosition, setIconPosition] = useState({ x: 40, y: 40 });
  const [isDMGOpen, setIsDMGOpen] = useState(false);
  const [dmgIconPosition, setDmgIconPosition] = useState({ x: 40, y: 340 });

  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isMessagesMinimized, setIsMessagesMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isFreelanceOpen, setIsFreelanceOpen] = useState(false);
  const [isFreelanceMinimized, setIsFreelanceMinimized] = useState(false);
  const [freelanceIconPosition, setFreelanceIconPosition] = useState({ x: 40, y: 140 });

  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [terminalIconPosition, setTerminalIconPosition] = useState({ x: 40, y: 240 });

  const [resumeIconPosition, setResumeIconPosition] = useState({ x: 40, y: 340 });

  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isDocsMinimized, setIsDocsMinimized] = useState(false);
  const [docsIconPosition, setDocsIconPosition] = useState({ x: 40, y: 140 });

  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isBrowserMinimized, setIsBrowserMinimized] = useState(false);
  const [browserIconPosition, setBrowserIconPosition] = useState({ x: 40, y: 440 });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [hasMounted, setHasMounted] = useState(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isWallpaperSwitcherOpen, setIsWallpaperSwitcherOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState('/wallpapers/space.jpg');
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(60);
  const [isAppleMenuOpen, setIsAppleMenuOpen] = useState(false);
  const [isWifiMenuOpen, setIsWifiMenuOpen] = useState(false);
  const [activeWifi, setActiveWifi] = useState('aharshit123456.space');
  const [isBatteryMenuOpen, setIsBatteryMenuOpen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(12);
  const [isClockMenuOpen, setIsClockMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isLaunchpadOpen, setIsLaunchpadOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ images: string[], currentIndex: number, altPrefix: string } | null>(null);
  const [isWin95, setIsWin95] = useState(false);
  const [isBossActive, setIsBossActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [islandText, setIslandText] = useState('Unlocked');
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [windowPositions, setWindowPositions] = useState({
    terminal: { x: 100, y: 100 },
    freelance: { x: 150, y: 150 },
    dmg: { x: 300, y: 200 },
    main: { x: 50, y: 50 },
    docs: { x: 120, y: 120 },
    messages: { x: 100, y: 100 },
    browser: { x: 80, y: 80 },
    ql: { x: 0, y: 0 }
  });

  const [isReadingArticle, setIsReadingArticle] = useState(false);
  const [articleTimer, setArticleTimer] = useState(0);
  const [isPetTriggered, setIsPetTriggered] = useState(false); // Cat
  const [terminalCmdCount, setTerminalCmdCount] = useState(0);
  const [isCrabTriggered, setIsCrabTriggered] = useState(false); // Crab

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isReadingArticle && !isPetTriggered) {
      timer = setInterval(() => {
        setArticleTimer(prev => {
          if (prev >= 15) { // 15 seconds of reading triggers the pet
            setIsPetTriggered(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setArticleTimer(0);
    }
    return () => clearInterval(timer);
  }, [isReadingArticle, isPetTriggered]);
  const activeDragWindow = useRef<'terminal' | 'freelance' | 'dmg' | 'main' | 'docs' | 'messages' | 'browser' | 'ql' | null>(null);

  const windowDragOffset = useRef({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartTime = useRef(0);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };
  const activeDragIcon = useRef<'main' | 'freelance' | 'terminal' | 'resume' | 'docs' | 'browser' | null>(null);


  const [activeSpace, setActiveSpace] = useState(0); // 0: Desktop, 1: Fullscreen
  const [fullscreenWindow, setFullscreenWindow] = useState<'main' | 'freelance' | 'terminal' | null>(null);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Theme Toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Tab Logic
  const openTab = (id: string, title: string, content: string | React.ReactNode, isIframe = false) => {
    const existingTab = tabs.find(t => t.id === id);
    if (existingTab) {
      setActiveTabId(id);
      return;
    }
    setTabs([...tabs, { id, title, content, isIframe }]);
    setActiveTabId(id);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === 'main') return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const switchTab = (id: string) => {
    setActiveTabId(id);
  };

  // Profile Hint
  useEffect(() => {
    const hintTimer = setTimeout(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 4000);
    }, 4000);

    const interval = setInterval(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 4000);
    }, 60000);

    return () => {
      clearTimeout(hintTimer);
      clearInterval(interval);
    };
  }, []);

  // Battery Drain Simulation
  useEffect(() => {
    if (!hasMounted) return;
    const interval = setInterval(() => {
      setBatteryLevel(prev => (prev > 1 ? prev - 1 : 100));
    }, 60000); // 1% per minute for demo
    return () => clearInterval(interval);
  }, [hasMounted]);

  const playSound = (sound: 'startup' | 'funk' | 'tink' | 'click') => {
    const urls = {
      startup: 'https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Hero.mp3',
      funk: 'https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Funk.mp3',
      tink: 'https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Tink.mp3',
      click: '/click.mp3'
    };
    
    const audio = new Audio(urls[sound]);
    audio.volume = 0.5;
    audio.play().catch(e => {
      console.log('Audio playback blocked or failed, trying local click fallback');
      if (sound !== 'click') {
        const fallback = new Audio('/click.mp3');
        fallback.volume = 0.3;
        fallback.play().catch(() => {});
      }
    });
  };

  useEffect(() => {
    if (isLoggedIn) {
      playSound('startup');
    }
  }, [isLoggedIn]);

  // Sections with Read More
  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSectionItems = (items: React.ReactNode[], sectionId: string) => {
    const isExpanded = expandedSections[sectionId];
    const visibleItems = isExpanded ? items : items.slice(0, 3);
    return (
      <>
        {visibleItems}
        {items.length > 3 && (
          <button className="read-more-btn" onClick={() => toggleSection(sectionId)}>
            {isExpanded ? (
              <>Read Less <i className="fas fa-chevron-up"></i></>
            ) : (
              <>Read More <i className="fas fa-chevron-down"></i></>
            )}
          </button>
        )}
      </>
    );
  };
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const minimizeAllWindows = () => {
    setIsMinimized(true);
    setIsTerminalMinimized(true);
    setIsDocsMinimized(true);
    setIsMessagesMinimized(true);
    setIsFreelanceMinimized(true);
    setIsBrowserMinimized(true);
    setIsDMGOpen(false);
    setActiveSpace(0);
  };


  const handleWindowMouseDown = (e: React.MouseEvent, type: keyof typeof windowPositions) => {
    activeDragWindow.current = type;
    windowDragOffset.current = {
      x: e.clientX - windowPositions[type].x,
      y: e.clientY - windowPositions[type].y
    };
    e.stopPropagation();
  };

  useEffect(() => {
    if (selectedImage && windowPositions.ql.x === 0) {
      setWindowPositions(prev => ({
        ...prev,
        ql: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      }));
    }
  }, [selectedImage]);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent, type: 'main' | 'freelance' | 'terminal' | 'resume' | 'docs' | 'browser') => {
    if (type === 'main' && !isMinimized) return;
    if (type === 'freelance' && isFreelanceOpen && !isFreelanceMinimized) return;
    if (type === 'terminal' && isTerminalOpen && !isTerminalMinimized) return;
    if (type === 'docs' && isDocsOpen && !isDocsMinimized) return;
    if (type === 'browser' && isBrowserOpen && !isBrowserMinimized) return;

    activeDragIcon.current = type as any;

    const pos = type === 'main' ? iconPosition :
      type === 'freelance' ? freelanceIconPosition :
        type === 'terminal' ? terminalIconPosition :
          type === 'docs' ? docsIconPosition :
            resumeIconPosition;

    setIsDragging(true);

    dragStartTime.current = Date.now();
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: (window.innerHeight - e.clientY) - pos.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeDragWindow.current) {
        const type = activeDragWindow.current;
        setWindowPositions(prev => ({
          ...prev,
          [type]: {
            x: e.clientX - windowDragOffset.current.x,
            y: e.clientY - windowDragOffset.current.y
          }
        }));
        return;
      }
      if (!activeDragIcon.current) return;

      const newX = e.clientX - dragOffset.current.x;
      const newY = (window.innerHeight - e.clientY) - dragOffset.current.y;

      const boundedX = Math.max(10, Math.min(window.innerWidth - 80, newX));
      const boundedY = Math.max(10, Math.min(window.innerHeight - 100, newY));

      if (activeDragIcon.current === 'main') {
        setIconPosition({ x: boundedX, y: boundedY });
      } else if (activeDragIcon.current === 'freelance') {
        setFreelanceIconPosition({ x: boundedX, y: boundedY });
      } else if (activeDragIcon.current === 'terminal') {
        setTerminalIconPosition({ x: boundedX, y: boundedY });
      } else if (activeDragIcon.current === 'docs') {
        setDocsIconPosition({ x: boundedX, y: boundedY });
      } else if (activeDragIcon.current === 'resume') {
        setResumeIconPosition({ x: boundedX, y: boundedY });
      } else if (activeDragIcon.current === 'browser') {
        setBrowserIconPosition({ x: boundedX, y: boundedY });
      }
    };


    const handleMouseUp = () => {
      activeDragIcon.current = null;
      setIsDragging(false);
      activeDragWindow.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        setIsSpotlightOpen(prev => !prev);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!selectedImage) return;

    const handleViewerKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImage(prev => prev ? { ...prev, currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length } : null);
      } else if (e.key === 'ArrowRight') {
        setSelectedImage(prev => prev ? { ...prev, currentIndex: (prev.currentIndex + 1) % prev.images.length } : null);
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleViewerKeyDown);
    return () => window.removeEventListener('keydown', handleViewerKeyDown);
  }, [selectedImage]);

  useEffect(() => {
    setHasMounted(true);
    // Check for nontech mode bypass
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'nontech') {
      setIsLoggedIn(true);
    }

    // Mobile Detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Island auto-collapse
    const timer = setTimeout(() => setIslandText('aharshit123456.space'), 3000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let index = 0;

    const handleKonamiKeydown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[index]) {
        index++;
        if (index === konamiCode.length) {
          setIsWin95(prev => !prev);
          setIsBossActive(true);
          index = 0;
        }
      } else {
        index = 0;
      }
    };

    window.addEventListener('keydown', handleKonamiKeydown);
    return () => window.removeEventListener('keydown', handleKonamiKeydown);
  }, []);

  useEffect(() => {
    const closeMenu = () => setContextMenu({ visible: false, x: 0, y: 0 });
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleTerminalCommand = (cmd: string) => {
    if (cmd === 'matrix-start') setIsMatrixActive(true);
    if (cmd === 'matrix-stop') setIsMatrixActive(false);
    
    setTerminalCmdCount(prev => {
      const next = prev + 1;
      if (next >= 5) setIsCrabTriggered(true);
      return next;
    });
  };

  const openQuickLook = (images: string[], index: number, altPrefix: string) => {
    setSelectedImage({ images, currentIndex: index, altPrefix });
  };

  const handleMaximize = (type: 'main' | 'freelance' | 'terminal') => {
    setFullscreenWindow(type);
    setActiveSpace(1);
  };

  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => touchStartX = e.touches[0].clientX;
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 100) {
        if (diff > 0 && activeSpace === 0 && fullscreenWindow) setActiveSpace(1);
        else if (diff < 0 && activeSpace === 1) setActiveSpace(0);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > 50) {
        if (e.deltaX > 0 && activeSpace === 0 && fullscreenWindow) setActiveSpace(1);
        else if (e.deltaX < 0 && activeSpace === 1) setActiveSpace(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [activeSpace, fullscreenWindow]);

  const handleIconClick = (type: 'main' | 'freelance' | 'terminal' | 'resume' | 'browser') => {
    const dragDuration = Date.now() - dragStartTime.current;
    if (dragDuration < 200) {
      if (type === 'main') toggleMinimize();
      else if (type === 'freelance') {
        if (!isFreelanceOpen) setIsFreelanceOpen(true);
        else setIsFreelanceMinimized(!isFreelanceMinimized);
      } else if (type === 'terminal') {
        if (!isTerminalOpen) setIsTerminalOpen(true);
        else setIsTerminalMinimized(!isTerminalMinimized);
      } else if (type === 'resume') {
        setIsDMGOpen(true);
      } else if (type === 'browser') {
        if (!isBrowserOpen) setIsBrowserOpen(true);
        else setIsBrowserMinimized(!isBrowserMinimized);
      }
    }
  };


  const renderMainContent = () => (
    <>
      <div className="tab-bar">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => switchTab(tab.id)}
          >
            <span className="tab-title">{tab.title}</span>
            {tab.id !== 'main' && (
              <span className="tab-close" onClick={(e) => closeTab(e, tab.id)}>
                <i className="fas fa-times"></i>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Tab */}
      <div className={`tab-content ${activeTabId === 'main' ? 'active' : ''}`}>
          <header className="nav-header">
            <div className="nav-item">
              <span className="label">//portfolio</span>
              <a href="#" className="link" id="nav-portfolio">harshit_agarwal.dev</a>
            </div>
            <div className="nav-item">
              <span className="label">//contact</span>
              <a href="mailto:aharshit123456@gmail.com" className="link" id="nav-contact" aria-label="Email Harshit Agarwal">aharshit123456@gmail.com</a>
            </div>
            <div className="nav-item">
              <span className="label">//github</span>
              <a href="https://github.com/aharshit123456" target="_blank" rel="noopener noreferrer" className="link" id="nav-github" aria-label="Harshit's GitHub Profile">github.com/aharshit123456</a>
            </div>
            <div className="nav-item">
              <span className="label">//linkedin</span>
              <a href="https://www.linkedin.com/in/aharshit123456/" target="_blank" rel="noopener noreferrer" className="link" id="nav-linkedin" aria-label="Harshit's LinkedIn Profile">linkedin.com/in/aharshit123456</a>
            </div>
            <div className="nav-item">
              <span className="label">//archive</span>
              <a href="index_v1.html" className="link" id="nav-archive" aria-label="View previous version of portfolio">v1.0 (Old Version)</a>
            </div>
          </header>

          <main>
            <section className="hero-section">
              <div className="profile-flip-container" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`flipper ${isFlipped ? 'flipped' : ''}`}>
                  <div className="front">
                    <img src="profile_new.jpg" alt="Harshit Agarwal" className="profile-pic" />
                  </div>
                  <div className="back">
                    <img src="me.png" alt="Me IRL" className="profile-pic" />
                  </div>
                </div>
                <div className={`flip-hint ${showHint ? 'visible' : ''}`}>Click to flip</div>
              </div>
              <div className="hero-text">
                <h1>
                  <span style={{ color: 'var(--code-comment)', opacity: 0.5 }}>&lt;</span>
                  Harshit Agarwal
                  <span style={{ color: 'var(--code-comment)', opacity: 0.5 }}>&gt;</span>
                </h1>
                <h2>// Fullstack Developer & Researcher</h2>
                <p className="tagline">"Not everyone who works hard is rewarded, but all those who succeed have worked hard." - Genji Kamogawa</p>
                <div className="hero-links">
                  <a href="#about">//about</a>
                  <a href="#experience">//experience</a>
                  <a href="#projects">//projects</a>
                  <a href="#hackathons">//hackathons</a>
                  <a href="#skills">//skills</a>
                </div>
              </div>
            </section>

            <hr className="divider" />

            <section className="about-section" id="about">
              <h3>//about</h3>
              <p className="code-block">
                class Harshit: <br />
                &nbsp;&nbsp;def __init__(self):<br />
                &nbsp;&nbsp;&nbsp;&nbsp;self.role = "Founding SDE & System Architect"<br />
                &nbsp;&nbsp;&nbsp;&nbsp;self.location = "India"<br />
                &nbsp;&nbsp;&nbsp;&nbsp;self.education = "B.Tech CSE @ KIIT (9.3 CGPA)"<br />
                &nbsp;&nbsp;&nbsp;&nbsp;self.loves = ["Building Scalable Systems", "AI/ML", "Hajime no Ippo"]<br />
                <br />
                &nbsp;&nbsp;def goals(self):<br />
                &nbsp;&nbsp;&nbsp;&nbsp;return "Building intuitive experiences that constantly grow."
              </p>
              <p className="bio">
                Hi, I'm Harshit. I enjoy building dynamic, creative products from start to finish.
                Currently an undergrad at KIIT, I've architected the Famcare ecosystem, built AI systems for fashion at scale, and developed drone sensor calibration systems.
                I'm a heavyweight coder with a reach extending from low-level C++ to high-level Distributed Systems.
              </p>
            </section>

            <hr className="divider" />

            <section className="skills-section" id="skills">
              <h3>//tale_of_the_tape (skills)</h3>
              <div className="skills-grid">
                <div className="skill-category"><strong>Languages:</strong><br /> [Python, C/C++, Java, Go, JS/TS, Kotlin, C#]</div>
                <div className="skill-category"><strong>Frameworks:</strong><br /> [NextJS, React, Flutter, FastAPI, PyTorch, TensorFlow]</div>
                <div className="skill-category"><strong>Cloud/DevOps:</strong><br /> [AWS, Docker, K8s, Terraform, CI/CD]</div>
                <div className="skill-category"><strong>Databases:</strong><br /> [PostgreSQL, MongoDB, Redis, Firebase]</div>
                <div className="skill-category"><strong>Tools:</strong><br /> [Git, Linux, Unity, ROS]</div>
              </div>
            </section>

            <hr className="divider" />

            <section className="curations-section" id="curations">
              <h3>//digital_presence (socials & curations)</h3>
              <div className="skills-grid">
                <div className="skill-category">
                  <strong><i className="fas fa-list"></i> Curations:</strong><br />
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a href="https://letterboxd.com/aharshit123456/" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fas fa-film"></i> Letterboxd (Movies)
                    </a>
                    <a href="https://previouslyon.cosq.in/user/aharshit123456" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fas fa-tv"></i> Previously On (Shows)
                    </a>
                    <a href="https://www.goodreads.com/user/show/55541393-harshit-agarwal" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fas fa-book"></i> Goodreads (Books)
                    </a>
                  </div>
                </div>
                <div className="skill-category">
                  <strong><i className="fas fa-share-alt"></i> Socials:</strong><br />
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a href="https://instagram.com/aharshit123456" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fab fa-instagram"></i> Instagram
                    </a>
                    <a href="https://x.com/aharshit123456" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fab fa-twitter"></i> X / Twitter
                    </a>
                    <a href="https://account.xbox.com/en-us/profile?gamertag=aharsht12345" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fab fa-xbox"></i> Xbox (aharsht12345)
                    </a>
                    <a href="https://www.twitch.tv/aharsh123456" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fab fa-twitch"></i> Twitch
                    </a>
                    <a href="https://open.spotify.com/user/aharshit123456" target="_blank" rel="noopener noreferrer" className="blog-link">
                      <i className="fab fa-spotify"></i> Spotify
                    </a>
                    <div style={{ marginTop: '10px' }}>
                      <iframe
                        style={{ borderRadius: '12px', border: 'none' }}
                        src="https://open.spotify.com/embed/playlist/37i9dQZEVXdjx1ziQCmPxM?utm_source=generator&theme=0"
                        width="100%"
                        height="152"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="divider" />

            <section className="experience-section" id="experience">
              <h3>//work_experience</h3>
              {renderSectionItems([
                <div className="exp-item" key="famcare">
                  <div className="time">April 2026 - Present</div>
                  <div className="details">
                    <h4>
                      <a href="https://famcare.co.in" style={{ color: '#ff4d4d' }} id="exp-famcare-link">Famcare</a>
                      <ClapButton projectId="famcare" />
                      <span className="role">//Fullstack Architect & Lead</span>
                      <button className={`screenshot-toggle ${famcareScreenshotsVisible ? 'active' : ''}`} id="btn-famcare-screenshots" onClick={() => setFamcareScreenshotsVisible(!famcareScreenshotsVisible)} aria-expanded={famcareScreenshotsVisible}>
                        <i className={famcareScreenshotsVisible ? "fas fa-times" : "fas fa-images"}></i> {famcareScreenshotsVisible ? 'Hide' : 'Screenshots'}
                      </button>
                      <a href="https://play.google.com/store/apps/details?id=com.famcare.praja&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className="store-link" title="Play Store" aria-label="Famcare on Google Play Store">
                        <i className="fab fa-google-play"></i>
                      </a>
                      <a href="https://apps.apple.com/in/app/famcare-caregiver-in-minutes/id6761720384" target="_blank" rel="noopener noreferrer" className="store-link" title="App Store" aria-label="Famcare on Apple App Store">
                        <i className="fab fa-apple"></i>
                      </a>
                    </h4>
                    <ul>
                      <li><strong>Architected and delivered</strong> the FamCARE full-stack ecosystem, scaling a modular <strong>FastAPI backend</strong> and <strong>3 cross-platform Flutter apps</strong> from zero to production with <strong>500+ commits</strong> across 4 repositories.</li>
                      <li><strong>Engineered a high-throughput API architecture</strong>, verified via custom stress testing to handle <strong>2,000+ requests/minute</strong> and <strong>100 concurrent users</strong> with a <strong>100% success rate</strong> for core operational flows.</li>
                      <li><strong>Engineered a modular monolith architecture</strong> with <strong>15+ decoupled services</strong> designed for the <strong>Strangler Pattern</strong>, managing complex <strong>Order/Booking</strong> flows, <strong>Razorpay</strong> payments, and a multi-channel notification engine (<strong>FCM</strong>, <strong>Fast2SMS</strong>, <strong>MSG91</strong>).</li>
                      <li><strong>Optimized operational velocity</strong>, reducing deployment cycles by <strong>70%</strong> through <strong>Fastlane CI/CD</strong> and automating caregiver background checks via <strong>SpringVerify</strong>, while maintaining sub-second latency for real-time <strong>WebSocket</strong> tracking.</li>
                      <li style={{ listStyle: 'none', marginLeft: '-20px', marginTop: '10px' }}>
                        <button onClick={() => openFamcareNotes()} className="hobby-btn" style={{ fontSize: '0.8rem', padding: '5px 15px' }}>
                          <i className="fas fa-book-open"></i> Personal Notes & Learning
                        </button>
                      </li>
                    </ul>
                    {famcareScreenshotsVisible && (
                      <div className="screenshot-viewer">
                        <div className="screenshot-scroller">
                          {[1, 2, 3, 4, 5].map((num, i) => (
                            <img
                              key={num}
                              src={`assets/famcare/${num}.webp`}
                              alt={`Famcare ${num}`}
                              onClick={() => openQuickLook(['assets/famcare/1.webp', 'assets/famcare/2.webp', 'assets/famcare/3.webp', 'assets/famcare/4.webp', 'assets/famcare/5.webp'], i, 'Famcare')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>,
                <div className="exp-item" key="endorphind">
                  <div className="time">Jan 2026 - Present</div>
                  <div className="details">
                    <h4><a href="http://endorphind.com/" style={{ color: '#ff4d4d' }}>endorphind</a> <ClapButton projectId="endorphind" /> <span className="role">//Founding SDE (AI & Systems)</span></h4>
                    <ul>
                      <li><strong>Generative Video AI:</strong> Engineered SOTA lip-sync and video generation pipelines using Wan 2.2/2.6, LatentSync, and InfiniteTalk (GGUF). Integrated ElevenLabs and F5 for high-fidelity voice cloning.</li>
                      <li><strong>Workflow Automation:</strong> Developed custom ComfyUI nodes and automated media generation tools for high-throughput digital avatar production.</li>
                      <li><strong>System Design & Leadership:</strong> Managing 2-3 intern SDEs, overseeing client-facing system architecture, and leading platform technical scoping.</li>
                      <li><strong>Product Engineering:</strong> Scoped and architected the "LangLearn" educational module, focusing on LLM-driven story generation and vocabulary tracking.</li>
                    </ul>
                  </div>
                </div>,
                <div className="exp-item" key="shoppin">
                  <div className="time">Dec 2024 - Nov 2025</div>
                  <div className="details">
                    <h4>
                      <a href="https://shoppin.app" style={{ color: '#ff4d4d' }} id="exp-shoppin-link">shoppin'</a> <ClapButton projectId="shoppin" /> — USAR Commerce Technologies
                      <span className="role">//Founding ML Engineer (AI/Infra)</span>
                      <button className={`screenshot-toggle ${shoppinScreenshotsVisible ? 'active' : ''}`} id="btn-shoppin-screenshots" onClick={() => setShoppinScreenshotsVisible(!shoppinScreenshotsVisible)} aria-expanded={shoppinScreenshotsVisible}>
                        <i className={shoppinScreenshotsVisible ? "fas fa-times" : "fas fa-images"}></i> {shoppinScreenshotsVisible ? 'Hide' : 'Screenshots'}
                      </button>
                      <a href="https://play.google.com/store/apps/details?id=app.shoppin.ios" target="_blank" rel="noopener noreferrer" className="store-link" title="Play Store" aria-label="Shoppin' on Google Play Store">
                        <i className="fab fa-google-play"></i>
                      </a>
                      <a href="https://apps.apple.com/in/app/shoppin-ai-discovery-try-on/id6738202299" target="_blank" rel="noopener noreferrer" className="store-link" title="App Store" aria-label="Shoppin' on Apple App Store">
                        <i className="fab fa-apple"></i>
                      </a>
                    </h4>
                    <ul>
                      <li><strong>Multimodal AI</strong>: Developed scalable ML pipelines (3-4 crore items). Deployed CLIP/VLLM systems for search & recs. Led end-to-end visual AI stack (YOLO, RT-DETR, MaskRCNN, Diffusion-based VTON).</li>
                      <li><strong>Scalable Infra</strong>: Built distributed image/video preprocessing pipelines. Dockerized and served models on AWS SageMaker.</li>
                      <li><strong>Backend & Automation</strong>: Designed CRUD APIs, integrated Redis/Alembic. Created high-throughput scraping agents for 200+ partner stores.</li>
                      <li><strong>Cloud & DevOps</strong>: Architected AWS EKS clusters with GitOps (Terraform, CI/CD). Enabled disaster recovery setups.</li>
                      <li style={{ listStyle: 'none', marginLeft: '-20px', marginTop: '10px' }}>
                        <button onClick={() => openShoppinStats()} className="hobby-btn" style={{ fontSize: '0.8rem', padding: '5px 15px' }}>
                          <i className="fas fa-chart-line"></i> View Progression (Lv. 1 &rarr; Lv. 10)
                        </button>
                      </li>
                    </ul>
                    {shoppinScreenshotsVisible && (
                      <div className="screenshot-viewer">
                        <div className="screenshot-scroller">
                          {[1, 2, 3, 4, 5].map((num, i) => (
                            <img
                              key={num}
                              src={`assets/shoppin/${num}.webp`}
                              alt={`shoppin ${num}`}
                              onClick={() => openQuickLook(['assets/shoppin/1.webp', 'assets/shoppin/2.webp', 'assets/shoppin/3.webp', 'assets/shoppin/4.webp', 'assets/shoppin/5.webp'], i, 'Shoppin')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>,
                <div className="exp-item" key="alohomora">
                  <div className="time">Jan 2025 - Present</div>
                  <div className="details">
                    <h4>Alohomora Labs <span className="role">//Research Lead <a style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }} href="https://alohomora-labs.me" target="_blank" rel="noopener noreferrer" aria-label="Visit Alohomora Labs website">[Link]</a> </span></h4>
                    <ul>
                      <li><strong>gaitSetPy:</strong> Implemented Python package for gait analysis (10k+ samples). Added 50+ preprocessing functions, reducing processing time by 40%.</li>
                      <li><strong>Parkinson's Research:</strong> Worked with Dr. Jayeeta Chakraborty. Applied CNNs/LSTMs/GNNs to predict FOG events and gait imbalances. (Paper submitted to Health and Technology).</li>
                    </ul>
                  </div>
                </div>,
                <div className="exp-item" key="niser">
                  <div className="time">May 2024 - Nov 2024</div>
                  <div className="details">
                    <h4>SMLab, NISER <span className="role">//Research Intern</span> <a href="#" onClick={(e) => { e.preventDefault(); openImageTab('NISER Certificate', 'niser_cert.jpg'); }} style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>[Certificate]</a></h4>
                    <ul>
                      <li>Crafted iPhone-Drone Sensor Calibration & ARKit 3D Modeling system (180Hz data via TCP).</li>
                      <li>Built Web Console for self-driving motorcycle (ROS2) handling 25+ sensors with 0.2ms latency.</li>
                      <li>Created SLAM-based toolkits (Kalman Filters, NeRFs, Gaussian Mapping).</li>
                    </ul>
                  </div>
                </div>
              ], 'experience')}
            </section>

            <hr className="divider" />

            <section className="projects-section" id="projects">
              <h3>//projects & publications</h3>
              {renderSectionItems([
                <div className="project-card" key="wham">
                  <div className="project-header">
                    <h4>WHAM! OTT <ClapButton projectId="wham" /> <a href="https://wham.cosq.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit WHAM! OTT website">[Web]</a></h4>
                    <span className="tech-stack">React 18, Vite, FastAPI, Supabase, HLS/M3U8. CapacitorJS</span>
                  </div>
                  <ul>
                    <li><strong>Hybrid Playback:</strong> Custom video engine integrating FastPix (H264/HLS) and VidRock (Iframe) with real-time "Switch Player" toggle.</li>
                    <li><strong>Comicpaneled UI:</strong> Immersive "Living Comic Book" design with "Noir Mode" toggle, infinite carousels, and "BAM!" click-animations.</li>
                    <li><strong>Tech Achievements:</strong> Cross-origin watch progress synchronization (postMessage), TMDB data ingestion with fallback logic, and theme-aware Giscus comments.</li>
                  </ul>
                </div>,
                <div className="project-card" key="previously">
                  <div className="project-header">
                    <h4>PreviouslyOn <ClapButton projectId="previouslyon" /> <a href="https://github.com/aharshit123456/previouslyon" target="_blank" rel="noopener noreferrer" aria-label="View PreviouslyOn source code on GitHub">[GitHub]</a> <a href="http://previouslyon.cosq.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit PreviouslyOn website">[Web]</a></h4>
                    <span className="tech-stack">Next.js, Supabase</span>
                  </div>
                  <p>"Developed a full-stack social TV tracking application using Next.js and Supabase, featuring real-time user activity feeds, custom list curation, and polymorphic review systems. Integrated Gemini AI for personalized content recommendations."</p>
                </div>,
                <div className="project-card" key="gaitset">
                  <div className="project-header">
                    <h4>gaitSetPy <ClapButton projectId="gaitsetpy" /> <a href="https://github.com/Alohomora-Labs/gaitSetPy" target="_blank" rel="noopener noreferrer" aria-label="View gaitSetPy on GitHub">[GitHub]</a> <a href="https://www.alohomora-labs.me" target="_blank" rel="noopener noreferrer" aria-label="Visit Alohomora Labs website">[Web]</a></h4>
                    <span className="tech-stack">Python, C</span>
                  </div>
                  <ul>
                    <li>Implemented Python package for gait analysis (10k+ samples). Features 50+ preprocessing functions.</li>
                    <li>Reduced processing time by 40%. Achieved 97% accuracy on Daphnet with RF/CNN/LSTM.</li>
                  </ul>
                </div>
              ], 'projects')}
            </section>

            <hr className="divider" />

            <section className="hackathons-section" id="hackathons">
              <h3>//hackathons</h3>
              {renderSectionItems([
                <div className="project-card" key="si">
                  <div className="project-header">
                    <h4>Moonshadows (SIH 2024)</h4>
                    <span className="tech-stack">Team Lead</span>
                  </div>
                  <p>Worked on enhancement of shadowed lunar regions.</p>
                </div>,
                <div className="project-card" key="drivepal">
                  <div className="project-header">
                    <h4>Vehicle Rental Service (Drive Pal) <a href="https://drive-pal.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label="Visit Drive Pal website">[Link]</a></h4>
                    <span className="tech-stack">NextJS, WebGL, Supabase</span>
                  </div>
                  <p>Reactive web app for renting vehicles using AR/VR and Photogrammetry. Built for Tutedude Hackathon.</p>
                </div>,
                <div className="project-card" key="attorney">
                  <div className="project-header">
                    <h4>Attorney Juniors (SIH 2023)</h4>
                    <span className="tech-stack">Unity, C#, Python</span>
                  </div>
                  <p>Gamified platform with GenAI mini-games for legal awareness. Team Lead ("Acropolis").</p>
                </div>
              ], 'hackathons')}
            </section>

            <hr className="divider" />

            <section className="side-quests-section" id="side-quests">
              <h3>//side_quests</h3>
              <div className="project-card">
                <div className="project-header">
                  <h4>CosQ Entertainments Pvt Limited <a href="https://cosq.in" target="_blank" rel="noopener noreferrer" aria-label="Visit CosQ website">[cosq.in]</a></h4>
                  <span className="role">//Founder & CTO</span>
                </div>
                <ul>
                  <li>Organized pop-culture events and Comic Conventions with 1000+ gatherings.</li>
                  <li>Managed tech and community operations for large scale events.</li>
                </ul>
              </div>

              <div className="project-card">
                <div className="project-header">
                  <h4>Way Through Films</h4>
                  <span className="role">//Founder</span>
                </div>
                <ul>
                  <li><strong>Production House:</strong> Established an independent production studio.</li>
                  <li><strong>Docu Series:</strong> <button onClick={() => openProductionTab('omwt')} className="inline-link" style={{ color: 'var(--accent-color)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }} aria-label="View On My Way Through docu-series">On My Way Through</button> - A docuseries exploring society through an unpolished lens.</li>
                  <li><strong>Micro Experiments:</strong>
                    <button onClick={() => openProductionTab('pause')} className="inline-link" style={{ color: 'var(--accent-color)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }} aria-label="View Pause micro-film">Pause</button> /
                    <button onClick={() => openProductionTab('morning')} className="inline-link" style={{ color: 'var(--accent-color)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }} aria-label="View Morning micro-film">Morning</button>
                  </li>
                </ul>
              </div>
            </section>

            <hr className="divider" />

            <section className="volunteering-section" id="volunteering">
              <h3>//leadership & volunteering</h3>
              <div className="vol-item">
                <h4>Microsoft Learn Student Ambassador - KIIT Chapter <span className="role">//AI-ML Domain</span></h4>
                <ul>
                  <li>Wrote DDPM implementation (training/inference). Led <strong>ForgeTube</strong> (AI video gen).</li>
                  <li>Created lecture series on DDPM/Backprop. Mentored 10+ juniors. Built <strong>learndiffusion.vercel.app</strong>.</li>
                </ul>
              </div>

              <div className="vol-item">
                <h4>KIIT E-Cell <span className="role">//RnD Intern & POC</span></h4>
                <ul>
                  <li>Organized hackathons ($150K prize pool); Managed 120+ teams for Hult Prize. Secured top VC speakers.</li>
                </ul>
              </div>

              <div className="vol-item">
                <h4>The Period Society <span className="role">//Odisha Chapter Sub Lead</span></h4>
                <ul>
                  <li>Led 35-member team on menstrual health projects. Established Centre for Menstrual Studies.</li>
                </ul>
              </div>

              <div className="vol-item">
                <h4>Odisha Anime Club <span className="role">//Technical Administrator</span></h4>
                <ul>
                  <li>Managed major events with 1000+ footfall. Produced high-quality events on low budgets.</li>
                  <li>Headed volunteer teams and designed highest-selling merchandise.</li>
                </ul>
              </div>
            </section>

            <hr className="divider" />

            <section className="awards-section" id="awards">
              <h3>//championship_titles (awards)</h3>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>[Winner]</span>
                  <strong> Kickboxing</strong>: Bronze Medal - Kicklite Open Weight
                </li>
                <li>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>[Winner]</span>
                  <strong> KIIT Merit Scholarship</strong>: Top 1000 Rank (99%tile)
                </li>
                <li>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>[Winner]</span>
                  <strong> Immerse Oxford-Cambridge Research Scholarship</strong>: Awarded for essay on Child Development
                </li>
                <li>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>[Winner]</span>
                  <strong> Mono Mousumi - Essay Competition</strong>: Senior Category Prize for essay on "Environment and Festivals in India".
                </li>
                <li>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>[Qualified]</span>
                  <strong> Competitive Exams</strong>: JEE Mains, JEE Advanced, SNUSAT, NEET UG, IISER Aptitude Test.
                </li>
              </ul>
            </section>

            <hr className="divider" />

            <section className="hobbies-section" id="hobbies">
              <h3>//hobbies (interactive)</h3>
              <div className="hobbies-grid">
                <button className="hobby-btn" onClick={() => openTab('guitar', 'Guitar', '<h3>Guitar</h3><p>Played in rock band performances. I love creating distorted riffs and melodic solos.</p><p><strong>Band Experience:</strong> Member of school band <em>"528hz"</em>.</p>')}>
                  <i className="fas fa-guitar"></i> Guitar
                </button>
                <button className="hobby-btn" onClick={() => openTab('art', 'Artwork', '<h3>Artwork & Design</h3><p>Traditional Sketching, Inking. Digital Art (Krita, Photoshop). Exploring the boundaries of visual storytelling.</p>')}>
                  <i className="fas fa-palette"></i> Artwork
                </button>
                <button className="hobby-btn" onClick={() => openTab('philosophy', 'Philosophy', '<h3>Philosophy</h3><p>Skeptic at heart. Interested in Epistemology, Metaphysics. Reading Plato, Nietzsche, Dostoevsky, Camus.</p><h4>Reading List:</h4><ul><li>The Brothers Karamazov - Dostoevsky</li><li>Crime and Punishment - Dostoevsky</li><li>Notes from Underground - Dostoevsky</li></ul>')}>
                  <i className="fas fa-book"></i> Philosophy
                </button>
                <button className="hobby-btn" onClick={() => openTab('vfx', 'VFX/Film', (
                  <div className="vfx-selection">
                    <h3>VFX & Film Making</h3>
                    <p>Video Editing (Premiere Pro), VFX (After Effects), 3D Modeling (Blender). I love directing the viewer's eye.</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button className="hobby-btn" onClick={() => openProductionTab('omwt')}>On My Way Through</button>
                      <button className="hobby-btn" onClick={() => openProductionTab('pause')}>Pause</button>
                      <button className="hobby-btn" onClick={() => openProductionTab('morning')}>Morning</button>
                    </div>
                  </div>
                ))}>
                  <i className="fas fa-video"></i> VFX
                </button>
                <button className="hobby-btn" onClick={() => openTab('cooking', 'Cooking', '<h3>Cooking</h3><p>From Hyderabadi Dum Biryani to Italian Pasta. Cooking is chemistry with soul.</p>')}>
                  <i className="fas fa-utensils"></i> Cooking
                </button>
                <button className="hobby-btn" onClick={() => openTab('anime', 'Anime', '<div style="width:100%; height:400px;"><iframe src="https://myanimelist.net/animelist/aharshit123456" style="width:100%; height:100%; border:none;"></iframe></div>')}>
                  <i className="fas fa-tv"></i> Anime
                </button>
              </div>
            </section>

            <hr className="divider" />

            <section className="writings-section" id="writings">
              <h3>//writings & pdfs</h3>
              <div className="blog-list">
                <div className="blog-item">
                  <span className="date">--</span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); openResumeTab(); }} className="blog-link">Resume.pdf (View)</a>
                    <a href="resume.pdf" download className="blog-link" title="Download PDF"><i className="fas fa-download"></i></a>
                  </div>
                </div>
              </div>
            </section>

            <footer className="footer">
              <p>// made with <i className="fas fa-heart"></i> and <i className="fas fa-code"></i> by Harshit</p>
              <p className="copyright">&copy; 2026 Harshit Agarwal. All rights reserved.</p>
            </footer>
          </main>
        </div>
      {/* Dynamic Tab Content */}
      {tabs.map(tab => tab.id !== 'main' && (
        <div
          key={tab.id}
          className={`tab-content ${activeTabId === tab.id ? 'active' : ''}`}
          id={`content-${tab.id}`}
          style={tab.id === 'resume' ? { padding: '0', height: '100%', overflow: 'hidden' } : {}}
        >
          {typeof tab.content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: tab.content }} />
          ) : (
            tab.content
          )}
        </div>
      ))}
    </>
  );

  if (!isLoggedIn) {
    return (
      <div className="login-screen" style={{ backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="login-container">
          <div className="login-profile">
            <img src="profile_new.jpg" alt="Harshit Agarwal" />
          </div>
          <h1>Harshit Agarwal</h1>
          <p className="login-domain">aharshit123456.space</p>
          <div className="login-input-group">
            <input
              type="password"
              placeholder="Enter Password"
              autoFocus
              suppressHydrationWarning
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsLoggedIn(true);
              }}
            />
            <button onClick={() => setIsLoggedIn(true)} suppressHydrationWarning>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          <p className="login-hint">Hint: Just press Enter (or any key)</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`workspace-wrapper ${isWin95 ? 'win95-theme' : ''}`} style={{ backgroundImage: isWin95 ? 'none' : `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="workspace-container" style={{ transform: `translateX(-${activeSpace * 100}vw)` }}>
        {/* Space 1: Desktop */}
        <div className="space desktop-space" onContextMenu={handleContextMenu}>
          <div style={{ position: 'absolute', right: '40px', bottom: '120px', zIndex: 10 }}>
            <GuestbookWidget />
          </div>
          <div className="top-menubar">
            <div className="left">
              {isMobile ? (
                <span suppressHydrationWarning style={{ marginLeft: '10px', fontWeight: '600' }}>{hasMounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
              ) : (
                <>
                  <i
                    className="fab fa-apple apple-icon"
                    onClick={() => setIsAppleMenuOpen(!isAppleMenuOpen)}
                  ></i>
                  {isAppleMenuOpen && (
                    <div className="apple-dropdown">
                      <div className="menu-item-drop">About This Mac</div>
                      <hr />
                      <div className="menu-item-drop">System Settings...</div>
                      <div className="menu-item-drop">App Store...</div>
                      <hr />
                      <div className="menu-item-drop">Sleep</div>
                      <div className="menu-item-drop">Restart...</div>
                      <div className="menu-item-drop">Shut Down...</div>
                      <hr />
                      <div className="menu-item-drop" onClick={() => setIsLoggedIn(false)}>Lock Screen</div>
                      <div className="menu-item-drop" onClick={() => setIsLoggedIn(false)}>Log Out Harshit...</div>
                    </div>
                  )}
                  <span className="app-name" style={{ fontWeight: '700' }}>aharshit123456.space</span>
                  
                  <div style={{ position: 'relative' }}>
                    <span className="menu-item" onClick={() => setActiveMenu(activeMenu === 'File' ? null : 'File')}>File</span>
                    {activeMenu === 'File' && (
                      <div className="apple-dropdown" style={{ left: 0 }}>
                        <div className="menu-item-drop">New Window</div>
                        <div className="menu-item-drop">New Folder</div>
                        <hr />
                        <div className="menu-item-drop">Open</div>
                        <div className="menu-item-drop">Open With...</div>
                        <hr />
                        <div className="menu-item-drop">Get Info</div>
                        <div className="menu-item-drop">Compress</div>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span className="menu-item" onClick={() => setActiveMenu(activeMenu === 'Edit' ? null : 'Edit')}>Edit</span>
                    {activeMenu === 'Edit' && (
                      <div className="apple-dropdown" style={{ left: 0 }}>
                        <div className="menu-item-drop">Undo</div>
                        <div className="menu-item-drop">Redo</div>
                        <hr />
                        <div className="menu-item-drop">Cut</div>
                        <div className="menu-item-drop">Copy</div>
                        <div className="menu-item-drop">Paste</div>
                        <div className="menu-item-drop">Select All</div>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span className="menu-item" onClick={() => setActiveMenu(activeMenu === 'View' ? null : 'View')}>View</span>
                    {activeMenu === 'View' && (
                      <div className="apple-dropdown" style={{ left: 0 }}>
                        <div className="menu-item-drop">as Icons</div>
                        <div className="menu-item-drop">as List</div>
                        <div className="menu-item-drop">as Columns</div>
                        <hr />
                        <div className="menu-item-drop">Show Sidebar</div>
                        <div className="menu-item-drop">Show Preview</div>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span className="menu-item" onClick={() => setActiveMenu(activeMenu === 'Go' ? null : 'Go')}>Go</span>
                    {activeMenu === 'Go' && (
                      <div className="apple-dropdown" style={{ left: 0 }}>
                        <div className="menu-item-drop">Back</div>
                        <div className="menu-item-drop">Forward</div>
                        <div className="menu-item-drop">Enclosing Folder</div>
                        <hr />
                        <div className="menu-item-drop">Recents</div>
                        <div className="menu-item-drop" onClick={() => { setIsDocsOpen(true); setIsDocsMinimized(false); setActiveMenu(null); }}>Documents</div>
                        <div className="menu-item-drop">Desktop</div>
                        <div className="menu-item-drop">Downloads</div>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span className="menu-item" onClick={() => setActiveMenu(activeMenu === 'Window' ? null : 'Window')}>Window</span>
                    {activeMenu === 'Window' && (
                      <div className="apple-dropdown" style={{ left: 0 }}>
                        <div className="menu-item-drop">Minimize</div>
                        <div className="menu-item-drop">Zoom</div>
                        <hr />
                        <div className="menu-item-drop">Bring All to Front</div>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span className="menu-item" onClick={() => setActiveMenu(activeMenu === 'Help' ? null : 'Help')}>Help</span>
                    {activeMenu === 'Help' && (
                      <div className="apple-dropdown" style={{ left: 0 }}>
                        <div className="menu-item-drop">Search</div>
                        <hr />
                        <div className="menu-item-drop">macOS Help</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="right">
              <span className="menu-item" onClick={() => setIsWifiMenuOpen(!isWifiMenuOpen)}>
                <i className="fas fa-wifi"></i>
              </span>
              {isWifiMenuOpen && (
                <div className="apple-dropdown" style={{ right: '120px', left: 'auto', width: '220px' }}>
                  <div style={{ padding: '6px 15px', fontSize: '11px', opacity: 0.5, fontWeight: '700', color: 'white' }}>WIFI NETWORKS</div>
                  {[
                    'aharshit123456.space',
                    'Pretty Fly for a Wi-Fi',
                    'Tell My WiFi Love Her',
                    'FBI Surveillance Van #4',
                    'Abraham Linksys',
                    'The Promised LAN',
                    'Mom, click here for internet'
                  ].map(name => (
                    <div
                      key={name}
                      className="menu-item-drop"
                      onClick={() => { setActiveWifi(name); setIsWifiMenuOpen(false); }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>{name}</span>
                      {activeWifi === name && <i className="fas fa-check" style={{ fontSize: '10px', marginLeft: '10px' }}></i>}
                    </div>
                  ))}
                  <hr />
                  <div className="menu-item-drop">Wi-Fi Settings...</div>
                </div>
              )}
              <span className="menu-item" onClick={() => setIsBatteryMenuOpen(!isBatteryMenuOpen)}>
                <i className={`fas fa-battery-${batteryLevel > 80 ? 'full' : batteryLevel > 50 ? 'three-quarters' : batteryLevel > 20 ? 'half' : 'quarter'}`}></i>
                {!isMobile && <span style={{ marginLeft: '5px', fontSize: '0.75rem' }}>{batteryLevel}%</span>}
              </span>
              {isBatteryMenuOpen && (
                <div className="apple-dropdown" style={{ right: '100px', left: 'auto', width: '250px' }}>
                  <div style={{ padding: '6px 15px', fontSize: '11px', opacity: 0.5, fontWeight: '700', color: 'white' }}>BATTERY</div>
                  <div className="menu-item-drop" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Power Source: Battery</span>
                  </div>
                  <div className="menu-item-drop">{batteryLevel}% Remaining</div>
                  <hr />
                  <div style={{ padding: '6px 15px', fontSize: '11px', opacity: 0.5, fontWeight: '700', color: 'white' }}>APPS USING SIGNIFICANT ENERGY</div>
                  <div className="menu-item-drop" style={{ opacity: 0.5 }}>No Apps Using Significant Energy</div>
                  <hr />
                  <div className="menu-item-drop">Battery Settings...</div>
                </div>
              )}
              <SiriAssistant batteryLevel={batteryLevel} isDarkMode={isDarkMode} />
              <span className="menu-item" onClick={() => setIsControlCenterOpen(!isControlCenterOpen)}>
                <i className="fas fa-sliders-h"></i>
              </span>
              {!isMobile && (
                <span className="menu-item" onClick={() => setIsSpotlightOpen(true)}>
                  <i className="fas fa-search"></i>
                </span>
              )}
              {!isMobile && (
                <span className="menu-item" onClick={() => setIsClockMenuOpen(!isClockMenuOpen)} suppressHydrationWarning>
                  {hasMounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              )}
              {!isMobile && isClockMenuOpen && (
                <div className="apple-dropdown" style={{ right: '10px', left: 'auto', width: '280px' }}>
                  <div style={{ padding: '15px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '500', opacity: 0.8 }}>
                      {hasMounted ? new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '5px' }}>
                      {hasMounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  <hr />
                  <div className="menu-item-drop">Open Calendar...</div>
                  <div className="menu-item-drop">Clock Settings...</div>
                </div>
              )}
            </div>
          </div>
            <div
              className={`mac-window portfolio-window ${isMinimized ? 'minimized' : ''} ${isMobile ? 'fullscreen-view' : ''}`}
              style={!isMobile ? {
                position: 'absolute',
                left: `${windowPositions.main.x}px`,
                top: `${windowPositions.main.y}px`,
                zIndex: 40,
                width: '80%',
                maxWidth: '1000px'
              } : { zIndex: 40 }}
            >
            <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'main')}>
              <div className="buttons">
                <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}></div>
                <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}></div>
                <div className="maximize" title="Maximize" onClick={(e) => { e.stopPropagation(); setFullscreenWindow('main'); setActiveSpace(1); }}></div>
              </div>
              <div className="window-title">harshit_agarwal.dmg — 800×600</div>
              <div className="theme-toggle" id="theme-toggle-btn" onClick={(e) => { e.stopPropagation(); toggleTheme(); }} aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} role="button">
                <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"}></i>
              </div>
            </div>

            <div className="content-container" ref={contentContainerRef}>
              {renderMainContent()}
            </div>
          </div>

          {/* Freelance Window */}
          {isFreelanceOpen && (
            <div className={`mac-window freelance-window ${isFreelanceMinimized ? 'minimized' : ''}`} style={{
              position: 'absolute',
              top: `${windowPositions.freelance.y}px`,
              left: `${windowPositions.freelance.x}px`,
              zIndex: 50
            }}>
              <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'freelance')}>
                <div className="buttons">
                  <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); setIsFreelanceOpen(false); }}></div>
                  <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); setIsFreelanceMinimized(true); }}></div>
                  <div className="maximize" title="Maximize" onClick={(e) => { e.stopPropagation(); setFullscreenWindow('freelance'); setActiveSpace(1); }}></div>
                </div>
                <div className="window-title">freelance_experience.dmg</div>
              </div>
              <div className="content-container" style={{ background: 'var(--window-bg)' }}>
                <FreelanceExperience />
              </div>
            </div>
          )}

          {/* Documents Window */}
          {isDocsOpen && (
            <div className={`mac-window docs-window ${isDocsMinimized ? 'minimized' : ''} ${isMobile ? 'fullscreen-view' : ''}`} style={!isMobile ? {
              position: 'absolute',
              top: `${windowPositions.docs.y}px`,
              left: `${windowPositions.docs.x}px`,
              zIndex: 55,
              width: '800px',
              height: '550px'
            } : { zIndex: 55 }}>
              <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'docs')}>
                <div className="buttons">
                  <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); setIsDocsOpen(false); }}></div>
                  <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); setIsDocsMinimized(true); }}></div>
                  <div className="maximize" title="Maximize"></div>
                </div>
                <div className="window-title">Documents</div>
              </div>
              <div className="content-container" style={{ padding: 0, height: 'calc(100% - 35px)' }}>
                <DocumentsManager isDarkMode={isDarkMode} />
              </div>
            </div>
          )}

          {/* Messages Window */}
          {isMessagesOpen && (
            <div className={`mac-window messages-window ${isMessagesMinimized ? 'minimized' : ''} ${isMobile ? 'fullscreen-view' : ''}`} style={!isMobile ? {
              position: 'absolute',
              top: '100px',
              left: '100px',
              zIndex: 70,
              width: '800px',
              height: '600px'
            } : { zIndex: 70 }}>
              {!isMobile && (
                <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'messages')}>
                  <div className="buttons">
                    <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); setIsMessagesOpen(false); }}></div>
                    <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); setIsMessagesMinimized(true); }}></div>
                    <div className="maximize" title="Maximize"></div>
                  </div>
                  <div className="window-title">Messages</div>
                </div>
              )}
              <div className="content-container" style={{ padding: 0, height: isMobile ? '100%' : 'calc(100% - 35px)' }}>
                <MessagesView />
              </div>
            </div>
          )}

          {/* Browser Window */}
          {isBrowserOpen && (
            <div className={`mac-window browser-window ${isBrowserMinimized ? 'minimized' : ''} ${isMobile ? 'fullscreen-view' : ''}`} style={!isMobile ? {
              position: 'absolute',
              top: `${windowPositions.browser.y}px`,
              left: `${windowPositions.browser.x}px`,
              zIndex: 65,
              width: '900px',
              height: '650px'
            } : { zIndex: 65 }}>
              <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'browser')}>
                <div className="buttons">
                  <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); setIsBrowserOpen(false); }}></div>
                  <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); setIsBrowserMinimized(true); }}></div>
                  <div className="maximize" title="Maximize"></div>
                </div>
                <div className="window-title">Safari — wikiHow</div>
              </div>
              <div className="content-container" style={{ padding: 0, height: 'calc(100% - 35px)' }}>
                <BrowserView onArticleView={(isArticle) => setIsReadingArticle(isArticle && isBrowserOpen && !isBrowserMinimized)} />
              </div>
            </div>
          )}

          {/* Terminal Window */}

          {isTerminalOpen && (
            <div className={`mac-window terminal-window ${isTerminalMinimized ? 'minimized' : ''} ${isMobile ? 'fullscreen-view' : ''}`} style={!isMobile ? {
              position: 'absolute',
              top: `${windowPositions.terminal.y}px`,
              left: `${windowPositions.terminal.x}px`,
              zIndex: 60,
              width: '700px',
              height: '450px'
            } : { zIndex: 60 }}>
              <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'terminal')}>
                <div className="buttons">
                  <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); setIsTerminalOpen(false); }}></div>
                  <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); setIsTerminalMinimized(true); }}></div>
                  <div className="maximize" title="Maximize" onClick={(e) => { e.stopPropagation(); setFullscreenWindow('terminal'); setActiveSpace(1); }}></div>
                </div>
                <div className="window-title">terminal.app</div>
              </div>
              <div className="content-container" style={{ background: '#0c0c0c' }}>
                <TerminalView onCommand={handleTerminalCommand} isMobile={isMobile} />
              </div>
            </div>
          )}

          {/* Desktop Context Menu */}
          {contextMenu.visible && (
            <div className="custom-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
              <div className="menu-item" onClick={() => setIsTerminalOpen(true)}>New Terminal</div>
              <div className="menu-item" onClick={toggleTheme}>Change Theme</div>
              <div className="menu-item" onClick={() => window.location.reload()}>Refresh Desktop</div>
              <hr />
              <div className="menu-item" onClick={() => setIsMatrixActive(!isMatrixActive)}>
                {isMatrixActive ? 'Stop Matrix' : 'Start Matrix'}
              </div>
            </div>
          )}

          {isMatrixActive && <MatrixRain />}

          {/* DMG Installer Window */}
          {isDMGOpen && (
            <div className={`mac-window dmg-window ${isMobile ? 'fullscreen-view' : ''}`} style={!isMobile ? {
              position: 'absolute',
              top: `${windowPositions.dmg.y}px`,
              left: `${windowPositions.dmg.x}px`,
              zIndex: 100,
              width: 'auto',
              height: 'auto',
              maxWidth: 'none'
            } : { zIndex: 100 }}>
              <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'dmg')}>
                <div className="buttons">
                  <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); setIsDMGOpen(false); }}></div>
                  <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); setIsDMGOpen(false); }}></div>
                  <div className="maximize" title="Maximize"></div>
                </div>
                <div className="window-title">resume.dmg</div>
              </div>
              <DMGInstaller
                onClose={() => setIsDMGOpen(false)}
                onInstallComplete={() => {
                  const link = document.createElement('a');
                  link.href = 'resume.pdf';
                  link.download = 'Harshit_Agarwal_Resume.pdf';
                  link.click();
                  setIsDMGOpen(false);
                }}
              />
            </div>
          )}

          {/* QuickLook Image Viewer */}
          {selectedImage && (
            <div className="image-quicklook" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              transform: `translate(${windowPositions.ql.x - 200}px, ${windowPositions.ql.y - 325}px)`,
              zIndex: 1000,
              width: '400px',
              maxWidth: '95vw',
              background: 'transparent',
              borderRadius: '12px',
              overflow: 'visible',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'none'
            }}>
              <div className="title-bar" onMouseDown={(e) => handleWindowMouseDown(e, 'ql')} style={{ 
                cursor: 'move', 
                pointerEvents: 'auto',
                background: 'rgba(30, 30, 30, 0.95)',
                borderRadius: '12px 12px 0 0',
                border: '1px solid rgba(255,255,255,0.1)',
                width: '100%',
                marginBottom: '10px'
              }}>
                <div className="buttons">
                  <div className="close" title="Close" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}></div>
                  <div className="minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}></div>
                  <div className="maximize" title="Maximize"></div>
                </div>
                <div className="window-title" style={{ color: '#fff', opacity: 1 }}>{selectedImage.altPrefix} — {selectedImage.currentIndex + 1}/{selectedImage.images.length}</div>
              </div>
              
              <div className="quicklook-content" style={{ 
                background: 'transparent', 
                overflow: 'visible', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '600px',
                position: 'relative',
                pointerEvents: 'auto'
              }}>
                {/* Navigation Buttons */}
                <div className="emulator-controls" style={{
                  position: 'absolute',
                  top: '50%',
                  left: '0px',
                  right: '0px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  transform: 'translateY(-50%)',
                  zIndex: 100,
                  pointerEvents: 'none'
                }}>
                  <div className="nav-btn" onClick={(e) => {
                    e.stopPropagation();
                    const newIdx = (selectedImage.currentIndex - 1 + selectedImage.images.length) % selectedImage.images.length;
                    setSelectedImage({ ...selectedImage, currentIndex: newIdx });
                  }} style={{ pointerEvents: 'auto' }}>
                    <i className="fas fa-chevron-left"></i>
                  </div>
                  <div className="nav-btn" onClick={(e) => {
                    e.stopPropagation();
                    const newIdx = (selectedImage.currentIndex + 1) % selectedImage.images.length;
                    setSelectedImage({ ...selectedImage, currentIndex: newIdx });
                  }} style={{ pointerEvents: 'auto' }}>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>

                {/* Emulator Frame */}
                <div className="phone-emulator" style={{ margin: 0 }}>
                  <div className="dynamic-island"></div>
                  <div className="phone-screen">
                    <img 
                      src={selectedImage.images[selectedImage.currentIndex]} 
                      alt={`${selectedImage.altPrefix} ${selectedImage.currentIndex + 1}`} 
                      key={selectedImage.images[selectedImage.currentIndex]} 
                      style={{ animation: 'fadeIn 0.3s ease' }}
                    />
                  </div>
                </div>
              </div>

              {/* Dot Indicators */}
              <div className="quicklook-footer" style={{ 
                background: 'rgba(0,0,0,0.6)', 
                borderRadius: '20px', 
                margin: '10px auto', 
                padding: '6px 12px',
                pointerEvents: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}>
                {selectedImage.images.map((_, i) => (
                  <div 
                    key={i} 
                    className={`dot ${selectedImage.currentIndex === i ? 'active' : ''}`}
                    onClick={() => setSelectedImage({ ...selectedImage, currentIndex: i })}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Icons - Handled above for mobile */}
          {!isMobile && (
            <>
              <div
                className={`minimized-icon ${activeDragIcon.current === 'main' ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, 'main')}
                onClick={() => handleIconClick('main')}
                style={{
                  left: `${iconPosition.x}px`,
                  bottom: `${iconPosition.y}px`,
                  position: 'absolute',
                  display: isMinimized ? 'flex' : 'none'
                }}
                title="Restore Harshit's Portfolio"
              >
                <div className="icon-image">
                  <img src="profile_new.jpg" alt="Restore" draggable="false" />
                </div>
                <div className="icon-label">harshit_agarwal.dmg</div>
              </div>

              <div
                className={`minimized-icon ${activeDragIcon.current === 'terminal' ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, 'terminal')}
                onClick={() => handleIconClick('terminal')}
                style={{
                  left: `${terminalIconPosition.x}px`,
                  bottom: `${terminalIconPosition.y}px`,
                  position: 'absolute'
                }}
                title="Terminal"
              >
                <div className="icon-image">
                  <img src="/terminal_icon.png" alt="Terminal" draggable="false" />
                </div>
                <div className="icon-label">terminal.app</div>
              </div>

              <div
                className={`minimized-icon ${activeDragIcon.current === 'docs' ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, 'docs')}
                onClick={() => {
                  setIsDocsOpen(true);
                  setIsDocsMinimized(false);
                }}
                style={{
                  left: `${docsIconPosition.x}px`,
                  bottom: `${docsIconPosition.y}px`,
                  position: 'absolute'
                }}
                title="Documents"
              >
                <div className="icon-image">
                  <img src="/apps_icon.png" alt="Documents" draggable="false" />
                </div>
                <div className="icon-label">Documents</div>
              </div>

              <div
                className={`minimized-icon ${activeDragIcon.current === 'resume' ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, 'resume')}
                onClick={() => handleIconClick('resume')}
                style={{
                  left: `${resumeIconPosition.x}px`,
                  bottom: `${resumeIconPosition.y}px`,
                  position: 'absolute'
                }}
                title="Resume Installer"
              >
                <div className="icon-image">
                  <img src="/dmg_icon.png" alt="Resume DMG" draggable="false" />
                </div>
                <div className="icon-label">resume.dmg</div>
              </div>

              <div
                className={`minimized-icon ${activeDragIcon.current === 'browser' ? 'dragging' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, 'browser')}
                onClick={() => handleIconClick('browser')}
                style={{
                  left: `${browserIconPosition.x}px`,
                  bottom: `${browserIconPosition.y}px`,
                  position: 'absolute'
                }}
                title="Safari"
              >
                <div className="icon-image">
                  <img src="https://img.icons8.com/color/512/safari.png" alt="Safari" draggable="false" />
                </div>
                <div className="icon-label">Safari.app</div>
              </div>
            </>
          )}

        </div>

        {/* Space 2: Fullscreen App */}
        <div className="space fullscreen-space">
          {fullscreenWindow === 'main' && (
            <div className="mac-window fullscreen-view">
              <div className="title-bar">
                <div className="buttons">
                  <div className="close" title="Close"></div>
                  <div className="minimize" title="Minimize" onClick={() => setActiveSpace(0)}></div>
                  <div className="maximize" title="Exit Fullscreen" onClick={() => setActiveSpace(0)}></div>
                </div>
                <div className="window-title">harshit_agarwal.dmg — Fullscreen</div>
              </div>
              {renderMainContent()}
            </div>
          )}
          {fullscreenWindow === 'freelance' && (
            <div className="mac-window fullscreen-view">
              <div className="title-bar">
                <div className="buttons">
                  <div className="close" title="Close" onClick={() => { setIsFreelanceOpen(false); setActiveSpace(0); }}></div>
                  <div className="minimize" title="Minimize" onClick={() => setActiveSpace(0)}></div>
                  <div className="maximize" title="Exit Fullscreen" onClick={() => setActiveSpace(0)}></div>
                </div>
                <div className="window-title">freelance_experience.dmg — Fullscreen</div>
              </div>
              <div className="content-container" style={{ background: 'var(--window-bg)' }}>
                <FreelanceExperience />
              </div>
            </div>
          )}
          {fullscreenWindow === 'terminal' && (
            <div className="mac-window fullscreen-view">
              <div className="title-bar">
                <div className="buttons">
                  <div className="close" title="Close" onClick={() => { setIsTerminalOpen(false); setActiveSpace(0); }}></div>
                  <div className="minimize" title="Minimize" onClick={() => setActiveSpace(0)}></div>
                  <div className="maximize" title="Exit Fullscreen" onClick={() => setActiveSpace(0)}></div>
                </div>
                <div className="window-title">terminal — Fullscreen</div>
              </div>
              <div className="content-container" style={{ background: '#0c0c0c' }}>
                <TerminalView onCommand={handleTerminalCommand} isMobile={isMobile} />
              </div>
            </div>
          )}
        </div>
        <WallpaperSwitcher
          isOpen={isWallpaperSwitcherOpen}
          onClose={() => setIsWallpaperSwitcherOpen(false)}
          currentWallpaper={wallpaper}
          setWallpaper={setWallpaper}
        />
      </div>

      {/* Fixed UI Components (Outside transformed container) */}
      <Dock
        items={isMobile ? [
          { id: 'messages', name: 'Messages', icon: 'https://img.icons8.com/color/512/imessage.png', onClick: () => { 
            playSound('funk'); 
            triggerHaptic(15);
            minimizeAllWindows(); 
            setIsMessagesOpen(true); 
            setIsMessagesMinimized(false);
          }, isOpen: isMessagesOpen && !isMessagesMinimized },
          { id: 'main', name: 'harshit_agarwal.dmg', icon: '/apps_icon.png', onClick: () => { 
            playSound('funk'); 
            triggerHaptic(15);
            minimizeAllWindows();
            setIsMinimized(false); 
            setActiveTabId('main'); 
          }, isOpen: !isMinimized },
          { id: 'terminal', name: 'Terminal', icon: '/terminal_icon.png', onClick: () => { 
            playSound('funk'); 
            triggerHaptic(15);
            minimizeAllWindows();
            setIsTerminalOpen(true); 
            setIsTerminalMinimized(false);
          }, isOpen: isTerminalOpen && !isTerminalMinimized },
        ] : [
          { id: 'main', name: 'Finder', icon: '/apps_icon.png', onClick: () => { playSound('funk'); setIsMinimized(false); setActiveTabId('main'); }, isOpen: !isMinimized },
          { id: 'launchpad', name: 'Launchpad', icon: 'https://img.icons8.com/color/512/launchpad.png', onClick: () => { playSound('funk'); setIsLaunchpadOpen(true); }, isOpen: false },
          { id: 'terminal', name: 'Terminal', icon: '/terminal_icon.png', onClick: () => { playSound('funk'); setIsTerminalOpen(true); }, isOpen: isTerminalOpen },
          { id: 'resume', name: 'Resume DMG', icon: '/dmg_icon.png', onClick: () => { playSound('funk'); setIsDMGOpen(true); }, isOpen: isDMGOpen },
          { id: 'browser', name: 'Safari', icon: 'https://img.icons8.com/color/512/safari.png', onClick: () => { playSound('funk'); setIsBrowserOpen(true); setIsBrowserMinimized(false); }, isOpen: isBrowserOpen && !isBrowserMinimized },
          { id: 'settings', name: 'System Settings', icon: '/apps_icon.png', onClick: () => { playSound('funk'); setIsWallpaperSwitcherOpen(true); } },

          { id: 'github', name: 'GitHub', icon: '/git.png', onClick: () => window.open('https://github.com/aharshit123456', '_blank') },
          { id: 'linkedin', name: 'LinkedIn', icon: '/linkedin.png', onClick: () => window.open('https://www.linkedin.com/in/aharshit123456/', '_blank') },
        ]}
      />

      <Launchpad 
        isOpen={isLaunchpadOpen}
        onClose={() => setIsLaunchpadOpen(false)}
        apps={[
          { id: 'finder', name: 'Finder', icon: '/apps_icon.png', onClick: () => { setIsMinimized(false); setActiveTabId('main'); } },
          { id: 'terminal', name: 'Terminal', icon: '/terminal_icon.png', onClick: () => setIsTerminalOpen(true) },
          { id: 'resume', name: 'Resume DMG', icon: '/dmg_icon.png', onClick: () => setIsDMGOpen(true) },
          { id: 'settings', name: 'System Settings', icon: '/apps_icon.png', onClick: () => setIsWallpaperSwitcherOpen(true) },
          { id: 'github', name: 'GitHub', icon: '/git.png', onClick: () => window.open('https://github.com/aharshit123456', '_blank') },
          { id: 'browser', name: 'Safari', icon: 'https://img.icons8.com/color/512/safari.png', onClick: () => setIsBrowserOpen(true) },
          { id: 'linkedin', name: 'LinkedIn', icon: '/linkedin.png', onClick: () => window.open('https://www.linkedin.com/in/aharshit123456/', '_blank') },

          { id: 'spotify', name: 'Spotify', icon: 'https://img.icons8.com/color/512/spotify.png', onClick: () => { 
            setActiveTabId('main'); 
            setIsMinimized(false); 
            setTimeout(() => {
              const el = document.getElementById('curations');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } }
        ]}
      />

      <ControlCenter
        isOpen={isControlCenterOpen}
        onClose={() => setIsControlCenterOpen(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        brightness={brightness}
        setBrightness={setBrightness}
        volume={volume}
        setVolume={setVolume}
        activeWifi={activeWifi}
      />

      {/* Global Brightness Overlay with Vignette */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: `radial-gradient(circle, transparent 20%, rgba(0,0,0,${(100 - brightness) / 150}))`,
          backgroundColor: `rgba(0,0,0,${(100 - brightness) / 250})`, // Subtle base dimming
          pointerEvents: 'none',
          zIndex: 999999,
          transition: 'background 0.2s ease-out'
        }}
      />

      <Spotlight
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        apps={[
          { id: 'finder', name: 'Finder', icon: '/apps_icon.png', onClick: () => { setIsMinimized(false); setActiveTabId('main'); } },
          { id: 'terminal', name: 'Terminal', icon: '/terminal_icon.png', onClick: () => setIsTerminalOpen(true) },
          { id: 'resume', name: 'Resume DMG', icon: '/dmg_icon.png', onClick: () => setIsDMGOpen(true) },
          { id: 'settings', name: 'System Settings', icon: '/apps_icon.png', onClick: () => setIsWallpaperSwitcherOpen(true) },
          { id: 'browser', name: 'Safari', icon: 'https://img.icons8.com/color/512/safari.png', onClick: () => setIsBrowserOpen(true) },
          { id: 'github', name: 'GitHub', icon: '/git.png', onClick: () => window.open('https://github.com/aharshit123456', '_blank') },

        ]}
      />

      <SecretBoss isActive={isBossActive} onClose={() => setIsBossActive(false)} />

      {/* Dynamic Island (Mobile Only) - Outside container to fix fixed positioning with transform */}
      {isMobile && (
        <div 
          className={`dynamic-island-mobile ${isIslandExpanded ? 'expanded' : ''}`}
          onClick={() => setIsIslandExpanded(!isIslandExpanded)}
        >
          {isIslandExpanded ? (
            <div style={{ padding: '0px', textAlign: 'center', width: '100%', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '2px' }}>Now Playing</div>
              <div style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '-0.3px' }}>{islandText}</div>
              <div style={{ 
                fontSize: '10px', 
                marginTop: '8px', 
                color: 'var(--accent-color)', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}>
                <span className="pulse-dot"></span> Siri Roast Mode: Active
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="island-icon"></div>
              <span>{islandText}</span>
            </div>
          )}
        </div>
      )}
      {isMobile && (
        <div className="home-indicator" onClick={minimizeAllWindows}></div>
      )}
      <DesktopPet type="cat" trigger={isPetTriggered} />
      <DesktopPet type="frog" trigger={isMatrixActive} />
      <DesktopPet type="crab" trigger={isCrabTriggered} />
    </div>
  );

  // Helper Functions (Moved inside for state access)
  function openResumeTab() {
    openTab('resume', 'Resume.pdf', <iframe src="resume.pdf#toolbar=0" style={{ width: '100%', height: '100%', border: 'none' }}></iframe>, true);
  }

  function openImageTab(title: string, imagePath: string) {
    const id = 'certificate-' + Date.now();
    openTab(id, title, (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#000' }}>
        <img src={imagePath} style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} alt={title} />
      </div>
    ));
  }

  function openFamcareNotes() {
    openTab('famcare-notes', 'FamCARE Architecture Notes', <FamcareNotes />);
  }

  function openShoppinStats() {
    openTab('shoppin-stats', 'Shoppin\' Progression', <ShoppinStats />);
  }

  function openProductionTab(key: ProductionKey) {
    const titles: Record<ProductionKey, string> = {
      omwt: 'On My Way Through',
      pause: 'Pause (Micro Film)',
      morning: 'Morning (Micro Film)'
    };
    openTab(`production-${key}`, titles[key], <ProductionContent prodKey={key} />);
  }
}
