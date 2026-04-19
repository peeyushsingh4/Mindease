import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MessageCircle, Users, BookOpen, Calendar, Info, Activity, Zap, Music } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const dummyMoodData = [
  { day: 'Mon', score: 3 },
  { day: 'Tue', score: 4 },
  { day: 'Wed', score: 3 },
  { day: 'Thu', score: 5 },
  { day: 'Fri', score: 4 },
  { day: 'Sat', score: 4 },
  { day: 'Sun', score: 5 }
];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const musicUrl = 'https://music-stream-gray.vercel.app/';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}>
            Welcome back, {user.isAnonymous ? (user.anonymousId || 'Anonymous User') : (user.name || 'User')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Today is {today}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/appointments')}>📅 Book Appointment</button>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>
            <MessageCircle size={18} style={{ marginRight: '0.5rem' }}/> Start AI Chat
          </button>
        </div>
      </div>

      {/* Alert Banner — Start Exercise navigates to Journal where the breathing widget lives */}
      <div style={{ backgroundColor: 'var(--alert-peach-bg)', border: '1px solid var(--alert-peach-border)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <Info color="var(--alert-peach-accent)" size={24} />
        <div style={{ flex: 1 }}>
          <h4 style={{ color: 'var(--alert-peach-title)', margin: 0, fontSize: '0.95rem' }}>Feeling overwhelmed?</h4>
          <p style={{ color: 'var(--alert-peach-body)', margin: 0, fontSize: '0.85rem' }}>Our AI detected high stress levels in your last session. Would you like to try a 2-minute breathing exercise?</p>
        </div>
        <button
          onClick={() => navigate('/journal')}
          className="btn"
          style={{ backgroundColor: 'transparent', color: 'var(--alert-peach-accent)', textDecoration: 'underline', border: 'none', fontWeight: 'bold', padding: 0, cursor: 'pointer' }}
        >
          Start Exercise
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, color: 'var(--secondary)' }}>How are you feeling?</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'var(--primary-light)', color: 'var(--secondary)', padding: '0.3rem 0.8rem', borderRadius: '999px', letterSpacing: '1px' }}>WEEKLY TREND</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center', color: '#ef4444' }}><div style={{ fontSize: '2rem' }}>☹️</div><small style={{ fontWeight: 'bold' }}>Low</small></div>
            <div style={{ textAlign: 'center', color: '#f59e0b' }}><div style={{ fontSize: '2rem' }}>😐</div><small style={{ fontWeight: 'bold' }}>Okay</small></div>
            <div style={{ textAlign: 'center', color: '#22c55e' }}><div style={{ fontSize: '2rem' }}>😊</div><small style={{ fontWeight: 'bold' }}>Great</small></div>
          </div>
          <div style={{ height: '200px', width: '100%', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyMoodData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis hide domain={[0, 6]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 0 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ backgroundColor: 'var(--primary)', color: 'white', position: 'relative', overflow: 'hidden', border: 'none' }}>
            <Zap size={100} style={{ position: 'absolute', right: '-20px', top: '10px', opacity: 0.1 }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Wellness Streak</h4>
            <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1.2, margin: '0.5rem 0' }}>12 Days</div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> Keep it up! You're in the top 10%
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
              <Users size={20} color="var(--primary)" /> Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <div><strong style={{ color: 'var(--primary)' }}>User #291</strong> replied to your post</div>
                <div style={{ color: 'var(--text-muted)' }}>2h ago</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <div><strong style={{ color: 'var(--primary)' }}>System</strong> Appointment confirmed</div>
                <div style={{ color: 'var(--text-muted)' }}>5h ago</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <div><strong style={{ color: 'var(--primary)' }}>Journal</strong> Daily reflection missed</div>
                <div style={{ color: 'var(--text-muted)' }}>Yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>Quick Support</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { icon: <MessageCircle size={24}/>, color: 'var(--primary)', title: 'AI Counselor',  desc: 'Confidential 24/7 mental health assistant.',    route: '/chat' },
          { icon: <Users size={24}/>,         color: '#3b82f6',        title: 'Peer Support',  desc: 'Join the community and share anonymously.',     route: '/forum' },
          { icon: <BookOpen size={24}/>,      color: '#f43f5e',        title: 'Resource Hub',  desc: 'Explore wellness guides and videos.',           route: '/resource-hub' },
          { icon: <Music size={24}/>,         color: '#10b981',        title: 'Low‑Tempo Music', desc: 'Instrumental focus tracks for calm study.',      external: true, url: musicUrl },
          { icon: <Calendar size={24}/>,      color: '#6366f1',        title: 'Professional',  desc: 'Book a session with a counselor.',              route: '/appointments' },
        ].map(card => (
          <div
            key={card.route || card.url}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (card.external) {
                window.open(card.url, '_blank', 'noreferrer');
                return;
              }
              navigate(card.route);
            }}
          >
            <div style={{ width: '48px', height: '48px', backgroundColor: card.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem' }}>
              {card.icon}
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>{card.title}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
