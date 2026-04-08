import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Moon, Sun, Home, MessageCircle, ClipboardList, Calendar, Book, Users, LogOut, Brain } from 'lucide-react';

// Inline SVG brain logo for crisp rendering at all sizes
const BrainLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 4C13.5 4 11.5 5.5 10.5 7.5C9.8 7.2 9 7 8.2 7C5.8 7 4 8.8 4 11.2C4 11.8 4.1 12.4 4.4 12.9C3 13.7 2 15.2 2 17C2 19.5 3.8 21.5 6.2 21.9C6.5 24.2 8.5 26 11 26L21 26C23.5 26 25.5 24.2 25.8 21.9C28.2 21.5 30 19.5 30 17C30 15.2 29 13.7 27.6 12.9C27.9 12.4 28 11.8 28 11.2C28 8.8 26.2 7 23.8 7C23 7 22.2 7.2 21.5 7.5C20.5 5.5 18.5 4 16 4Z"
      stroke="#457B9D"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="rgba(168,218,220,0.2)"
    />
    <path d="M16 4 L16 26" stroke="#A8DADC" strokeWidth="1" strokeDasharray="2 2" />
    <path d="M10 12 Q14 15 10 19" stroke="#457B9D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M22 12 Q18 15 22 19" stroke="#457B9D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <circle cx="16" cy="16" r="2.5" fill="#457B9D" opacity="0.6" />
  </svg>
);

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const navLinks = [
    { name: 'Dashboard',    path: '/dashboard',    icon: <Home size={18} /> },
    { name: 'AI Chat',      path: '/chat',          icon: <MessageCircle size={18} /> },
    { name: 'Screening',    path: '/screening',     icon: <ClipboardList size={18} /> },
    { name: 'Appointments', path: '/appointments',  icon: <Calendar size={18} /> },
    { name: 'Journal',      path: '/journal',       icon: <Book size={18} /> },
    { name: 'Community',    path: '/forum',         icon: <Users size={18} /> },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1300px', margin: '0 auto' }}>

        {/* Brand */}
        <Link to="/dashboard" className="navbar-brand">
          <BrainLogo size={30} />
          <span>MindCare</span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'navbar-link--active' : ''}`}
              style={{
                color: location.pathname === link.path ? 'var(--primary)' : undefined,
                background: location.pathname === link.path ? 'var(--primary-light)' : undefined,
              }}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </div>

        {/* Right: Theme + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              border: '1.5px solid var(--border-light)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-red)';
              e.currentTarget.style.color = 'var(--accent-red)';
              e.currentTarget.style.background = 'var(--accent-red-light)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
