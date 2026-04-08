import React, { useState, useEffect, useRef, useContext } from 'react';
import api from '../api';
import { Send, Bot, Phone, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// ─── Guardian Setup Modal ─────────────────────────────────────────────────────
const GuardianModal = ({ onSave, isAnonymous }) => {
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!guardianName.trim() || !guardianPhone.trim()) {
      setError('Please fill in at least the guardian name and phone number.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/guardian', { guardianName, guardianPhone, guardianRelation });
      onSave({ guardianName, guardianPhone, guardianRelation });
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '2.5rem',
        width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ background: '#fef3c7', borderRadius: '50%', padding: '0.5rem', display: 'flex' }}>
            <ShieldCheck size={22} color="#d97706" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Emergency Contact Required</h2>
        </div>

        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          {isAnonymous
            ? 'Even in anonymous mode, we need an emergency contact. Your identity stays private — this is only used if our system detects a safety concern.'
            : 'Please provide an emergency contact. This will only be contacted if our system detects you may be in crisis.'}
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Guardian / Emergency Contact Name *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Priya Sharma"
              value={guardianName}
              onChange={e => setGuardianName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input
              style={inputStyle}
              placeholder="+91 98765 43210"
              value={guardianPhone}
              onChange={e => setGuardianPhone(e.target.value)}
              type="tel"
            />
          </div>
          <div>
            <label style={labelStyle}>Relationship (optional)</label>
            <input
              style={inputStyle}
              placeholder="e.g. Mother, Friend, Roommate"
              value={guardianRelation}
              onChange={e => setGuardianRelation(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: '1.5rem', width: '100%', padding: '0.9rem',
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'Saving…' : 'Save & Start Chat'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
          🔒 This information is encrypted and never shared except in emergencies.
        </p>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: '700',
  color: 'var(--primary)', marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase'
};
const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '8px',
  border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem',
  boxSizing: 'border-box', color: '#1e293b'
};

// ─── Crisis Banner ────────────────────────────────────────────────────────────
const CrisisBanner = ({ onDismiss }) => (
  <div style={{
    background: 'linear-gradient(135deg, #fef2f2, #fff1f2)',
    border: '2px solid #fca5a5', borderRadius: '16px',
    padding: '1.25rem 1.5rem', marginBottom: '1rem',
    display: 'flex', gap: '1rem', alignItems: 'flex-start'
  }}>
    <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
        🚨 Crisis Alert Triggered
      </div>
      <div style={{ fontSize: '0.85rem', color: '#7f1d1d', lineHeight: 1.6 }}>
        Your emergency contact has been notified and a counsellor has been alerted.
        Please call <strong>iCall: 9152987821</strong> or <strong>Emergency: 112</strong> if you need immediate help.
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <a href="tel:9152987821" style={crisisBtn('#dc2626')}>
          <Phone size={14} /> iCall Helpline
        </a>
        <a href="tel:112" style={crisisBtn('#7c3aed')}>
          <Phone size={14} /> Emergency 112
        </a>
      </div>
    </div>
    <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}>
      <X size={18} />
    </button>
  </div>
);

const crisisBtn = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.4rem 0.9rem', borderRadius: '999px',
  background: color, color: 'white', textDecoration: 'none',
  fontSize: '0.8rem', fontWeight: '600'
});

// ─── Consultant Ping Banner ───────────────────────────────────────────────────
const ConsultantPing = ({ onDismiss }) => (
  <div style={{
    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    border: '2px solid #93c5fd', borderRadius: '12px',
    padding: '1rem 1.25rem', marginBottom: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem'
  }}>
    <div style={{ fontSize: '1.2rem' }}>👨‍⚕️</div>
    <div style={{ flex: 1, fontSize: '0.88rem', color: '#1e40af', lineHeight: 1.5 }}>
      <strong>A counsellor has been notified</strong> and will reach out to you shortly.
      You can also <a href="/appointments" style={{ color: '#2563eb', fontWeight: '600' }}>book a priority appointment</a>.
    </div>
    <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd' }}>
      <X size={16} />
    </button>
  </div>
);

