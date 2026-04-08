import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Activity, Users, FileText, Calendar, AlertTriangle, MessageCircle } from 'lucide-react';

const Admin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  // BUG FIX: The original code did setAlerts(alertRes.data.data) and then called
  // alerts.length / alerts.map(), expecting a flat array. But we fixed adminController
  // to return { screeningAlerts: {...}, crisisAlerts: {...} } so both types are visible.
  // Updated state to match the new response shape.
  const [screeningAlerts, setScreeningAlerts] = useState([]);
  const [crisisAlerts, setCrisisAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('screening');

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'counsellor') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        if (user.role === 'admin') {
          const metricRes = await api.get('/admin/metrics');
          setMetrics(metricRes.data.data);
        }
        const alertRes = await api.get('/admin/alerts');
        setScreeningAlerts(alertRes.data.data.screeningAlerts?.items || []);
        setCrisisAlerts(alertRes.data.data.crisisAlerts?.items || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [user, navigate]);

  const tabStyle = (tab) => ({
    padding: '0.6rem 1.25rem',
    borderRadius: '999px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    backgroundColor: activeTab === tab ? 'var(--danger)' : 'transparent',
    color: activeTab === tab ? 'white' : 'var(--text-secondary)',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }} className="animate-fade-in">
      <h2>{user?.role === 'admin' ? 'System Administration' : 'Counsellor Control Panel'}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Overview of platform health and severe activity.</p>

      {/* Metrics Row (Admin Only) */}
      {user?.role === 'admin' && metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
            <Users size={32} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalUsers}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Total Users</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
            <Activity size={32} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalScreenings}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Screenings</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
            <Calendar size={32} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalAppointments}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Appointments</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
            <FileText size={32} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalPosts}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Forum Posts</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger)' }}>
            <MessageCircle size={32} color="var(--danger)" />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totalCrisisAlerts}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Crisis Alerts</div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <AlertTriangle size={24} color="var(--danger)" />
        <h3 style={{ margin: 0, marginRight: '1rem' }}>Critical Alerts</h3>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-main)', borderRadius: '999px', padding: '0.25rem' }}>
          <button style={tabStyle('screening')} onClick={() => setActiveTab('screening')}>
            Screenings ({screeningAlerts.length})
          </button>
          <button style={tabStyle('crisis')} onClick={() => setActiveTab('crisis')}>
            Crisis Chat ({crisisAlerts.length})
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {activeTab === 'screening'
          ? "Assessments scoring 'Moderately Severe' or 'Severe'."
          : 'Crisis keywords detected in chat sessions.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activeTab === 'screening' && (
          screeningAlerts.length > 0 ? screeningAlerts.map(alert => (
            <div key={alert._id} className="card" style={{ borderLeft: '6px solid var(--danger)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--danger)' }}>{alert.type} Risk Detected</h4>
                  <p style={{ marginTop: '0.5rem' }}>
                    <strong>User:</strong> {alert.user ? (alert.user.isAnonymous ? alert.user.anonymousId : alert.user.name) : 'Deleted User'}<br/>
                    <strong>Score:</strong> {alert.score}<br/>
                    <strong>Severity:</strong> {alert.severity}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ color: 'var(--text-secondary)' }}>{new Date(alert.createdAt).toLocaleString()}</small>
                  <div style={{ marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => window.alert('Priority booking link sent.')} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      Send Priority Booking Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', borderLeft: '6px solid var(--success)' }}>
              <p style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem' }}>All Clear</p>
              <p style={{ color: 'var(--text-secondary)' }}>No severe screenings reported recently.</p>
            </div>
          )
        )}

        {activeTab === 'crisis' && (
          crisisAlerts.length > 0 ? crisisAlerts.map(alert => (
            <div key={alert._id} className="card" style={{ borderLeft: '6px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#dc2626' }}>Crisis Message Detected</h4>
                  <p style={{ marginTop: '0.5rem' }}>
                    <strong>User:</strong> {alert.user ? (alert.user.isAnonymous ? alert.user.anonymousId : alert.user.name) : 'Deleted User'}<br/>
                    <strong>Message:</strong> {alert.message}
                  </p>
                </div>
                <small style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(alert.createdAt).toLocaleString()}</small>
              </div>
            </div>
          )) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', borderLeft: '6px solid var(--success)' }}>
              <p style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem' }}>All Clear</p>
              <p style={{ color: 'var(--text-secondary)' }}>No crisis chat events recorded.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Admin;
