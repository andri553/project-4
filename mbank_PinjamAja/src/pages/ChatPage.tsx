import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Mail, Phone, ExternalLink, Loader2, Sparkles, WifiOff } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAuthStore } from '@/stores/authStore';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isSecurityAlert?: boolean;
  isError?: boolean;
  isNew?: boolean; // flag for typewriter effect
};

const SUGGESTIONS = [
  'Berapa saldo saya?',
  'Info pinjaman aktif',
  'Riwayat transaksi terakhir',
  'Cara reset password',
  'Syarat pengajuan pinjaman',
  'Biaya QRIS internasional'
];

// Helper: fetch with auto-refresh token on 401
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // If 401, try refresh token
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (refreshToken) {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      const refreshJson = await refreshRes.json();
      if (refreshJson.success) {
        const { token: newToken, refreshToken: newRefreshToken } = refreshJson.data;
        localStorage.setItem('auth_token', newToken);
        if (newRefreshToken) {
          localStorage.setItem('auth_refresh_token', newRefreshToken);
        }
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    }
  }

  return res;
}

const TypewriterMessage = ({ text, onComplete, renderFn }: { text: string, onComplete: () => void, renderFn: (text: string) => React.ReactNode }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        onComplete();
      }
    }, 15);
    
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <>{renderFn(displayedText)}</>;
};

export default function ChatPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user)!;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Halo ${user.fullName} 🤖!\n\nApakah ada transaksi atau layanan PinjamAJA yang ingin Anda tanyakan hari ini?\nSaya siap membantu Anda.`,
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageToAPI = async (messageText: string) => {
    setIsLoading(true);

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    try {
      const response = await fetchWithAuth('/api/v1/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          history: messages.filter(m => m.id !== 'welcome').map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        const botMsg: Message = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: data.data.response,
          timestamp: new Date(),
          isSecurityAlert: data.data.isSecurityAlert,
          isNew: true
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errorMsg: Message = {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: data.message || 'Terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date(),
          isError: true,
          isNew: true
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: `Tidak dapat terhubung ke server AI.\n\nError: ${error.message || 'Network error'}`,
        timestamp: new Date(),
        isError: true,
        isNew: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendMessageToAPI(inputText.trim());
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessageToAPI(suggestion);
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FAFAFA' }}>
      <PageHeader title="AI Assistant" onBack={() => navigate('/help')} />

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {messages.map((msg, index) => {
          const isBot = msg.sender === 'bot';
          const isLast = index === messages.length - 1;

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isBot ? 'flex-start' : 'flex-end',
                gap: 8,
                maxWidth: '90%',
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                animation: 'fade-in 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'start', flexDirection: isBot ? 'row' : 'row-reverse' }}>
                {isBot && (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'white', border: '1px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={18} color="#374151" />
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      background: msg.isSecurityAlert ? '#FEF2F2' : msg.isError ? '#FFFBEB' : isBot ? 'white' : '#7C3AED',
                      color: isBot ? '#1F2937' : 'white',
                      border: msg.isSecurityAlert ? '1px solid #FCA5A5' : msg.isError ? '1px solid #FCD34D' : isBot ? '1px solid #E5E7EB' : 'none',
                      borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      padding: '14px 18px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.isNew ? (
                      <TypewriterMessage 
                        text={msg.text} 
                        renderFn={renderText} 
                        onComplete={() => {
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isNew: false } : m));
                        }} 
                      />
                    ) : (
                      renderText(msg.text)
                    )}

                    {/* Security Escalation Buttons */}
                    {msg.isSecurityAlert && (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <a
                          href={`mailto:andri@student.president.ac.id?subject=BANTUAN DARURAT`}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: '#EF4444', color: 'white', padding: '10px 12px', borderRadius: 8,
                            fontWeight: 600, textDecoration: 'none', textAlign: 'center', fontSize: 13
                          }}
                        >
                          <Mail size={14} /> Hubungi Investigasi
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Volume Icon below bot message */}
                  {isBot && (
                    <div style={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', paddingLeft: 4 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* If this is the latest bot message, show suggestion pills right below it */}
              {isBot && isLast && !isLoading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, marginLeft: 48 }}>
                  {SUGGESTIONS.slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      style={{
                        background: '#E5E7EB', border: 'none',
                        borderRadius: 16, padding: '8px 14px', fontSize: 13,
                        cursor: 'pointer', color: '#374151',
                        transition: 'background 0.2s', fontWeight: 500,
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.background = '#D1D5DB'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.background = '#E5E7EB'}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'start', animation: 'fade-in 0.3s ease' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'white', border: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bot size={18} color="#374151" />
            </div>
            <div style={{
              background: 'white', border: '1px solid #E5E7EB',
              borderRadius: '4px 16px 16px 16px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
              color: '#6B7280', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <div className="typing-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <style>{`
                .typing-dots { display: flex; gap: 4px; }
                .dot { width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
                .dot:nth-child(1) { animation-delay: -0.32s; }
                .dot:nth-child(2) { animation-delay: -0.16s; }
                @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
              `}</style>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Section */}
      <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #E5E7EB' }}>
        <form
          onSubmit={handleSendMessage}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={isLoading ? "Menunggu respons..." : "Search or type a message..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            style={{
              flex: 1, borderRadius: 8, border: '1px solid #E5E7EB',
              padding: '12px 16px', height: 48, fontSize: 14,
              outline: 'none', background: 'white',
              opacity: isLoading ? 0.6 : 1
            }}
            onFocus={(e) => e.target.style.borderColor = '#9CA3AF'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: isLoading || !inputText.trim() ? '#9CA3AF' : '#8CA3B8',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isLoading || !inputText.trim() ? 'default' : 'pointer',
              color: 'white',
              transition: 'all 0.2s'
            }}
          >
            <Send size={20} style={{ marginLeft: 2 }} />
          </button>
        </form>
      </div>
    </div>
  );
}
