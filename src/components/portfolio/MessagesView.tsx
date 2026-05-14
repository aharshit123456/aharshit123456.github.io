import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  messages: Message[];
  isBot?: boolean;
}

const SUPABASE_URL = 'https://kolqskhjijhzghnrteqi.supabase.co/rest/v1/guestbook_notes';
const SUPABASE_KEY = 'sb_publishable_yUihxNM1P39vLWQ5jS0Y-Q_mCby5zgz';

const MessagesView: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [guestbookStep, setGuestbookStep] = useState<'name' | 'message' | 'done'>('name');
  const [guestbookData, setGuestbookData] = useState({ name: '', message: '' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chats, setChats] = useState<Chat[]>([]);

  const fetchNotesAsChats = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        const noteChats: Chat[] = data.map((note: any) => ({
          id: `note-${note.id}`,
          name: note.user_name,
          avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${note.user_name}`,
          lastMessage: note.message,
          messages: [
            { id: '1', text: note.message, sender: 'them', timestamp: new Date(note.created_at).toLocaleDateString() }
          ]
        }));

        const agentBot: Chat = {
          id: 'agent-pa',
          name: 'Agent A (PA)',
          avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=AgentA',
          lastMessage: 'Ready to assist. Ask me anything about Harshit.',
          isBot: true,
          messages: [
            { id: 'welcome', text: 'Identity verified. I am Harshit\'s Personal Assistant. I can provide confidential data on his projects, stack, and availability.', sender: 'them', timestamp: 'Now' },
            { id: 'hint', text: 'Try asking about: "status", "stack", "projects", or "contact".', sender: 'them', timestamp: 'Now' }
          ]
        };

        const guestbookBot: Chat = {
          id: 'guestbook-bot',
          name: 'Guestbook Bot',
          avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Guestbook',
          lastMessage: 'Leave a note on my wall!',
          isBot: true,
          messages: [
            { id: 'start', text: 'Hey there! I\'m the Guestbook Bot. Would you like to leave a note on Harshit\'s wall?', sender: 'them', timestamp: 'Now' },
            { id: 'ask-name', text: 'First, what is your name?', sender: 'them', timestamp: 'Now' }
          ]
        };

        setChats([agentBot, guestbookBot, ...noteChats]);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  useEffect(() => {
    fetchNotesAsChats();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatId, chats]);

  const activeChat = chats.find(c => c.id === activeChatId);

  const postNote = async (name: string, message: string) => {
    try {
      await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_name: name,
          message: message
        })
      });
      fetchNotesAsChats();
    } catch (err) {
      console.error('Failed to post note:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChatId) return;

    const userText = inputValue.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          lastMessage: userText,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));

    setInputValue('');

    // Bot Logic
    if (activeChatId === 'guestbook-bot') {
      if (guestbookStep === 'name') {
        setGuestbookData(prev => ({ ...prev, name: userText }));
        setGuestbookStep('message');
        setTimeout(() => addBotMessage('guestbook-bot', `Nice to meet you, ${userText}! What message would you like to leave?`), 800);
      } else if (guestbookStep === 'message') {
        setGuestbookStep('done');
        setTimeout(() => {
          addBotMessage('guestbook-bot', 'Got it! Adding your note to the wall... Done. ✅');
          postNote(guestbookData.name, userText);
        }, 800);
      }
    } else if (activeChatId === 'agent-pa') {
      const lowerText = userText.toLowerCase();
      setTimeout(() => {
        if (lowerText.includes('status')) {
          addBotMessage('agent-pa', 'System Check: Harshit is currently focused on Next.js optimizations and deep-learning research. Current location: Earth 🌍.');
        } else if (lowerText.includes('stack')) {
          addBotMessage('agent-pa', 'Core Stack: Next.js, FastAPI, Flutter, and PostgreSQL. Specialized in distributed systems and high-throughput architectures.');
        } else if (lowerText.includes('project')) {
          addBotMessage('agent-pa', 'Latest Deployments: FamCARE Ecosystem (FastAPI/Flutter), this macOS Portfolio, and ForgeTube AI Video Engine.');
        } else if (lowerText.includes('contact') || lowerText.includes('hire')) {
          addBotMessage('agent-pa', 'Protocol initiated. Reach Harshit via encrypted link at aharshit123456@gmail.com or find him on LinkedIn/GitHub.');
        } else if (lowerText.includes('help')) {
          addBotMessage('agent-pa', 'Available commands: [status], [stack], [projects], [contact], [hire].');
        } else {
          addBotMessage('agent-pa', 'Command not recognized. Please use standard protocol or ask for "help".');
        }
      }, 1000);
    }
  };

  const addBotMessage = (chatId: string, text: string) => {
    const botMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'them',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: text,
          messages: [...chat.messages, botMsg]
        };
      }
      return chat;
    }));
  };

  return (
    <div className="messages-app">
      {!activeChatId ? (
        <div className="chats-list">
          <div className="messages-header">
            <h1>Messages</h1>
            <i className="fas fa-edit"></i>
          </div>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search" />
          </div>
          <div className="chats-container">
            {chats.map(chat => (
              <div key={chat.id} className="chat-item" onClick={() => setActiveChatId(chat.id)}>
                <img src={chat.avatar} alt={chat.name} />
                <div className="chat-info">
                  <div className="chat-top">
                    <span className="name">{chat.name} {chat.isBot && <i className="fas fa-robot" style={{ fontSize: '0.6rem', color: '#0a84ff', marginLeft: '5px' }}></i>}</span>
                    <span className="time">{chat.messages[chat.messages.length - 1]?.timestamp}</span>
                  </div>
                  <p className="last-msg">{chat.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-view">
          <div className="chat-header">
            <div className="back" onClick={() => setActiveChatId(null)}>
              <i className="fas fa-chevron-left"></i>
              <span>{chats.length}</span>
            </div>
            <div className="contact-info">
              <img src={activeChat?.avatar} alt={activeChat?.name} />
              <span>{activeChat?.name}</span>
            </div>
            <i className="fas fa-video" style={{ opacity: 0.5 }}></i>
          </div>
          <div className="messages-container" ref={scrollRef}>
            {activeChat?.messages.map(msg => (
              <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                {msg.text}
                <span className="msg-time">{msg.timestamp}</span>
              </div>
            ))}
          </div>
          <form className="input-area" onSubmit={handleSendMessage}>
            <i className="fas fa-plus"></i>
            <div className="input-wrapper">
              <input 
                type="text" 
                placeholder="iMessage" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className={inputValue ? 'active' : ''}>
                <i className="fas fa-arrow-up"></i>
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .messages-app {
          height: 100%;
          background: #000;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }
        .chats-list {
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .messages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .messages-header h1 {
          font-size: 2.2rem;
          font-weight: 700;
          margin: 0;
        }
        .messages-header i {
          color: #0a84ff;
          font-size: 1.2rem;
        }
        .search-bar {
          background: #1c1c1e;
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .search-bar i {
          color: #8e8e93;
          font-size: 0.9rem;
        }
        .search-bar input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 1rem;
          color: #fff;
        }
        .chats-container {
          flex: 1;
          overflow-y: auto;
        }
        .chat-item {
          display: flex;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid #1c1c1e;
          cursor: pointer;
        }
        .chat-item img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #2c2c2e;
        }
        .chat-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .chat-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .name {
          font-weight: 600;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
        }
        .time {
          color: #8e8e93;
          font-size: 0.9rem;
        }
        .last-msg {
          color: #8e8e93;
          margin: 0;
          font-size: 0.95rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .chat-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #000;
        }
        .chat-header {
          padding: 10px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1c1c1e;
          background: #1c1c1e;
        }
        .back {
          color: #0a84ff;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 1.1rem;
          cursor: pointer;
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .contact-info img {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          margin-bottom: 2px;
        }
        .contact-info span {
          font-size: 0.75rem;
          font-weight: 500;
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #000;
        }
        .message-bubble {
          max-width: 75%;
          padding: 8px 12px;
          border-radius: 18px;
          font-size: 1rem;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .message-bubble.me {
          align-self: flex-end;
          background: #0a84ff;
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .message-bubble.them {
          align-self: flex-start;
          background: #262629;
          color: #fff;
          border-bottom-left-radius: 4px;
        }
        .msg-time {
          font-size: 0.65rem;
          opacity: 0.5;
          margin-top: 4px;
          align-self: flex-end;
        }
        .input-area {
          padding: 10px 15px 15px;
          display: flex;
          align-items: center;
          gap: 15px;
          background: #000;
        }
        .input-area i {
          color: #8e8e93;
          font-size: 1.4rem;
        }
        .input-wrapper {
          flex: 1;
          background: #1c1c1e;
          border: 1px solid #38383a;
          border-radius: 20px;
          padding: 5px 5px 5px 12px;
          display: flex;
          align-items: center;
        }
        .input-wrapper input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1rem;
          color: #fff;
        }
        .input-wrapper button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #38383a;
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .input-wrapper button.active {
          background: #0a84ff;
        }
        .input-wrapper button i {
          color: #fff;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default MessagesView;
