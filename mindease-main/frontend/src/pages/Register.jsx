import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle2, Eye, EyeOff, User, Mail, Lock, ArrowLeft, Phone, Users } from 'lucide-react';
import api from '../api';

const BrainLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 4C13.5 4 11.5 5.5 10.5 7.5C9.8 7.2 9 7 8.2 7C5.8 7 4 8.8 4 11.2C4 11.8 4.1 12.4 4.4 12.9C3 13.7 2 15.2 2 17C2 19.5 3.8 21.5 6.2 21.9C6.5 24.2 8.5 26 11 26L21 26C23.5 26 25.5 24.2 25.8 21.9C28.2 21.5 30 19.5 30 17C30 15.2 29 13.7 27.6 12.9C27.9 12.4 28 11.8 28 11.2C28 8.8 26.2 7 23.8 7C23 7 22.2 7.2 21.5 7.5C20.5 5.5 18.5 4 16 4Z"
      stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"
    />
    <path d="M16 6 L16 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2.5" />
    <path d="M10 11 Q13.5 15 10 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M22 11 Q18.5 15 22 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <circle cx="16" cy="16" r="2.5" fill="white" opacity="0.8" />
  </svg>
);

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);
  const { register, loginAnonymous } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return setError('Please fill in all required fields.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (!guardianName || !guardianPhone) return setError('Please provide emergency contact details.');
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
      // Save guardian details after registration
      try {
        await api.put('/auth/guardian', { guardianName, guardianPhone, guardianRelation });
      } catch (gErr) {
        console.error('Guardian save failed:', gErr.message);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnon = async () => {
    if (!guardianName || !guardianPhone) {
      return setError('Please fill in your emergency contact details above before continuing anonymously.');
    }
    setError('');
    setAnonLoading(true);
    try {
      await loginAnonymous({ guardianName, guardianPhone, guardianRelation });
      navigate('/dashboard');
    } catch (err) {
      setError('Could not start anonymous session. Please try again.');
    } finally {
      setAnonLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(160deg, #F1FAEE 0%, #d4ecee 50%, #F1FAEE 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Left Panel */}
      <div style={{
        width: '42%',
        background: 'linear-gradient(160deg, #457B9D 0%, #1D3557 100%)',
        color: 'white',
        padding: '3.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(168,218,220,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <Link to="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '3rem', width: 'fit-content' }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '10px', border: '1px solid rgba(255,255,255,0.25)' }}>
            <BrainLogo size={32} />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.03em' }}>MindCare</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: '800', lineHeight: 1.2, marginBottom: '1.25rem', letterSpacing: '-0.03em', position: 'relative', zIndex: 1 }}>
          Start your wellness journey today.
        </h1>
        <p style={{ fontSize: '0.95rem', opacity: 0.85, marginBottom: '3rem', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
          Create a free, private account and access personalized mental health support designed for college students.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
          {[
            'Free to join, always',
            '100% Anonymous Mode Available',
            'AES-256 Encrypted Data',
            'No Academic Records Shared',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', opacity: 0.9 }}>
              <CheckCircle2 size={18} color="#A8DADC" />
              {item}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2.5rem', fontSize: '0.78rem', opacity: 0.5, position: 'relative', zIndex: 1 }}>
          MindCare Mental Health Platform · Secure & Private
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-hover)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            Create Account
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Join 50,000+ students on MindCare.
          </p>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.9rem 1.1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.88rem', border: '1px solid #fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.5rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Your name" className="input-field" style={{ paddingLeft: '2.75rem' }} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.5rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" placeholder="name@university.edu" className="input-field" style={{ paddingLeft: '2.75rem' }} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.5rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.5rem' }}>I am a</label>
              {/* BUG FIX: The original dropdown included 'Admin' as a selectable role.
                  This is a security vulnerability — anyone could self-register as an admin
                  and gain full access to the admin panel, all user data, and crisis alerts.
                  Admin accounts should only be created directly in the database by existing admins.
                  The 'counsellor' option is kept so counsellors can self-register. */}
              <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="counsellor">Counsellor</option>
              </select>
            </div>

            {/* Guardian / Emergency Contact */}
            <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Users size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                  Emergency Contact *
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Only contacted if a safety concern is detected. Required for all users.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="Guardian full name" className="input-field" style={{ paddingLeft: '2.75rem' }} value={guardianName} onChange={e => setGuardianName(e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="tel" placeholder="Guardian phone e.g. +91 98765 43210" className="input-field" style={{ paddingLeft: '2.75rem' }} value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} />
                </div>
                <input type="text" placeholder="Relationship (e.g. Mother, Friend) — optional" className="input-field" value={guardianRelation} onChange={e => setGuardianRelation(e.target.value)} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || anonLoading}
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', borderRadius: '12px', marginTop: '0.5rem', opacity: loading ? 0.75 : 1 }}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.75rem 0', gap: '1rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          </div>

          <button
            type="button"
            onClick={handleAnon}
            disabled={anonLoading || loading}
            className="btn btn-outline"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', opacity: anonLoading ? 0.75 : 1 }}
          >
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
            </div>
            {anonLoading ? 'Starting session…' : 'Continue Anonymously'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
