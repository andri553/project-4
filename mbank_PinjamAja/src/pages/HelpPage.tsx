import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, MessageCircle, Mail } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { faqs } from '@/data/mockData';

export default function HelpPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = ['Semua', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'Semua' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="Pusat Bantuan" onBack={() => navigate('/account')} />

      <div style={{ padding: '16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Cari topik bantuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {/* Categories */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: selectedCategory === cat ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: selectedCategory === cat ? 'var(--color-primary-50)' : 'var(--color-surface)',
                color: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="card animate-fade-in-up" style={{ overflow: 'hidden', marginBottom: 24 }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Tidak ada hasil yang ditemukan</p>
            </div>
          ) : (
            filteredFaqs.map((faq, i) => (
              <div key={faq.id} style={{ borderBottom: i < filteredFaqs.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  style={{
                    width: '100%', padding: '16px', background: 'none', border: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {faq.question}
                  </span>
                  {expandedFaq === faq.id ? <ChevronUp size={18} color="var(--color-primary)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
                </button>
                {expandedFaq === faq.id && (
                  <div className="animate-fade-in" style={{ padding: '0 16px 16px', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact CS */}
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Masih butuh bantuan?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={() => navigate('/chat')} className="card card-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={20} color="var(--color-primary)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700 }}>AI Chat</p>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Asisten Cerdas 24/7</p>
            </div>
          </button>
          
          <a href="mailto:andri@student.president.ac.id" style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} color="var(--color-success)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Email Admin</p>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>andri@student.president.ac.id</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
