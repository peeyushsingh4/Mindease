import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../styles/common';

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];
const DATE_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const statusColor = (status) => {
  if (status === 'approved') return colors.success;
  if (status === 'pending') return colors.warning;
  return colors.danger;
};
const parseSafeDate = (value) => {
  if (!DATE_INPUT_REGEX.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // Ensure date normalization did not mutate the calendar day.
  const [year, month, day] = value.split('-').map(Number);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const AppointmentsScreen = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [counsellorId, setCounsellorId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isStudent = useMemo(() => user?.role === 'student', [user?.role]);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const appointmentRes = await api.get('/appointments');
      setAppointments(appointmentRes?.data?.data || []);

      if (isStudent) {
        const counsellorRes = await api.get('/auth/counsellors');
        const list = counsellorRes?.data?.data || [];
        setCounsellors(list);
        setCounsellorId((prev) => prev || list[0]?._id || '');
      }
    } catch (err) {
      setError('Could not load appointments.');
    }
  }, [isStudent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!counsellorId) {
      setError('No counsellor is currently available.');
      return;
    }
    const normalizedDate = date.trim();
    if (!normalizedDate) {
      setError('Please provide a date in YYYY-MM-DD format.');
      return;
    }
    const parsedDate = parseSafeDate(normalizedDate);
    if (!parsedDate) {
      setError('Date must be a valid calendar date in YYYY-MM-DD format.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      setError('Please choose today or a future date.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/appointments', {
        counsellorId,
        date: normalizedDate,
        timeSlot,
        notes: notes.trim(),
      });
      setNotes('');
      setDate('');
      setFormVisible(false);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not book appointment.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView contentContainerStyle={commonStyles.contentContainer}>
        <View style={[commonStyles.card, { gap: 10 }]}>
          <Text style={commonStyles.title}>Appointments</Text>
          <Text style={commonStyles.subtitle}>Manage your counselling sessions and requests.</Text>

          {isStudent ? (
            <TouchableOpacity
              style={[commonStyles.button, formVisible ? commonStyles.buttonSecondary : null]}
              onPress={() => setFormVisible((prev) => !prev)}
            >
              <Text style={[commonStyles.buttonText, formVisible ? commonStyles.buttonSecondaryText : null]}>
                {formVisible ? 'Cancel Booking' : 'Book Session'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {formVisible && (
          <View style={[commonStyles.card, { gap: 10 }]}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Book a session</Text>

            <View>
              <Text style={commonStyles.label}>Counsellor</Text>
              {counsellors.length === 0 ? (
                <Text style={commonStyles.subtitle}>No counsellors available.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {counsellors.map((counsellor) => {
                    const selected = counsellorId === counsellor._id;
                    return (
                      <TouchableOpacity
                        key={counsellor._id}
                        onPress={() => setCounsellorId(counsellor._id)}
                        style={{
                          borderWidth: 1,
                          borderColor: selected ? colors.primary : '#DDE8EE',
                          borderRadius: 8,
                          padding: 10,
                          backgroundColor: selected ? '#EBF4F8' : '#FFFFFF',
                        }}
                      >
                        <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{counsellor.name}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{counsellor.email}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View>
              <Text style={commonStyles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="2026-04-14"
                style={commonStyles.input}
              />
            </View>

            <View>
              <Text style={commonStyles.label}>Time slot</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TIME_SLOTS.map((slot) => {
                  const selected = slot === timeSlot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setTimeSlot(slot)}
                      style={{
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : '#DDE8EE',
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        backgroundColor: selected ? '#EBF4F8' : '#FFFFFF',
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontWeight: selected ? '700' : '500' }}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={commonStyles.label}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[commonStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                multiline
                placeholder="What would you like to discuss?"
              />
            </View>

            <TouchableOpacity style={commonStyles.button} onPress={handleSubmit} disabled={loading}>
              <Text style={commonStyles.buttonText}>{loading ? 'Booking…' : 'Confirm Booking'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

        <View style={[commonStyles.card, { gap: 8 }]}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Your sessions</Text>
          {appointments.length === 0 ? (
            <Text style={commonStyles.subtitle}>No appointments yet.</Text>
          ) : (
            appointments.map((item) => (
              <View key={item._id} style={{ borderTopWidth: 1, borderTopColor: '#EEF3F6', paddingTop: 8 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                  {new Date(item.date).toLocaleDateString()} · {item.timeSlot}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {isStudent
                    ? `Counsellor: ${item.counsellor?.name || 'Campus Counsellor'}`
                    : `Student: ${item.student?.name || 'Student'}`}
                </Text>
                <Text style={{ color: statusColor(item.status), fontWeight: '700', textTransform: 'capitalize', marginTop: 2 }}>
                  {item.status}
                </Text>
                {item.notes ? <Text style={{ color: colors.textPrimary, marginTop: 4 }}>{item.notes}</Text> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AppointmentsScreen;
