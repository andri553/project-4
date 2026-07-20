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
      text: `Halo ${user.fullName}! 👋\n\nSaya **PinjamAJA AI Assistant** — powered by Google Gemini AI.\n\nSaya bisa bantu:\n• Cek saldo & riwayat transaksi Anda\n• Info pinjaman aktif\n• Jawab pertanyaan seputar produk PinjamAJA\n• Eskalasi masalah keamanan ke admin\n\nSilakan tanya apa saja!`,
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
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
    setShowSuggestions(false);

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
        text: `Tidak dapat terhubung ke server AI. Pastikan backend berjalan.\n\nError: ${error.message || 'Network error'}`,
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

  // Simple markdown-ish renderer for bold text
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg)' }}>
      <PageHeader title="AI Assistant" onBack={() => navigate('/help')} />

      {/* Gemini Badge */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '6px 0', background: 'linear-gradient(90deg, rgba(66,133,244,0.08), rgba(156,39,176,0.08), rgba(244,180,0,0.08))',
        borderBottom: '1px solid var(--color-border)', fontSize: 10, color: 'var(--color-text-muted)'
      }}>
        <Sparkles size={10} style={{ color: '#9C27B0' }} />
        Powered by <strong style={{ color: 'var(--color-text-secondary)', marginLeft: 2 }}>Google Gemini AI</strong>
        <span style={{ margin: '0 4px' }}>•</span>
        Filtered with PinjamAJA Database
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: isBot ? 'flex-start' : 'flex-end',
                alignItems: 'start',
                gap: 8,
                maxWidth: '88%',
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                animation: 'fade-in 0.3s ease'
              }}
            >
              {isBot && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: msg.isSecurityAlert
                    ? 'rgba(239,68,68,0.15)'
                    : msg.isError
                      ? 'rgba(245,158,11,0.15)'
                      : 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(156,39,176,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 4
                }}>
                  {msg.isError ? (
                    <WifiOff size={13} color="#F59E0B" />
                  ) : (
                    <Bot size={13} color={msg.isSecurityAlert ? '#EF4444' : '#7C3AED'} />
                  )}
                </div>
              )}
              <div
                style={{
                  background: msg.isSecurityAlert
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.15))'
                    : msg.isError
                      ? 'rgba(245,158,11,0.08)'
                      : isBot
                        ? 'var(--color-surface)'
                        : 'linear-gradient(135deg, var(--color-primary), #7C3AED)',
                  color: isBot ? 'var(--color-text-primary)' : 'white',
                  border: msg.isSecurityAlert
                    ? '1.5px solid rgba(239,68,68,0.3)'
                    : msg.isError
                      ? '1px solid rgba(245,158,11,0.3)'
                      : isBot
                        ? '1px solid var(--color-border)'
                        : 'none',
                  borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  padding: '12px 14px',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: 12.5,
                  lineHeight: 1.6,
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
                      href={`mailto:andri@student.president.ac.id?subject=BANTUAN DARURAT: Akun Diretas - ${user.fullName}&body=Halo Admin, akun saya terindikasi diretas. Mohon bantuan investigasi darurat.%0D%0ANama: ${user.fullName}%0D%0ANomor HP: ${user.phoneNumber}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: '#EF4444', color: 'white', padding: '10px 12px', borderRadius: 10,
                        fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontSize: 11
                      }}
                    >
                      <Mail size={13} /> Kirim Email Darurat
                    </a>
                    <a
                      href="https://wa.me/6281900000002"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: '#10B981', color: 'white', padding: '10px 12px', borderRadius: 10,
                        fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontSize: 11
                      }}
                    >
                      <Phone size={13} /> Hubungi WhatsApp Admin <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>

              {!isBot && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--color-primary-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 4
                }}>
                  <User size={13} color="var(--color-primary)" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div style={{
            display: 'flex', alignItems: 'start', gap: 8, maxWidth: '70%',
            animation: 'fade-in 0.3s ease'
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(156,39,176,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bot size={13} color="#7C3AED" />
            </div>
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '4px 16px 16px 16px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
              color: 'var(--color-text-muted)'
            }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Gemini AI sedang berpikir...
            </div>
          </div>
        )}

        {/* Quick Suggestions */}
        {showSuggestions && messages.length <= 1 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>💡 Coba tanyakan:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  style={{
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 20, padding: '6px 12px', fontSize: 11,
                    cursor: 'pointer', color: 'var(--color-primary)',
                    transition: 'all 0.2s', fontWeight: 500
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.background = 'var(--color-primary-50)';
                    (e.target as HTMLElement).style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.background = 'var(--color-surface)';
                    (e.target as HTMLElement).style.borderColor = 'var(--color-border)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '12px 16px',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="input-field"
          placeholder={isLoading ? "Menunggu respons AI..." : "Tanyakan sesuatu ke AI..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          style={{
            flex: 1, borderRadius: 20, padding: '10px 16px', height: 42,
            opacity: isLoading ? 0.6 : 1
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: isLoading || !inputText.trim()
              ? 'var(--color-text-muted)'
              : 'linear-gradient(135deg, var(--color-primary), #7C3AED)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
            color: 'white',
            transition: 'all 0.2s',
            boxShadow: isLoading || !inputText.trim() ? 'none' : '0 2px 8px rgba(124,58,237,0.3)'
          }}
        >
          {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