// ─── Main Chatbot Component ───────────────────────────────────────────────────
const Chatbot = () => {
  const { user } = useContext(AuthContext);

  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [guardianSaved, setGuardianSaved] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [showConsultantPing, setShowConsultantPing] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm MindEase, your AI wellness companion. I'm here to listen without judgment and support you.\n\nHow are you feeling today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Load persistent chat history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/chat/history');
        const saved = res.data.data;
        if (saved && saved.length > 0) {
          const restored = saved.map(m => ({
            role: m.role,
            text: m.text,
            isCrisis: m.isCrisis,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(restored);
        }
      } catch (err) {
        // History load failure is non-fatal — start fresh
        console.error('Could not load chat history:', err.message);
      }
    };
    loadHistory();
  }, []);

  // Check if guardian info is already on file
  useEffect(() => {
    if (user) {
      const hasGuardian = user.guardianPhone && user.guardianPhone.trim().length > 0;
      setGuardianSaved(hasGuardian);
      if (!hasGuardian) setShowGuardianModal(true);
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGuardianSave = (details) => {
    setGuardianSaved(true);
    setShowGuardianModal(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      role: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Send full conversation history for context-aware replies
      const historyForAPI = updatedMessages.slice(0, -1); // all except the last user msg
      const res = await api.post('/chat/respond', { message: input, history: historyForAPI });
      const { response, isCrisis, consultantPing } = res.data.data;

      if (isCrisis) setShowCrisisBanner(true);
      if (consultantPing && !isCrisis) setShowConsultantPing(true);

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: response,
        isCrisis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: err.code === 'ECONNABORTED'
          ? 'Connection timed out. Please check your internet and try again.'
          : 'I\'m taking a moment to process. Please try again in a second.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '2rem' }}>

      {showGuardianModal && (
        <GuardianModal onSave={handleGuardianSave} isAnonymous={user?.isAnonymous} />
      )}

      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderRadius: '999px', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--secondary)' }}>MindEase AI Companion</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--success)', borderRadius: '50%', display: 'inline-block' }}></span>
              ALWAYS LISTENING · AI-POWERED
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {guardianSaved && (
            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '600', background: '#dcfce7', padding: '0.3rem 0.9rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={13} /> Guardian on file
            </span>
          )}
          {user?.isAnonymous && (
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', backgroundColor: 'var(--primary-light)', padding: '0.4rem 1rem', borderRadius: '999px' }}>
              Anonymous
            </span>
          )}
        </div>
      </div>

      {/* Crisis / Consultant Banners */}
      {showCrisisBanner && <CrisisBanner onDismiss={() => setShowCrisisBanner(false)} />}
      {showConsultantPing && !showCrisisBanner && <ConsultantPing onDismiss={() => setShowConsultantPing(false)} />}

      {/* Chat Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '24px', padding: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '78%', display: 'flex', gap: '0.75rem' }}>
              {m.role === 'assistant' && (
                <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={18} />
                </div>
              )}
              <div>
                <div style={{
                  backgroundColor: m.isCrisis ? '#fef2f2' : (m.role === 'user' ? 'var(--primary)' : 'var(--bg-main)'),
                  color: m.isCrisis ? '#991b1b' : (m.role === 'user' ? 'white' : 'var(--text-primary)'),
                  padding: '1rem 1.25rem',
                  borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  boxShadow: 'var(--shadow-sm)',
                  border: m.isCrisis ? '2px solid #f87171' : '1px solid var(--border-light)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  fontSize: '0.92rem'
                }}>
                  {m.text}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.75rem' }}>
              <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} />
              </div>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem 1.25rem', borderRadius: '20px 20px 20px 4px', border: '1px solid var(--border-light)' }}>
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span key={i} style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: 'var(--primary)', display: 'inline-block',
                      animation: `bounce 1.2s ${delay}s infinite`
                    }} />
                  ))}
                  <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }`}</style>
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '999px', padding: '0.5rem 0.5rem 0.5rem 1.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>💬</span>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Share how you're feeling…"
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--primary)', fontSize: '1rem' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !input.trim()) ? 0.5 : 1, flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
            MindEase AI is a support tool, not a clinical replacement. In emergencies, call 112 immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
