'use client';

import { useState, useEffect, useRef } from 'react';
import FamcareNotes from '@/components/portfolio/FamcareNotes';
import ShoppinStats from '@/components/portfolio/ShoppinStats';
import ProductionContent, { ProductionKey } from '@/components/portfolio/ProductionContent';
import FreelanceExperience from '@/components/portfolio/FreelanceExperience';
import TerminalView from '@/components/portfolio/TerminalView';
import MatrixRain from '@/components/portfolio/MatrixRain';

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
  const [isDragging, setIsDragging] = useState(false);
  
  const [isFreelanceOpen, setIsFreelanceOpen] = useState(false);
  const [isFreelanceMinimized, setIsFreelanceMinimized] = useState(false);
  const [freelanceIconPosition, setFreelanceIconPosition] = useState({ x: 40, y: 140 }); 
  
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [terminalIconPosition, setTerminalIconPosition] = useState({ x: 40, y: 240 });

  const [isMatrixActive, setIsMatrixActive] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });

  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartTime = useRef(0);
  const activeDragIcon = useRef<'main' | 'freelance' | 'terminal' | null>(null);

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

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent, type: 'main' | 'freelance' | 'terminal') => {
    if (type === 'main' && !isMinimized) return;
    if (type === 'freelance' && isFreelanceOpen && !isFreelanceMinimized) return;
    if (type === 'terminal' && isTerminalOpen && !isTerminalMinimized) return;

    activeDragIcon.current = type;
    const pos = type === 'main' ? iconPosition : 
                type === 'freelance' ? freelanceIconPosition : 
                terminalIconPosition;
    
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
      if (!activeDragIcon.current) return;
      
      const newX = e.clientX - dragOffset.current.x;
      const newY = (window.innerHeight - e.clientY) - dragOffset.current.y;
      
      const boundedX = Math.max(10, Math.min(window.innerWidth - 80, newX));
      const boundedY = Math.max(10, Math.min(window.innerHeight - 100, newY));
      
      if (activeDragIcon.current === 'main') {
        setIconPosition({ x: boundedX, y: boundedY });
      } else if (activeDragIcon.current === 'freelance') {
        setFreelanceIconPosition({ x: boundedX, y: boundedY });
      } else {
        setTerminalIconPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUp = () => {
      activeDragIcon.current = null;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []); // Only run once, logic inside handles state

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu({ visible: false, x: 0, y: 0 });
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleTerminalCommand = (cmd: string) => {
    if (cmd === 'matrix-start') setIsMatrixActive(true);
    if (cmd === 'matrix-stop') setIsMatrixActive(false);
  };

  const handleIconClick = (type: 'main' | 'freelance' | 'terminal') => {
    const dragDuration = Date.now() - dragStartTime.current;
    if (dragDuration < 200) {
      if (type === 'main') toggleMinimize();
      else if (type === 'freelance') {
        if (!isFreelanceOpen) setIsFreelanceOpen(true);
        else setIsFreelanceMinimized(!isFreelanceMinimized);
      } else {
        if (!isTerminalOpen) setIsTerminalOpen(true);
        else setIsTerminalMinimized(!isTerminalMinimized);
      }
    }
  };

  return (
    <div className="desktop" onContextMenu={handleContextMenu}>
      <div className={`mac-window ${isMinimized ? 'minimized' : ''}`}>
        <div className="title-bar">
          <div className="buttons">
            <div className="close" title="Close"></div>
            <div className="minimize" title="Minimize" onClick={toggleMinimize}></div>
            <div className="maximize" title="Maximize"></div>
          </div>
          <div className="window-title">harshit_agarwal.dmg</div>
          <div className="theme-toggle" id="theme-toggle-btn" onClick={toggleTheme} aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} role="button">
            <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"}></i>
          </div>
        </div>

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

        <div className="content-container" ref={contentContainerRef}>
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
                  <h1>&lt;Harshit Agarwal&gt;</h1>
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

              <section className="experience-section" id="experience">
                <h3>//work_experience</h3>
                {renderSectionItems([
                  <div className="exp-item" key="famcare">
                    <div className="time">April 2026 - Present</div>
                    <div className="details">
                      <h4>
                        <a href="https://famcare.co.in" style={{ color: '#ff4d4d' }} id="exp-famcare-link">Famcare</a>
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
                            <img src="assets/famcare/1.webp" alt="Famcare 1" />
                            <img src="assets/famcare/2.webp" alt="Famcare 2" />
                            <img src="assets/famcare/3.webp" alt="Famcare 3" />
                            <img src="assets/famcare/4.webp" alt="Famcare 4" />
                            <img src="assets/famcare/5.webp" alt="Famcare 5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>,
                  <div className="exp-item" key="endorphind">
                    <div className="time">Jan 2026 - Present</div>
                    <div className="details">
                      <h4><a href="http://endorphind.com/" style={{ color: '#ff4d4d' }}>endorphind</a> <span className="role">//Founding SDE (AI & Systems)</span></h4>
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
                        <a href="https://shoppin.app" style={{ color: '#ff4d4d' }} id="exp-shoppin-link">shoppin'</a> — USAR Commerce Technologies
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
                            <img src="assets/shoppin/1.webp" alt="shoppin 1" />
                            <img src="assets/shoppin/2.webp" alt="shoppin 2" />
                            <img src="assets/shoppin/3.webp" alt="shoppin 3" />
                            <img src="assets/shoppin/4.webp" alt="shoppin 4" />
                            <img src="assets/shoppin/5.webp" alt="shoppin 5" />
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
                      <h4>WHAM! OTT <a href="https://wham.cosq.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit WHAM! OTT website">[Web]</a></h4>
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
                      <h4>PreviouslyOn <a href="https://github.com/aharshit123456/previouslyon" target="_blank" rel="noopener noreferrer" aria-label="View PreviouslyOn source code on GitHub">[GitHub]</a> <a href="http://previouslyon.cosq.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit PreviouslyOn website">[Web]</a></h4>
                      <span className="tech-stack">Next.js, Supabase</span>
                    </div>
                    <p>"Developed a full-stack social TV tracking application using Next.js and Supabase, featuring real-time user activity feeds, custom list curation, and polymorphic review systems. Integrated Gemini AI for personalized content recommendations."</p>
                  </div>,
                  <div className="project-card" key="gaitset">
                    <div className="project-header">
                      <h4>gaitSetPy <a href="https://github.com/Alohomora-Labs/gaitSetPy" target="_blank" rel="noopener noreferrer" aria-label="View gaitSetPy on GitHub">[GitHub]</a> <a href="https://www.alohomora-labs.me" target="_blank" rel="noopener noreferrer" aria-label="Visit Alohomora Labs website">[Web]</a></h4>
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
        </div>
      </div>

      {/* Freelance Window */}
      {isFreelanceOpen && (
        <div className={`mac-window freelance-window ${isFreelanceMinimized ? 'minimized' : ''}`} style={{ position: 'absolute', zIndex: 50 }}>
          <div className="title-bar">
            <div className="buttons">
              <div className="close" title="Close" onClick={() => setIsFreelanceOpen(false)}></div>
              <div className="minimize" title="Minimize" onClick={() => setIsFreelanceMinimized(true)}></div>
              <div className="maximize" title="Maximize"></div>
            </div>
            <div className="window-title">freelance_experience.dmg</div>
          </div>
          <div className="content-container" style={{ background: 'var(--window-bg)' }}>
            <FreelanceExperience />
          </div>
        </div>
      )}

      {/* Terminal Window */}
      {isTerminalOpen && (
        <div className={`mac-window terminal-window ${isTerminalMinimized ? 'minimized' : ''}`} style={{ position: 'absolute', zIndex: 60, maxWidth: '800px', height: '500px' }}>
          <div className="title-bar">
            <div className="buttons">
              <div className="close" title="Close" onClick={() => setIsTerminalOpen(false)}></div>
              <div className="minimize" title="Minimize" onClick={() => setIsTerminalMinimized(true)}></div>
              <div className="maximize" title="Maximize"></div>
            </div>
            <div className="window-title">terminal — bash — 80x24</div>
          </div>
          <div className="content-container" style={{ background: '#0c0c0c' }}>
            <TerminalView onCommand={handleTerminalCommand} />
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

      {/* Desktop Icons */}
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
        className={`minimized-icon ${activeDragIcon.current === 'freelance' ? 'dragging' : ''}`} 
        onMouseDown={(e) => handleMouseDown(e, 'freelance')}
        onClick={() => handleIconClick('freelance')}
        style={{ 
          left: `${freelanceIconPosition.x}px`, 
          bottom: `${freelanceIconPosition.y}px`,
          position: 'absolute'
        }}
        title="Freelance Experience"
      >
        <div className="icon-image">
          <img src="https://img.icons8.com/color/48/000000/folder-invoices.png" alt="Freelance" draggable="false" />
        </div>
        <div className="icon-label">freelance_exp.dmg</div>
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
          <img src="https://img.icons8.com/color/48/000000/console.png" alt="Terminal" draggable="false" />
        </div>
        <div className="icon-label">terminal.app</div>
      </div>
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
