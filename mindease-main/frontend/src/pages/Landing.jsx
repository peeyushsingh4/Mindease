import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  MessageCircle, Users, Shield, BookOpen,
  Calendar, Activity, Lock, PhoneCall, ChevronRight, X, Phone
} from 'lucide-react';

// Crisis Helplines Modal
const CrisisModal = ({ onClose }) => {
  const helplines = [
    { country: '🇮🇳 India', lines: [
      { name: 'iCall (TISS)', number: '9152987821', desc: 'Mon–Sat, 8am–10pm' },
      { name: 'Vandrevala Foundation', number: '1860-2662-345', desc: '24/7 Helpline' },
      { name: 'AASRA', number: '9820466627', desc: '24/7 Suicide Prevention' },
      { name: 'Snehi', number: '044-24640050', desc: 'Emotional Support' },
    ]},
    { country: '🌍 International', lines: [
      { name: 'Crisis Text Line (US)', number: 'Text HOME to 741741', desc: '24/7 Text Support' },
      { name: 'Samaritans (UK)', number: '116 123', desc: '24/7 Free Call' },
      { name: 'Befrienders Worldwide', number: 'befrienders.org', desc: 'Find local helplines' },
    ]},
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(29,53,87,0.7)',
        backdropFilter: 'blur(6px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        animation: 'fadeIn 0.2s ease forwards',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '24px', padding: '2.5rem',
          maxWidth: '560px', width: '100%',
          boxShadow: '0 30px 80px rgba(29,53,87,0.3)',
          animation: 'slideInUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#457B9D,#1D3557)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhoneCall size={18} color="white" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1D3557', margin: 0, letterSpacing: '-0.02em' }}>Crisis Helplines</h2>
            </div>
            <p style={{ color: '#4a6580', fontSize: '0.88rem', margin: 0 }}>You are not alone. Reach out — someone is always there.</p>
          </div>
          <button onClick={onClose} style={{ background: '#F1FAEE', border: 'none', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: '#457B9D', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '12px', padding: '0.9rem 1.1rem', marginBottom: '1.75rem', fontSize: '0.85rem', color: '#92400E' }}>
          ⚠️ If you are in immediate danger, please call your local emergency number (112 in India, 911 in US).
        </div>

        {helplines.map(section => (
          <div key={section.country} style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8ea8be', marginBottom: '0.9rem' }}>{section.country}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {section.lines.map(line => (
                <div key={line.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F1FAEE', borderRadius: '12px', padding: '0.9rem 1.1rem', border: '1px solid rgba(69,123,157,0.1)' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1D3557', fontSize: '0.92rem' }}>{line.name}</div>
                    <div style={{ color: '#8ea8be', fontSize: '0.8rem' }}>{line.desc}</div>
                  </div>
                  <a
                    href={line.number.startsWith('Text') || line.number.includes('.org') ? '#' : `tel:${line.number.replace(/[^0-9+]/g,'')}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#457B9D', color: 'white', padding: '0.5rem 1rem', borderRadius: '9px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1D3557'}
                    onMouseLeave={e => e.currentTarget.style.background = '#457B9D'}
                  >
                    <Phone size={13} />
                    {line.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={onClose}
          style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg,#457B9D,#1D3557)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Inline SVG Brain Logo
const BrainLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 4C13.5 4 11.5 5.5 10.5 7.5C9.8 7.2 9 7 8.2 7C5.8 7 4 8.8 4 11.2C4 11.8 4.1 12.4 4.4 12.9C3 13.7 2 15.2 2 17C2 19.5 3.8 21.5 6.2 21.9C6.5 24.2 8.5 26 11 26L21 26C23.5 26 25.5 24.2 25.8 21.9C28.2 21.5 30 19.5 30 17C30 15.2 29 13.7 27.6 12.9C27.9 12.4 28 11.8 28 11.2C28 8.8 26.2 7 23.8 7C23 7 22.2 7.2 21.5 7.5C20.5 5.5 18.5 4 16 4Z"
      stroke="#457B9D"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="rgba(168,218,220,0.25)"
    />
    <path d="M16 6 L16 26" stroke="#A8DADC" strokeWidth="1" strokeDasharray="2 2.5" />
    <path d="M10 11 Q13.5 15 10 19" stroke="#457B9D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M22 11 Q18.5 15 22 19" stroke="#457B9D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <circle cx="16" cy="16" r="2.5" fill="#457B9D" opacity="0.7" />
  </svg>
);

const Landing = () => {
  const { loginAnonymous } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const featuresRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnonymous = async () => {
    try {
      await loginAnonymous();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: <MessageCircle size={28} />, title: 'AI-Guided Chat Support', desc: '24/7 confidential support for anxiety, stress, and panic episodes with smart crisis detection.' },
    { icon: <Users size={28} />, title: 'Peer Support Forum', desc: 'Connect anonymously with others, share experiences, and find strength in community.' },
    { icon: <Shield size={28} />, title: '100% Anonymous', desc: 'Privacy-first approach using anonymous IDs — no identity required to access all features.' },
    { icon: <BookOpen size={28} />, title: 'Resource Hub', desc: 'Curated videos, articles, and wellness guides tailored specifically for students.' },
    { icon: <Calendar size={28} />, title: 'Counselling System', desc: 'Book secure, private appointments with professional counsellors at your convenience.' },
    { icon: <Activity size={28} />, title: 'Wellness Tools', desc: 'Mood tracking, breathing exercises, and journaling modules to build daily resilience.' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', fontFamily: "'Inter', sans-serif" }}>

      {/* ===== STICKY NAVBAR ===== */}
      <nav
        className={scrolled ? 'scrolled' : ''}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.1rem 5%',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          background: scrolled ? 'rgba(241,250,238,0.97)' : 'rgba(241,250,238,0.82)',
          borderBottom: '1px solid rgba(168,218,220,0.25)',
          boxShadow: scrolled ? '0 2px 20px rgba(69,123,157,0.1)' : 'none',
          transition: 'all 0.3s ease',
          animation: 'fadeInDown 0.5s ease forwards',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontWeight: '800', fontSize: '1.35rem', color: 'var(--primary)', letterSpacing: '-0.03em' }}>
          <BrainLogo size={32} />
          MindCare
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
          {[
            { label: 'Home', href: '#' },
            { label: 'Features', href: '#features' },
            { label: 'About', href: '#about' },
            { label: 'Contact', href: '#contact' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              onClick={item.href === '#features' ? (e) => { e.preventDefault(); scrollToFeatures(); } : undefined}
              className="landing-nav-link"
              style={{ fontWeight: '500', fontSize: '0.9rem' }}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/login"
            className="landing-nav-link"
            style={{ fontWeight: '500', fontSize: '0.9rem' }}
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.4rem', fontSize: '0.9rem', marginLeft: '0.5rem' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section
        style={{
          background: 'linear-gradient(160deg, #F1FAEE 0%, #d4ecee 40%, #e8f5f7 70%, #F1FAEE 100%)',
          padding: '6rem 5% 8rem',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '550px', height: '550px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,218,220,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(69,123,157,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Badge */}
          <div
            className="animate-fade-in"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(168,218,220,0.25)', color: 'var(--primary)', padding: '0.45rem 1.1rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: '600', border: '1px solid rgba(168,218,220,0.5)', letterSpacing: '0.02em', marginBottom: '2.5rem' }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#A8DADC', display: 'inline-block', animation: 'pulseGlow 2s ease-in-out infinite' }} />
            Trusted by 50,000+ College Students
          </div>

          {/* Logo + Brand in hero */}
          <div
            className="animate-fade-in delay-100 animate-float"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}
          >
            <BrainLogo size={64} />
          </div>

          {/* Headline */}
          <h1
            className="animate-slide-up delay-200"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: '800', lineHeight: '1.1', color: 'var(--primary-hover)', marginBottom: '1.75rem', letterSpacing: '-0.04em' }}
          >
            Your Mental{' '}
            <span style={{ color: 'var(--primary)', position: 'relative', whiteSpace: 'nowrap' }}>
              Wellbeing
              <svg style={{ position: 'absolute', bottom: '-6px', left: 0, width: '100%', height: '6px' }} viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 7 Q50 1 100 5 Q150 9 200 3" stroke="#A8DADC" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            {' '}Matters.
          </h1>

          {/* Subtext */}
          <p
            className="animate-fade-in delay-300"
            style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: '1.75', maxWidth: '620px', margin: '0 auto 3rem' }}
          >
            A confidential, student-first platform providing AI support, peer community, and professional counselling. 100% anonymous. 100% secure.
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-fade-in delay-400"
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: '0.95rem 2.25rem', fontSize: '1rem' }}
            >
              Get Started Free
              <ChevronRight size={18} />
            </Link>
            <button
              onClick={scrollToFeatures}
              className="btn btn-outline"
              style={{ padding: '0.95rem 2.25rem', fontSize: '1rem' }}
            >
              Learn More
            </button>
            <button
              onClick={handleAnonymous}
              className="btn btn-ghost"
              style={{ padding: '0.95rem 2.25rem', fontSize: '1rem', background: 'rgba(69,123,157,0.1)', color: 'var(--primary)', border: '1.5px solid rgba(69,123,157,0.3)' }}
            >
              Start Anonymously →
            </button>
          </div>

          {/* Trust indicators */}
          <div
            className="animate-fade-in delay-600"
            style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '4rem', flexWrap: 'wrap' }}
          >
            {[
              { stat: '50K+', label: 'Students Supported' },
              { stat: '24/7', label: 'AI Support' },
              { stat: '100%', label: 'Anonymous' },
              { stat: 'AES-256', label: 'Encrypted' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.03em' }}>{item.stat}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" ref={featuresRef} style={{ maxWidth: '1200px', margin: '0 auto', padding: '7rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <span className="section-label">What We Offer</span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '800', color: 'var(--primary-hover)', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Comprehensive Support
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto', lineHeight: '1.7' }}>
            Everything you need to navigate college life with confidence and peace of mind.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card"
              style={{ padding: '2.25rem 2rem', borderRadius: '20px', animationDelay: `${i * 0.08}s` }}
            >
              <div
                style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(168,218,220,0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--primary-hover)' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.65', fontSize: '0.95rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DATA PRIVACY SECTION ===== */}
      <section id="about" style={{ background: 'linear-gradient(135deg, #1D3557 0%, #2a4a6b 100%)', color: 'white', padding: '7rem 5%' }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '5rem', flexWrap: 'wrap' }}>

          <div style={{ flex: 1, minWidth: '340px' }}>
            <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A8DADC', background: 'rgba(168,218,220,0.15)', padding: '0.35rem 0.9rem', borderRadius: '999px', marginBottom: '1.25rem', border: '1px solid rgba(168,218,220,0.3)' }}>Privacy First</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '2.5rem', lineHeight: '1.15', fontWeight: '800', letterSpacing: '-0.03em' }}>
              Your Data is Yours. Always.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
              {[
                'End-to-end encrypted personal journaling',
                'No academic records linked to your support',
                'Full control over your data and anonymity',
                'Compliant with international privacy standards',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(168,218,220,0.2)', border: '1.5px solid #A8DADC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#A8DADC', display: 'block' }} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
            <a href="#" style={{ color: '#A8DADC', textDecoration: 'underline', fontWeight: '500' }}>
              Read our Privacy & Consent Policy →
            </a>
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(168,218,220,0.2)', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(168,218,220,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(168,218,220,0.3)' }}>
                <Lock size={32} color="#A8DADC" />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: '700' }}>Military-Grade Encryption</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.7' }}>
                We use AES-256 encryption for all journals and chats. Even our admins cannot read your private thoughts.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ===== CRISIS BANNER ===== */}
      <section style={{ padding: '6rem 5%', display: 'flex', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '1000px',
            background: 'linear-gradient(135deg, #457B9D 0%, #1D3557 60%, #2a4a6b 100%)',
            borderRadius: '32px',
            padding: '4.5rem 3rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dot pattern */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />
          {/* Glow */}
          <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,218,220,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <span style={{ display: 'inline-block', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A8DADC', background: 'rgba(168,218,220,0.15)', padding: '0.35rem 0.9rem', borderRadius: '999px', marginBottom: '1.5rem', border: '1px solid rgba(168,218,220,0.3)' }}>Emergency Support</span>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'white', marginBottom: '1.25rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
              In a Crisis? We're Here.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', marginBottom: '2.5rem', maxWidth: '540px', margin: '0 auto 2.5rem', lineHeight: '1.7' }}>
              Our AI detection system is always on. Access immediate support right now — no login needed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowCrisisModal(true)}
                className="btn"
                style={{ backgroundColor: 'white', color: '#1D3557', fontWeight: '700', padding: '0.9rem 1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', cursor: 'pointer' }}
              >
                <PhoneCall size={18} />
                View Crisis Helplines
              </button>
              <button
                onClick={handleAnonymous}
                className="btn"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.35)', padding: '0.9rem 1.75rem', backdropFilter: 'blur(10px)', cursor: 'pointer' }}
              >
                <MessageCircle size={18} />
                Start Chatting Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="contact" style={{ backgroundColor: '#1D3557', padding: '5rem 5% 2.5rem', color: 'white' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(168,218,220,0.15)' }}>

          {/* Brand col */}
          <div style={{ maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.3rem', fontWeight: '800', color: 'white', marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
              <BrainLogo size={28} />
              MindCare
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.7' }}>
              Empowering college students through accessible, anonymous, and effective mental health support.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '5rem', flexWrap: 'wrap' }}>
            {[
              { title: 'Support',   links: ['AI Chat', 'Professional Help', 'Crisis Numbers'] },
              { title: 'Resources', links: ['Wellness Library', 'Peer Support', 'Success Stories'] },
              { title: 'Company',   links: ['About Us', 'Privacy Policy', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: '#A8DADC', marginBottom: '1.25rem', fontSize: '0.88rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.title}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {col.links.map(l => (
                    <a
                      key={l}
                      href="#"
                      style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#A8DADC'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: '1300px', margin: '2rem auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          <div>© 2025 MindCare Platform. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#A8DADC'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>Privacy</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#A8DADC'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>Terms</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#A8DADC'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>Cookies</a>
          </div>
        </div>
      </footer>

      {/* Crisis Helplines Modal */}
      {showCrisisModal && <CrisisModal onClose={() => setShowCrisisModal(false)} />}
    </div>
  );
};

export default Landing;
