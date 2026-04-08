import React, { useState } from 'react';
import { Search, Filter, PlayCircle } from 'lucide-react';

const ResourceHub = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Anxiety', 'Sleep', 'Mindfulness', 'Relationships', 'Study Tips'];

  const resources = [
    { title: "5-Minute Guided Meditation for Exams", tag: "MINDFULNESS", rating: "4.8", length: "5:20", desc: "A quick session designed specifically for students to reset during intense...", type: "audio", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fit=crop&w=400&h=250&q=80" },
    { title: "The Science of Sleep and Academic Success", tag: "SLEEP", rating: "4.9", length: "8 min read", desc: "Learn how sleep cycles affect memory retention and how to optimize...", type: "article", image: "https://images.unsplash.com/photo-1511295742362-92c96b124e52?fit=crop&w=400&h=250&q=80" },
    { title: "Overcoming Anxiety and Stress", tag: "ANXIETY", rating: "4.7", length: "12:45", desc: "Expert tips on managing college-related anxiety and building long-term...", type: "video", image: "https://images.unsplash.com/photo-1508247201083-a4c849195bdf?fit=crop&w=400&h=250&q=80" },
    { title: "Daily Yoga Routine for Students", tag: "MINDFULNESS", rating: "4.6", length: "15:00", desc: "Relieve tension from sitting at a desk all day with these simple yoga poses.", type: "video", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?fit=crop&w=400&h=250&q=80" }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}>Wellness Resource Hub</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1rem 0' }}>Expert-curated content to help you thrive mentally and physically.</p>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {filters.map(filter => (
              <button 
                key={filter} 
                onClick={() => setActiveFilter(filter)}
                className="btn" 
                style={{ 
                  backgroundColor: activeFilter === filter ? '#0ea5e9' : 'white', 
                  color: activeFilter === filter ? 'white' : 'var(--text-secondary)',
                  border: activeFilter === filter ? 'none' : '1px solid var(--border-light)',
                  padding: '0.4rem 1.25rem',
                  fontSize: '0.85rem'
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" style={{ padding: '0.6rem', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}><Filter size={18}/></button>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search resources..." className="input-field" style={{ paddingLeft: '2.5rem', borderRadius: '999px', width: '250px' }} />
          </div>
        </div>
      </div>

      {/* Featured Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #10b981)', borderRadius: '24px', padding: '3.5rem 3rem', color: 'white', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '999px', display: 'inline-block', marginBottom: '1.5rem' }}>FEATURED SERIES</span>
          <h2 style={{ fontSize: '2.5rem', lineHeight: 1.2, marginBottom: '1.5rem' }}>Mindful Semester: The Complete Guide</h2>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, marginBottom: '2rem', lineHeight: 1.6 }}>A 12-part masterclass on maintaining mental clarity and emotional balance throughout your academic year.</p>
          <button className="btn" style={{ backgroundColor: 'white', color: '#0ea5e9', padding: '0.75rem 1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Start Learning Now <PlayCircle size={18} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {resources.map((item, idx) => (
          <div key={idx} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '160px', position: 'relative' }}>
              <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {item.length}
              </div>
            </div>
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>{item.tag}</span>
                <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold' }}>⭐ {item.rating}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: 1.3, color: 'var(--text-primary)' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>{item.desc}</p>
              <a href="#" style={{ marginTop: 'auto', display: 'inline-block', fontSize: '0.9rem', color: '#0ea5e9', fontWeight: '600' }}>Open Resource ↗</a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ResourceHub;
