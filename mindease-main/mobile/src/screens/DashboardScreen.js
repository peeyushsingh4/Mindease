import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../styles/common';

const metricCard = (label, value) => (
  <View style={[commonStyles.card, { flex: 1, minWidth: 130 }]}>
    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
    <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 4 }}>{value}</Text>
  </View>
);

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    moods: 0,
    journals: 0,
    screenings: 0,
    appointments: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setError('');
    setRefreshing(true);
    try {
      const [moodRes, journalRes, screeningRes, appointmentRes] = await Promise.all([
        api.get('/mood'),
        api.get('/journal'),
        api.get('/screening'),
        api.get('/appointments'),
      ]);

      setSummary({
        moods: moodRes?.data?.count || moodRes?.data?.data?.length || 0,
        journals: journalRes?.data?.count || journalRes?.data?.data?.length || 0,
        screenings: screeningRes?.data?.count || screeningRes?.data?.data?.length || 0,
        appointments: appointmentRes?.data?.count || appointmentRes?.data?.data?.length || 0,
      });
    } catch (err) {
      setError('Could not refresh dashboard right now.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView
        contentContainerStyle={commonStyles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSummary} />}
      >
        <View style={[commonStyles.card, { gap: 8 }]}>
          <Text style={commonStyles.title}>
            Hello {user?.isAnonymous ? user?.anonymousId || 'Anonymous User' : user?.name || 'there'}
          </Text>
          <Text style={commonStyles.subtitle}>
            Quick status of your support tools and activity.
          </Text>
        </View>

        {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {metricCard('Mood logs', summary.moods)}
          {metricCard('Journal entries', summary.journals)}
          {metricCard('Assessments', summary.screenings)}
          {metricCard('Appointments', summary.appointments)}
        </View>

        <View style={[commonStyles.card, { gap: 10 }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16 }}>Quick actions</Text>

          <TouchableOpacity style={commonStyles.button} onPress={() => navigation.navigate('Chat')}>
            <Text style={commonStyles.buttonText}>Open AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[commonStyles.button, commonStyles.buttonSecondary]} onPress={() => navigation.navigate('Mood')}>
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Track Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[commonStyles.button, commonStyles.buttonSecondary]} onPress={() => navigation.navigate('Journal')}>
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Write Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[commonStyles.button, commonStyles.buttonSecondary]} onPress={() => navigation.navigate('ScreeningHub')}>
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Take Screening</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[commonStyles.button, commonStyles.buttonSecondary]} onPress={() => navigation.navigate('Appointments')}>
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Manage Appointments</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
