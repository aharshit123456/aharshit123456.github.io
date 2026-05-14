'use client';

import { useState, useEffect } from 'react';
import { MacWindow } from '@/components/layout/MacWindow';
import { Hero } from '@/components/portfolio/Hero';
import { Section } from '@/components/portfolio/Section';
import { Skills } from '@/components/portfolio/Skills';
import { Experience } from '@/components/portfolio/Experience';
import { Projects } from '@/components/portfolio/Projects';
import { Freelance } from '@/components/portfolio/Freelance';
import { Hobbies } from '@/components/portfolio/Hobbies';

type Tab = {
  id: string;
  title: string;
  content: string | React.ReactNode;
  isIframe?: boolean;
};

export default function Portfolio() {
  const [activeTabId, setActiveTabId] = useState('main');
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'main', title: 'harshit_agarwal.dev', content: null }]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFlipped, setIsFlipped] = useState(true);
  const [showHint, setShowHint] = useState(false);

  // Theme Logic
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  // Tab Logic
  const openTab = (id: string, title: string, content: string | React.ReactNode, isIframe = false) => {
    if (tabs.find(t => t.id === id)) {
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
    if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const openResumeTab = () => {
    openTab('resume', 'Resume.pdf', <iframe src="resume.pdf#toolbar=0" style={{ width: '100%', height: '100%', border: 'none' }}></iframe>, true);
  };

  const openImageTab = (title: string, imagePath: string) => {
    const id = 'certificate-' + Date.now();
    openTab(id, title, (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#000' }}>
        <img src={imagePath} style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} alt={title} />
      </div>
    ));
  };

  const openFamcareNotes = () => {
    openTab('famcare-notes', 'FamCARE Architecture Notes', (
      <div className="personal-notes">
        <h1>Architecting for the Hyper-Local Economy</h1>
        <p>Full architectural breakdown of the FamCARE ecosystem...</p>
        <h2>1. The Modular Monolith</h2>
        <p>Designed for the Strangler Pattern to ensure seamless microservice extraction.</p>
      </div>
    ));
  };

  const openShoppinStats = () => {
    openTab('shoppin-stats', 'Shoppin\' Progression', <div className="timeline-container"><h2>Shoppin\' Stats</h2><p>Level Progression (Dec \'24 - Nov \'25)</p></div>);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MacWindow 
      isDarkMode={isDarkMode} 
      toggleTheme={toggleTheme} 
      tabs={tabs} 
      activeTabId={activeTabId} 
      switchTab={setActiveTabId} 
      closeTab={closeTab}
    >
      <div className={`tab-content ${activeTabId === 'main' ? 'active' : ''}`}>
        <header className="nav-header">
          <div className="nav-item">
            <span className="label">//portfolio</span>
            <a href="#" className="link">harshit_agarwal.dev</a>
          </div>
          <div className="nav-item">
            <span className="label">//contact</span>
            <a href="mailto:aharshit123456@gmail.com" className="link">aharshit123456@gmail.com</a>
          </div>
          <div className="nav-item">
            <span className="label">//github</span>
            <a href="https://github.com/aharshit123456" target="_blank" className="link">github.com/aharshit123456</a>
          </div>
          <div className="nav-item">
            <span className="label">//linkedin</span>
            <a href="https://www.linkedin.com/in/aharshit123456/" target="_blank" className="link">linkedin.com/in/aharshit123456</a>
          </div>
        </header>

        <main>
          <Hero isFlipped={isFlipped} setIsFlipped={setIsFlipped} showHint={showHint} />
          
          <Section id="about" title="//about">
            <p className="code-block">
              class Harshit: <br />
              &nbsp;&nbsp;def __init__(self):<br />
              &nbsp;&nbsp;&nbsp;&nbsp;self.role = "Founding SDE & System Architect"<br />
              &nbsp;&nbsp;&nbsp;&nbsp;self.location = "India"<br />
              &nbsp;&nbsp;&nbsp;&nbsp;self.education = "B.Tech CSE @ KIIT (9.3 CGPA)"<br />
              &nbsp;&nbsp;&nbsp;&nbsp;self.loves = ["Building Scalable Systems", "AI/ML", "Hajime no Ippo"]
            </p>
            <p className="bio">
              Hi, I'm Harshit. I enjoy building dynamic, creative products from start to finish.
              I'm a heavyweight coder with a reach extending from low-level C++ to high-level Distributed Systems.
            </p>
          </Section>

          <Skills />
          <Experience onOpenNotes={openFamcareNotes} onOpenStats={openShoppinStats} onOpenImage={openImageTab} />
          <Freelance />
          <Projects />
          <Hobbies onOpenTab={openTab} />

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

      {tabs.map(tab => tab.id !== 'main' && (
        <div key={tab.id} className={`tab-content ${activeTabId === tab.id ? 'active' : ''}`} style={tab.id === 'resume' ? { padding: '0', height: '100%', overflow: 'hidden' } : {}}>
          {typeof tab.content === 'string' ? <div dangerouslySetInnerHTML={{ __html: tab.content }} /> : tab.content}
        </div>
      ))}
    </MacWindow>
  );
}
