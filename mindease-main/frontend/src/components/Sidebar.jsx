import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Home, MessageCircle, Users, BookOpen, ClipboardList,
  Calendar, Heart, Activity, Moon, Sun, LogOut, Settings
} from 'lucide-react';

const BrainLogo = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4C13.5 4 11.5 5.5 10.5 7.5C9.8 7.2 9 7 8.2 7C5.8 7 4 8.8 4 11.2C4 11.8 4.1 12.4 4.4 12.9C3 13.7 2 15.2 2 17C2 19.5 3.8 21.5 6.2 21.9C6.5 24.2 8.5 26 11 26L21 26C23.5 26 25.5 24.2 25.8 21.9C28.2 21.5 30 19.5 30 17C30 15.2 29 13.7 27.6 12.9C27.9 12.4 28 11.8 28 11.2C28 8.8 26.2 7 23.8 7C23 7 22.2 7.2 21.5 7.5C20.5 5.5 18.5 4 16 4Z"
      stroke="#457B9D" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(168,218,220,0.2)" />
    <path d="M16 6 L16 26" stroke="#A8DADC" strokeWidth="1" strokeDasharray="2 2.5" />
    <path d="M10 11 Q13.5 15 10 19" stroke="#457B9D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M22 11 Q18.5 15 22 19" stroke="#457B9D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <circle cx="16" cy="16" r="2.5" fill="#457B9D" opacity="0.7" />
  </svg>
);

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.body.getAttribute('data-theme') === 'dark');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setIsDark(!isDark);
  };

  if (!user) return null;

  const isAdminOrCounsellor = user.role === 'admin' || user.role === 'counsellor';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <BrainLogo size={26} /> MindCare
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1rem' }}>
        <NavLink to="/dashboard"    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Home size={20}/>         Dashboard</NavLink>
        <NavLink to="/chat"         className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><MessageCircle size={20}/> AI Support Chat</NavLink>
        <NavLink to="/mood"         className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Activity size={20}/>      Mood Tracker</NavLink>
        <NavLink to="/forum"        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Users size={20}/>         Peer Forum</NavLink>
        <NavLink to="/resource-hub" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><BookOpen size={20}/>      Resource Hub</NavLink>
        <NavLink to="/screening"    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><ClipboardList size={20}/> Mental Screening</NavLink>
        <NavLink to="/appointments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Calendar size={20}/>      Counselling</NavLink>
        <NavLink to="/journal"      className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Heart size={20}/>         Journal</NavLink>
        {isAdminOrCounsellor && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Settings size={20}/> Admin Panel</NavLink>
        )}
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          className="btn-text"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start', padding: 0, border: 'none', cursor: 'pointer' }}
          onClick={toggleTheme}
        >
          {isDark ? <Sun size={20}/> : <Moon size={20}/>} {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={handleLogout}
          className="btn-text"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start', padding: 0, border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
        >
          <LogOut size={20}/> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
