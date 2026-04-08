import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import api from '../api/client';
import { colors, commonStyles } from '../styles/common';

const severityColor = (severity) => {
  if (severity === 'Severe' || severity === 'Moderately Severe') return colors.danger;
  if (severity === 'Moderate' || severity === 'Mild') return colors.warning;
  return colors.success;
};

const ScreeningHubScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get('/screening');
      setHistory(res?.data?.data || []);
    } catch (err) {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView contentContainerStyle={commonStyles.contentContainer}>
        <View style={[commonStyles.card, { gap: 10 }]}>
          <Text style={commonStyles.title}>Assessments</Text>
          <Text style={commonStyles.subtitle}>
            Take a quick PHQ-9 or GAD-7 screening to monitor your wellbeing.
          </Text>

          <TouchableOpacity
            style={commonStyles.button}
            onPress={() => navigation.navigate('ScreeningQuestionnaire', { type: 'PHQ-9' })}
          >
            <Text style={commonStyles.buttonText}>Start PHQ-9</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.button, commonStyles.buttonSecondary]}
            onPress={() => navigation.navigate('ScreeningQuestionnaire', { type: 'GAD-7' })}
          >
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Start GAD-7</Text>
          </TouchableOpacity>
        </View>

        <View style={[commonStyles.card, { gap: 8 }]}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Recent results</Text>
          {history.length === 0 ? (
            <Text style={commonStyles.subtitle}>No previous assessments yet.</Text>
          ) : (
            history.slice(0, 8).map((item) => (
              <View key={item._id} style={{ borderTopWidth: 1, borderTopColor: '#EEF3F6', paddingTop: 8 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{item.type} · Score {item.score}</Text>
                <Text style={{ color: severityColor(item.severity), fontWeight: '700' }}>{item.severity}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScreeningHubScreen;
