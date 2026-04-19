import React, { useState, useEffect, useRef } from 'react';
import api, { getApiErrorMessage } from '../api';

const Journal = () => {
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState([]);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathText, setBreathText] = useState('Inhale');
  const breathingIntervalRef = useRef(null);

  const fetchEntries = async () => {
    try {
      const res = await api.get('/journal');
      setEntries(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
    };
  }, []);

  const handleBreathe = () => {
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
    }
    setIsBreathing(true);
    let cycle = 0;
    breathingIntervalRef.current = setInterval(() => {
      cycle++;
      if (cycle % 2 === 0) setBreathText('Inhale');
      else setBreathText('Exhale');

      if (cycle >= 6) { // 3 full cycles
        clearInterval(breathingIntervalRef.current);
        breathingIntervalRef.current = null;
        setIsBreathing(false);
        setBreathText('Inhale');
      }
    }, 4000); // 4 seconds in, 4 seconds out
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post('/journal', { content });
      setContent('');
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, 'Error saving journal'));
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }} className="animate-fade-in">
      <h2>Mindful Reflection</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>A private space just for you.</p>

      {/* Breathing Exercise UI */}
      <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(to right, var(--surface), rgba(106, 13, 173, 0.05))' }}>
        <h3>Take a Moment</h3>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Try the 4-4 breathing technique before you write.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            transition: 'transform 4s ease-in-out',
            transform: isBreathing ? (breathText === 'Inhale' ? 'scale(1.5)' : 'scale(1)') : 'scale(1)',
            opacity: isBreathing ? 0.8 : 1
          }}>
            {isBreathing ? breathText : 'Ready?'}
          </div>
        </div>
        
        {!isBreathing && <button onClick={handleBreathe} className="btn btn-outline">Start Breathing Exercise</button>}
      </div>

      {/* Journal Entry Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Today's Entry</h3>
        <form onSubmit={handleSave} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea 
            className="input-field" 
            rows="6" 
            placeholder="What's on your mind? This is fully encrypted and private." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ resize: 'vertical' }}
          ></textarea>
          <div style={{ alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Lock & Save Entry</button>
          </div>
        </form>
      </div>

      {/* History */}
      <h3>Past Entries</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {entries.length > 0 ? entries.map(entry => (
          <div key={entry._id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <small style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{new Date(entry.createdAt).toLocaleDateString()}</small>
            <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
          </div>
        )) : (
          <p style={{ color: 'var(--text-secondary)' }}>You haven't written any entries yet.</p>
        )}
      </div>

    </div>
  );
};

export default Journal;
