import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or being fidgety or restless",
  "Thoughts that you would be better off dead, or of hurting yourself"
];

const options = [
  { label: "Not at all",            value: 0 },
  { label: "Several days",          value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day",      value: 3 },
];

const getSeverity = (score) => {
  if (score <= 4)  return { label: 'Minimal',            color: 'var(--success)' };
  if (score <= 9)  return { label: 'Mild',               color: '#f59e0b' };
  if (score <= 14) return { label: 'Moderate',           color: '#f97316' };
  if (score <= 19) return { label: 'Moderately Severe',  color: '#ef4444' };
  return              { label: 'Severe',             color: '#dc2626' };
};

const PHQ9 = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(Array(9).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [saveError, setSaveError] = useState('');

  const handleAnswer = (qIndex, value) => {
    const updated = [...answers];
    updated[qIndex] = value;
    setAnswers(updated);
  };

  const allAnswered = answers.every(a => a !== null);

  const handleSubmit = async () => {
    const score = answers.reduce((sum, val) => sum + val, 0);
    const severity = getSeverity(score);

    // Compute result immediately for instant display
    setResult({ score, severity });
    setSubmitted(true);

    // Save the raw answers array to the backend (controller calculates score/severity itself)
    try {
      await api.post('/screening', { type: 'PHQ-9', answers });
    } catch (err) {
      setSaveError('Your result could not be saved — please check your connection.');
      console.error('Could not save screening result:', err);
    }
  };

  if (submitted && result) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }} className="animate-fade-in">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2>PHQ-9 Result</h2>
          <div style={{ fontSize: '4rem', fontWeight: '800', color: result.severity.color, margin: '1rem 0' }}>
            {result.score}
          </div>
          <p style={{ fontSize: '1.1rem', color: result.severity.color, fontWeight: '600', marginBottom: '1rem' }}>
            {result.severity.label} Depression
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your score has been saved privately. If you are struggling, please consider booking a session with a counsellor.
          </p>
          {saveError && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{saveError}</p>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/appointments')}>Book a Session</button>
            <button className="btn btn-outline" onClick={() => navigate('/screening')}>Back to Screenings</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }} className="animate-fade-in">
      <button onClick={() => navigate('/screening')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '1rem', fontWeight: '500' }}>
        ← Back
      </button>
      <h2>PHQ-9 Depression Screening</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Over the last 2 weeks, how often have you been bothered by the following problems?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {questions.map((q, i) => (
          <div key={i} className="card" style={{ borderLeft: answers[i] !== null ? '4px solid var(--primary)' : '4px solid var(--border-light)' }}>
            <p style={{ fontWeight: '500', marginBottom: '1rem' }}>{i + 1}. {q}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(i, opt.value)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: answers[i] === opt.value ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    backgroundColor: answers[i] === opt.value ? 'var(--primary-light)' : 'transparent',
                    color: answers[i] === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: answers[i] === opt.value ? '600' : '400',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{ opacity: allAnswered ? 1 : 0.5, padding: '1rem 2rem' }}
        >
          Submit Assessment →
        </button>
      </div>
    </div>
  );
};

export default PHQ9;
