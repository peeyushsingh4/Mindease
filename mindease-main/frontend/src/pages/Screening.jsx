import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Info, CheckCircle2 } from 'lucide-react';

const Screening = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem', maxWidth: '1000px' }}>
      
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Mental Health Screening</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Take a confidential assessment to better understand your emotional state. Results are private and used to provide personalized recommendations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* PHQ-9 Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <ClipboardList color="var(--primary)" size={24} />
          </div>
          
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--secondary)' }}>PHQ-9 Assessment</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2rem', flex: 1 }}>
            The Patient Health Questionnaire (PHQ-9) is used to screen, diagnose, monitor, and measure the severity of depression.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--primary)" /> 9 Questions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--primary)" /> Approx. 3 mins</div>
          </div>

          <button onClick={() => navigate('/screening/phq9')} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
            Start Assessment →
          </button>
        </div>

        {/* GAD-7 Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <ClipboardList color="var(--primary)" size={24} />
          </div>
          
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--secondary)' }}>GAD-7 Assessment</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '2rem', flex: 1 }}>
            The Generalized Anxiety Disorder (GAD-7) scale is a self-reported questionnaire for screening and severity of anxiety.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--primary)" /> 7 Questions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--primary)" /> Approx. 2 mins</div>
          </div>

          <button onClick={() => navigate('/screening/gad7')} className="btn btn-outline" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
            Start Assessment →
          </button>
        </div>

      </div>

      {/* Info Alert */}
      <div style={{ backgroundColor: 'var(--primary-light)', borderRadius: '24px', padding: '2rem 2.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div style={{ width: '48px', height: '48px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info color="var(--primary)" size={24} />
        </div>
        <div>
          <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>How your data is used</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
            Your results are stored securely and anonymously. They help us recommend the most relevant resources and tools for your current state. Only you can see your full history unless you choose to share it with a counselor.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Screening;
