import React, { useState, useEffect } from 'react';
import api from '../api';

const MoodTracker = () => {
  const [level, setLevel] = useState(3);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await api.get('/mood');
      setHistory(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mood', { level, note });
      setMessage('Mood logged successfully!');
      setNote('');
      setLevel(3);
      fetchHistory();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Failed to log mood.');
    }
  };

  const getMoodEmoji = (lvl) => {
    switch(lvl) {
      case 1: return '😢 Terrible';
      case 2: return '😞 Bad';
      case 3: return '😐 Okay';
      case 4: return '🙂 Good';
      case 5: return '😁 Awesome';
      default: return '😐 Okay';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }} className="animate-fade-in">
      <h2>Daily Mood Tracker</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Check in with yourself. How are you feeling today?</p>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        {message && <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>{message}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Select Mood Level</label>
            <input 
              type="range" 
              min="1" max="5" 
              value={level} 
              onChange={(e) => setLevel(Number(e.target.value))} 
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <div style={{ textAlign: 'center', fontSize: '1.5rem', marginTop: '1rem', color: 'var(--primary)' }}>
              {getMoodEmoji(level)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Additional Notes (Optional)</label>
            <textarea 
              className="input-field" 
              rows="4" 
              placeholder="What's going on today?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary">Log Mood</button>
        </form>
      </div>

      <h3>Your History</h3>
      {history.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map(m => (
            <div key={m._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>{getMoodEmoji(m.level).split(' ')[0]}</div>
              <div>
                <strong style={{ display: 'block' }}>{new Date(m.createdAt).toLocaleDateString()}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{m.note || 'No notes.'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>No previous logs found.</p>
      )}

    </div>
  );
};

export default MoodTracker;
