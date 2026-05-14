import React, { useState, useEffect, useRef } from 'react';

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
}

interface TerminalProps {
  onCommand?: (cmd: string) => void;
}

const TerminalView: React.FC<TerminalProps> = ({ onCommand }) => {
  const [history, setHistory] = useState<TerminalLine[]>([
    { text: 'Welcome to Harshit\'s Space [aharshit123456.space]\nType "help" to see available commands.\nSystem status: All systems operational.\n', type: 'system' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();
    const newLines: TerminalLine[] = [{ text: `guest@harshit_agarwal:~$ ${cmd}`, type: 'input' }];

    switch (cleanCmd) {
      case 'help':
        newLines.push({ text: 'Available commands: help, ls, cat <file>, whoami, clear, date, echo <text>\n\nSpecialized Commands:\n- neofetch         : System information\n- matrix --start   : Enter the matrix\n- matrix --stop    : Exit the matrix\n- wget-resume      : Securely download resume.pdf\n- famcare --stats  : View project metrics\n- shoppin --vibe   : Vibe check\n- career --speedrun: Achievement breakdown\n- sudo hack_the_mainframes: Access root\n- brainrot         : GenZ mode\n- coffee           : Fuel check', type: 'output' });
        break;
      case 'neofetch':
        newLines.push({ text: `
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
        `, type: 'output' });
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
        setHistory(prev => [...prev, { text: `guest@harshit_agarwal:~$ ${cmd}`, type: 'input' }]);
        simulateWget();
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
    <div className="terminal-container" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-history" ref={scrollRef}>
        {history.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="terminal-input-row">
        <span className="prompt">guest@harshit_agarwal:~$</span>
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

      <style jsx>{`
        .terminal-container {
          background: #0c0c0c;
          color: #00ff00;
          font-family: 'Fira Code', monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 15px;
          font-size: 0.9rem;
          cursor: text;
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
      `}</style>
    </div>
  );
};

export default TerminalView;
