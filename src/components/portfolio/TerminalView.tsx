import React, { useState, useEffect, useRef } from 'react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
}

interface TerminalProps {
  onCommand?: (cmd: string) => void;
  isMobile?: boolean;
}

const TerminalView: React.FC<TerminalProps> = ({ onCommand, isMobile }) => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { text: 'Welcome to Harshit\'s Space [aharshit123456.space]\nType "help" to see available commands.\nSystem status: All systems operational.\n', type: 'system' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isBooting, setIsBooting] = useState(false);
  const [isBooted, setIsBooted] = useState(false);
  const [bootStep, setBootStep] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const v86ContainerRef = useRef<HTMLTextAreaElement>(null);
  const emulatorRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Double ESC key listener to exit emulator
  useEffect(() => {
    let lastEsc = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 500) {
          // Double Esc triggered!
          if (emulatorRef.current) {
            try {
              emulatorRef.current.destroy();
            } catch (err) { }
            emulatorRef.current = null;
          }
          setIsBooted(false);
          setIsBooting(false);
          setHistory(prev => [
            ...prev,
            { text: 'Shutdown signal sent to Wasm VM. Connection closed.\nWelcome back to Harshit-OS. Safe to resume grind.', type: 'system' }
          ]);
        }
        lastEsc = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (emulatorRef.current) {
        try {
          emulatorRef.current.destroy();
        } catch (err) { }
      }
    };
  }, []);

  const bootLinux = () => {
    setBootStep('Injecting x86 emulator core (libv86)...');

    // Force clean any stale/CDN window bindings to guarantee local execution
    if ((window as any).V86Starter && !(window as any)._isLocalV86) {
      try {
        delete (window as any).V86Starter;
        delete (window as any).V86;
      } catch (e) {
        (window as any).V86Starter = undefined;
        (window as any).V86 = undefined;
      }
    }

    // Check if script is already present
    if (!(window as any).V86Starter) {
      // Temporarily hide module, exports, and define to prevent UMD script from misidentifying environment
      const oldModule = (window as any).module;
      const oldExports = (window as any).exports;
      const oldDefine = (window as any).define;

      try {
        (window as any).module = undefined;
        (window as any).exports = undefined;
        (window as any).define = undefined;
      } catch (e) { }

      const script = document.createElement('script');
      script.src = '/os/libv86.js';
      script.async = true;
      script.onload = () => {
        // Mark as locally loaded to avoid reloading or using stale CDN files
        (window as any)._isLocalV86 = true;

        // Restore environment variables
        try {
          (window as any).module = oldModule;
          (window as any).exports = oldExports;
          (window as any).define = oldDefine;
        } catch (e) { }
        startEmulator();
      };
      script.onerror = () => {
        // Restore environment variables
        try {
          (window as any).module = oldModule;
          (window as any).exports = oldExports;
          (window as any).define = oldDefine;
        } catch (e) { }
        setIsBooting(false);
        setHistory(prev => [...prev, { text: 'CRITICAL ERROR: Failed to load libv86 script from local assets directory /os/.', type: 'error' }]);
      };
      document.body.appendChild(script);
    } else {
      startEmulator();
    }
  };

  const startEmulator = () => {
    setBootStep('Downloading BIOS firmware & buildroot Linux kernel (32-bit x86)...');

    setTimeout(() => {
      if (!v86ContainerRef.current) {
        setIsBooting(false);
        setHistory(prev => [...prev, { text: 'DOM node for terminal render context was lost.', type: 'error' }]);
        return;
      }

      try {
        // Resolve constructor defensively
        let V86Constructor = (window as any).V86Starter || (window as any).V86;
        console.log('[v86 debug] Raw V86Starter from window:', V86Constructor);

        if (V86Constructor && typeof V86Constructor === 'object') {
          if (typeof V86Constructor.V86Starter === 'function') {
            V86Constructor = V86Constructor.V86Starter;
          } else if (typeof V86Constructor.default === 'function') {
            V86Constructor = V86Constructor.default;
          }
        }

        if (typeof V86Constructor !== 'function') {
          const keys = V86Constructor ? Object.keys(V86Constructor).join(', ') : 'null/undefined';
          throw new Error(`V86Starter is of type "${typeof V86Constructor}" (keys: ${keys}). Expected function constructor.`);
        }

        const origin = window.location.origin;

        const emulator = new V86Constructor({
          wasm_path: `${origin}/os/v86.wasm`,
          memory_size: 32 * 1024 * 1024, // 32MB is perfect for Buildroot console CLI
          bios: {
            url: `${origin}/os/seabios.bin`,
          },
          vga_bios: {
            url: `${origin}/os/vgabios.bin`,
          },
          cdrom: {
            url: `${origin}/os/linux.iso`,
          },
          autostart: true,
          serial_container: v86ContainerRef.current,
        });

        // Immediately transition to booted state so the user can watch the BIOS initialization
        // and boot loader sequence in real-time rather than getting stuck on a static loading screen!
        setIsBooting(false);
        setIsBooted(true);

        // Autofocus the console context
        setTimeout(() => {
          v86ContainerRef.current?.focus();
        }, 50);

        emulatorRef.current = emulator;
      } catch (err: any) {
        setIsBooting(false);
        setHistory(prev => [...prev, { text: `VM Hardware Panic: ${err.message || err}`, type: 'error' }]);
      }
    }, 200);
  };

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    const prompt = isMobile ? 'guest:~$ ' : 'guest@harshit_agarwal:~$ ';
    const newLines: TerminalLine[] = [{ text: `${prompt}${cmd}`, type: 'input' }];

    switch (cleanCmd) {
      case 'help':
        newLines.push({ text: 'Available commands: help, ls, cat <file>, whoami, clear, date, echo <text>\n\nSpecialized Commands:\n- neofetch         : System information\n- boot-linux       : Boot a REAL, live Linux kernel in your browser! 🚀 (v86 Wasm)\n- matrix --start   : Enter the matrix\n- matrix --stop    : Exit the matrix\n- wget-resume      : Securely download resume.pdf\n- famcare --stats  : View project metrics\n- shoppin --vibe   : Vibe check\n- career --speedrun: Achievement breakdown\n- sudo hack_the_mainframes: Access root\n- brainrot         : GenZ mode\n- coffee           : Fuel check', type: 'output' });
        break;
      case 'neofetch':
        newLines.push({
          text: `
       .---.          guest@harshit_agarwal
      /     \\         ---------------------
      | () () |        OS: Harshit-OS v1.0.4
       \\  ^  /         Host: Portfolio-NextJS
        |||||          Kernel: 6.9.420-custom
        |||||          Uptime: 4 years, 20 days
                       Packages: 69420 (npm)
                       Shell: bash 5.1
                       Resolution: 1920x1080
                       DE: MacAqua-Retro
                       CPU: Apple M4 Ultra (Simulated)
                       GPU: Neural Engine v2
                       Memory: 32GB / 128GB
        `, type: 'output'
        });
        break;
      case 'matrix --start':
        onCommand?.('matrix-start');
        newLines.push({ text: 'Wake up, Neo...', type: 'system' });
        break;
      case 'matrix --stop':
        onCommand?.('matrix-stop');
        newLines.push({ text: 'Back to reality.', type: 'system' });
        break;
      case 'ls':
        newLines.push({ text: 'about.txt  experience.log  projects/  skills.json  resume.pdf  secret_sauce.sh', type: 'output' });
        break;
      case 'whoami':
        newLines.push({ text: 'Harshit Agarwal - Fullstack Developer & AI Researcher\nStatus: Hard-stuck in Vim but building the future.', type: 'output' });
        break;
      case 'date':
        newLines.push({ text: new Date().toString(), type: 'output' });
        break;
      case 'clear':
        setHistory([]);
        return;
      case 'cat about.txt':
        newLines.push({ text: 'Hi, I\'m Harshit. I enjoy building dynamic, creative products from start to finish. Currently an undergrad at KIIT...', type: 'output' });
        break;
      case 'cat experience.log':
        newLines.push({ text: '[2026-04] Famcare: Fullstack Lead\n[2026-01] Endorphind: Founding SDE\n[2024-12] Shoppin\': Founding ML Engineer', type: 'output' });
        break;
      case 'famcare --stats':
        newLines.push({ text: 'Fetching Famcare Metrics...\n[SUCCESS] 2,000+ req/min handled\n[SUCCESS] 500+ commits across 4 repos\n[STATUS] Scaling like a beast.', type: 'system' });
        break;
      case 'shoppin --vibe':
        newLines.push({ text: 'Shoppin\' Vibe Check: \n- AI Try-on: 10/10\n- Multimodal Search: Absolute cinema\n- Infrastructure: Built different', type: 'output' });
        break;
      case 'career --speedrun':
        newLines.push({ text: 'Speedrunning Life:\n0:00 - Spawned\n18:00 - Entered KIIT\n20:00 - Architected Famcare (Any% WR)\n21:00 - GenAI Overlord at Endorphind', type: 'system' });
        break;
      case 'sudo hack_the_mainframes':
        newLines.push({ text: 'Accessing secure node...\n[#######---] 70%\nCRITICAL ERROR: Too much rizz detected. System overload.', type: 'error' });
        break;
      case 'brainrot':
        newLines.push({ text: 'skibidi toilet fanum tax sigma gyatt from ohio. no cap, fr fr. bussin. deadass.', type: 'output' });
        break;
      case 'secret_sauce.sh':
      case './secret_sauce.sh':
        newLines.push({ text: 'Unpopular Opinion: If you aren\'t using FastAPI in 2026, are you even a developer or just a glorified HTML editor? Stay mad. ratio + don\'t care + L.', type: 'error' });
        break;
      case 'coffee':
        newLines.push({ text: '418 I\'m a teapot (But I function on espresso).', type: 'system' });
        break;
      case 'wget-resume':
        const startPrompt = isMobile ? 'guest:~$ ' : 'guest@harshit_agarwal:~$ ';
        setHistory(prev => [...prev, { text: `${startPrompt}${cmd}`, type: 'input' }]);
        simulateWget();
        return;
      case 'boot-linux':
      case 'boot-alpine':
      case 'boot_linux':
      case 'boot_alpine':
      case 'sudo boot-linux':
      case 'sudo boot-alpine':
        setHistory(prev => [...prev, ...newLines, { text: 'Spawning WebAssembly hardware container...\nHydrating x86 emulation core and booting target kernel...', type: 'system' }]);
        setIsBooting(true);
        bootLinux();
        return;
      default:
        if (cleanCmd.startsWith('echo ')) {
          newLines.push({ text: cmd.substring(5), type: 'output' });
        } else if (cleanCmd === '') {
          // empty line
        } else {
          newLines.push({ text: `command not found: ${cleanCmd}. Try "help" if you're lost in the sauce.`, type: 'error' });
        }
    }

    setHistory(prev => [...prev, ...newLines]);
  };

  const simulateWget = async () => {
    const lines: { text: string; type: TerminalLine['type'] }[] = [
      { text: '--2026-05-15 00:06:42--  https://servers.nasa.gov/internal/harshit_agarwal_resume_v4.pkg', type: 'output' },
      { text: 'Resolving servers.nasa.gov (servers.nasa.gov)... 198.118.196.147', type: 'output' },
      { text: 'Connecting to servers.nasa.gov (servers.nasa.gov)|198.118.196.147|:443... connected.', type: 'output' },
      { text: 'HTTP request sent, awaiting response... 200 OK', type: 'output' },
      { text: 'Length: 2,451,023 (2.3M) [application/octet-stream]', type: 'output' },
      { text: 'Saving to: ‘harshit_agarwal_resume_v4.pkg’\n', type: 'output' },
    ];

    for (const line of lines) {
      await new Promise(r => setTimeout(r, 600));
      setHistory(prev => [...prev, line]);
    }

    // Progress Bar Simulation
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 400));
      const barLength = 20;
      const filledLength = Math.round((i / 100) * barLength);
      const bar = '='.repeat(filledLength) + '>'.repeat(i < 100 ? 1 : 0) + '.'.repeat(barLength - filledLength - (i < 100 ? 1 : 0));
      const progressLine = ` ${i}% [${bar}] ${i === 100 ? '2.3M' : (i * 23).toFixed(0) + 'K'}/s  eta 0s`;

      setHistory(prev => {
        const lastLine = prev[prev.length - 1];
        if (lastLine.text.includes('% [')) {
          return [...prev.slice(0, -1), { text: progressLine, type: 'output' }];
        }
        return [...prev, { text: progressLine, type: 'output' }];
      });
    }

    await new Promise(r => setTimeout(r, 500));
    setHistory(prev => [...prev, { text: '\n2026-05-15 00:06:55 (156 KB/s) - ‘harshit_agarwal_resume_v4.pkg’ saved [2451023/2451023]\n', type: 'system' }]);

    // Trigger real download
    const link = document.createElement('a');
    link.href = 'resume.pdf';
    link.download = 'Harshit_Agarwal_Resume.pdf';
    link.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleCommand(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="terminal-container" onClick={() => !isBooted && inputRef.current?.focus()}>

      {/* 1. Loading Screen */}
      {isBooting && (
        <div className="vm-boot-loader">
          <div className="spinner" />
          <p className="boot-title">CORE HYDRATION IN PROGRESS</p>
          <p className="boot-sub">{bootStep}</p>
          <p className="boot-tip">Tip: Press ESC twice rapidly to abort at any time.</p>
        </div>
      )}

      {/* 2. Real Running Wasm VM serial terminal */}
      <textarea
        ref={v86ContainerRef}
        id="v86-terminal-console"
        className="v86-console-view"
        tabIndex={0}
        style={{ display: isBooted ? 'block' : 'none' }}
        spellCheck={false}
        autoComplete="off"
        onKeyDown={(e) => {
          if (!emulatorRef.current) return;
          
          // 1. Intercept Tab key for autocomplete
          if (e.key === 'Tab') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\t');
            return;
          }
          
          // 2. Intercept Backspace key
          if (e.key === 'Backspace') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\x7f');
            return;
          }
          
          // 3. Intercept Ctrl + C interrupt
          if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\x03');
            return;
          }
          
          // 4. Intercept Enter key
          if (e.key === 'Enter') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\r');
            return;
          }
          
          // 5. Intercept Arrow Keys for navigation and command history
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\x1b[A');
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\x1b[B');
            return;
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\x1b[D');
            return;
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            emulatorRef.current.serial0_send('\x1b[C');
            return;
          }
        }}
      />

      {isBooted && (
        <div className="esc-exit-badge">
          ⚡ Virtual Arch/Buildroot Linux active. Press <strong>ESC + ESC</strong> to exit.
        </div>
      )}

      {/* 3. standard Host Terminal */}
      {!isBooting && !isBooted && (
        <>
          <div className="terminal-history" ref={scrollRef}>
            {history.map((line, i) => (
              <div key={i} className={`terminal-line ${line.type}`}>
                {line.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="terminal-input-row">
            <span className="prompt">{isMobile ? 'guest:~$ ' : 'guest@harshit_agarwal:~$ '}</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </>
      )}

      <style jsx>{`
        .terminal-container {
          background: #0c0c0c;
          color: #00ff00;
          font-family: 'Fira Code', monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: ${isMobile ? '10px' : '15px'};
          font-size: ${isMobile ? '0.8rem' : '0.9rem'};
          cursor: text;
          position: relative;
          overflow: hidden;
        }
        .terminal-history {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 5px;
        }
        .terminal-line {
          white-space: pre-wrap;
          margin-bottom: 4px;
          line-height: 1.4;
        }
        .terminal-line.input { color: #fff; }
        .terminal-line.output { color: #aaa; }
        .terminal-line.error { color: #ff4757; }
        .terminal-line.system { color: #00ff00; opacity: 0.8; }
        
        .terminal-input-row {
          display: flex;
          gap: 10px;
        }
        .prompt {
          color: #51afef;
          white-space: nowrap;
        }
        input {
          background: transparent;
          border: none;
          color: #fff;
          font-family: inherit;
          font-size: inherit;
          outline: none;
          flex: 1;
        }
        
        /* Wasm Linux VM UI styling */
        .vm-boot-loader {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #10b981;
          gap: 12px;
          text-align: center;
        }
        .spinner {
          width: 28px;
          height: 28px;
          border: 2px solid #1f2937;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .boot-title {
          font-weight: 700;
          letter-spacing: 2px;
          font-size: 11px;
          text-transform: uppercase;
        }
        .boot-sub {
          color: #a1a1aa;
          font-size: 12px;
        }
        .boot-tip {
          color: #4b5563;
          font-size: 10px;
          margin-top: 15px;
        }
        
        .v86-console-view {
          flex: 1;
          width: 100%;
          height: 100%;
          font-size: 13px;
          line-height: 1.4;
          color: #10b981;
          background: #000;
          border: none;
          outline: none;
          resize: none;
          font-family: 'Fira Code', 'Courier New', monospace;
          padding: 10px;
          box-sizing: border-box;
          overflow-y: auto;
        }
        .v86-console-view::-webkit-scrollbar {
          width: 6px;
        }
        .v86-console-view::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 3px;
        }
        .esc-exit-badge {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 6px;
          backdrop-filter: blur(10px);
          pointer-events: none;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default TerminalView;
