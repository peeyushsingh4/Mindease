import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Appointments = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  // BUG FIX: counsellorId was hardcoded as '65f2a1b2c3d4e5f6g7h8i9j0' — a fake
  // ObjectId that will never exist in the database. Every booking attempt returned
  // "Counsellor not found". Fixed by fetching real counsellor accounts from the DB.
  const [counsellors, setCounsellors] = useState([]);
  const [counsellorId, setCounsellorId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCounsellors = async () => {
    try {
      // The /api/auth/counsellors endpoint lists users with role=counsellor.
      // NOTE: You need to add this route to the backend (see comment below).
      const res = await api.get('/auth/counsellors');
      setCounsellors(res.data.data);
      if (res.data.data.length > 0) {
        setCounsellorId(res.data.data[0]._id);
      }
    } catch (err) {
      // If the endpoint isn't set up yet, fail silently — the select will show empty
      console.error('Could not fetch counsellors:', err.message);
    }
  };

  useEffect(() => {
    fetchAppointments();
    if (user.role === 'student') {
      fetchCounsellors();
    }
  }, [user.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!counsellorId) return setSubmitError('No counsellors are available at the moment.');
    if (!date) return setSubmitError('Please select a date.');
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await api.post('/appointments', { counsellorId, date, timeSlot, notes });
      setShowForm(false);
      setNotes('');
      fetchAppointments();
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Error booking appointment.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Today's date in YYYY-MM-DD format for the min date attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Your Appointments</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your confidential counselling sessions.</p>
        </div>
        {user.role === 'student' && (
          <button onClick={() => { setShowForm(!showForm); setSubmitError(''); }} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Book Session'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Book a Counsellor</h3>
          {submitError && (
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>

            {/* Counsellor Select */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Select Counsellor</label>
              {counsellors.length > 0 ? (
                <select className="input-field" value={counsellorId} onChange={e => setCounsellorId(e.target.value)}>
                  {counsellors.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  No counsellors available yet. Please check back later or contact support.
                </p>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>Select Date</label>
              <input type="date" className="input-field" value={date} min={today} onChange={e => setDate(e.target.value)} required />
            </div>

            <div>
              <label>Select Time</label>
              <select className="input-field" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                <option>09:00 AM</option>
                <option>10:00 AM</option>
                <option>11:00 AM</option>
                <option>02:00 PM</option>
                <option>04:00 PM</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>What would you like to discuss? (Optional, completely confidential)</label>
              <textarea className="input-field" rows="3" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={submitLoading || counsellors.length === 0}>
                {submitLoading ? 'Booking…' : 'Confirm Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {appointments.length > 0 ? appointments.map(apt => (
          <div key={apt._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `6px solid ${apt.status === 'approved' ? 'var(--success)' : apt.status === 'pending' ? 'var(--warning)' : 'var(--danger)'}` }}>
            <div>
              <h3 style={{ margin: 0 }}>{new Date(apt.date).toLocaleDateString()} at {apt.timeSlot}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                {user.role === 'student'
                  ? `Session with ${apt.counsellor?.name || 'Campus Counsellor'}`
                  : `Session with ${apt.student?.name || 'Student'}`}
              </p>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', backgroundColor: 'rgba(0,0,0,0.05)', fontWeight: '600' }}>
                Status: <span style={{ textTransform: 'capitalize' }}>{apt.status}</span>
              </span>
            </div>
            {apt.status === 'approved' && apt.meetingLink && (
              <a href={apt.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary">Join Video Call</a>
            )}
          </div>
        )) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>You don't have any appointments scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
