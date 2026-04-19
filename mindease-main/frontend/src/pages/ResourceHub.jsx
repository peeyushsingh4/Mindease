import React, { useMemo, useState } from 'react';
import { Search, Filter, PlayCircle } from 'lucide-react';

const ResourceImage = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        aria-label={alt}
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(16,185,129,0.18))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontWeight: 700,
          letterSpacing: '0.04em',
          fontSize: '0.85rem'
        }}
      >
        Resource
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};

const publicAsset = (path) => {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalized}/${path.replace(/^\//, '')}`;
};

const ResourceHub = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const filters = ['All', 'Crisis Support', 'Anxiety', 'Sleep', 'Mindfulness', 'Self-Help'];

  const resources = useMemo(() => ([
    {
      title: 'Tele-MANAS India (24x7 Mental Health Helpline)',
      tag: 'CRISIS SUPPORT',
      rating: 'Trusted',
      length: '24/7',
      desc: 'National mental health helpline. Call 14416 or 1-800-891-4416 for immediate support.',
      type: 'helpline',
      link: 'https://telemanas.mohfw.gov.in/home',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?fit=crop&w=400&h=250&q=80'
    },
    {
      title: 'iCALL Psychosocial Helpline',
      tag: 'CRISIS SUPPORT',
      rating: 'Trusted',
      length: 'Helpline',
      desc: 'Professional, confidential emotional support in India via phone/email/chat.',
      type: 'helpline',
      link: 'https://icallhelpline.org/',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?fit=crop&w=400&h=250&q=80'
    },
    {
      title: 'NIMHANS Centre for Well Being',
      tag: 'SELF-HELP',
      rating: 'Clinical',
      length: 'Articles',
      desc: 'Evidence-informed mental wellness material from a leading Indian institute.',
      type: 'article',
      link: 'https://nimhans.ac.in/centre-for-well-being/',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?fit=crop&w=400&h=250&q=80'
    },
    {
      title: 'NHS: Self-help for Anxiety',
      tag: 'ANXIETY',
      rating: 'Clinical',
      length: 'Guide',
      desc: 'Practical self-help strategies from the UK National Health Service.',
      type: 'article',
      link: 'https://www.nhs.uk/mental-health/conditions/generalised-anxiety-disorder/self-help/',
      image: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?fit=crop&w=400&h=250&q=80'
    },
    {
      title: 'CDC: About Sleep',
      tag: 'SLEEP',
      rating: 'Evidence',
      length: '5 min read',
      desc: 'Simple sleep habits that improve focus, energy, and mental health.',
      type: 'article',
      link: 'https://www.cdc.gov/sleep/about/index.html',
      image: publicAsset('cdc-sleep.svg')
    },
    {
      title: 'Mindful Self-Compassion Practices',
      tag: 'MINDFULNESS',
      rating: 'Trusted',
      length: 'Exercises',
      desc: 'Free guided practices for reducing stress and self-criticism.',
      type: 'audio',
      link: 'https://self-compassion.org/category/exercises/',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?fit=crop&w=400&h=250&q=80'
    }
  ]), []);

  const filteredResources = resources.filter((item) => {
    const matchesFilter = activeFilter === 'All' || item.tag.toLowerCase() === activeFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}>Wellness Resource Hub</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1rem 0' }}>Evidence-based mental health resources and helplines with real working links.</p>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {filters.map(filter => (
              <button 
                key={filter} 
                onClick={() => setActiveFilter(filter)}
                className="btn" 
                style={{ 
                  backgroundColor: activeFilter === filter ? 'var(--primary)' : 'white', 
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
            <input
              type="text"
              placeholder="Search resources..."
              className="input-field"
              style={{ paddingLeft: '2.5rem', borderRadius: '999px', width: '250px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Featured Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4a8f7e 100%)', borderRadius: '24px', padding: '3.5rem 3rem', color: 'white', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '999px', display: 'inline-block', marginBottom: '1.5rem' }}>FEATURED SERIES</span>
          <h2 style={{ fontSize: '2.5rem', lineHeight: 1.2, marginBottom: '1.5rem' }}>Need Immediate Mental Health Support?</h2>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, marginBottom: '2rem', lineHeight: 1.6 }}>If you or someone you know is in distress, use a verified helpline now. You do not have to go through this alone.</p>
          <a
            href="https://telemanas.mohfw.gov.in/home"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ backgroundColor: 'white', color: 'var(--primary)', padding: '0.75rem 1.5rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            Open Tele-MANAS <PlayCircle size={18} />
          </a>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {filteredResources.map((item, idx) => (
          <div key={idx} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '160px', position: 'relative' }}>
              <ResourceImage src={item.image} alt={item.title} />
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
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 'auto', display: 'inline-block', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600' }}
              >
                Open Resource ↗
              </a>
            </div>
          </div>
        ))}
      </div>
      {filteredResources.length === 0 && (
        <div className="card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          No resources match your search. Try a broader keyword.
        </div>
      )}

    </div>
  );
};

export default ResourceHub;
