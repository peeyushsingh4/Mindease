import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { extractErrorMessage } from '../api/client';
import { colors, commonStyles } from '../styles/common';

const LEVELS = [
  { value: 1, label: 'Terrible', emoji: '😢' },
  { value: 2, label: 'Bad', emoji: '😞' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Awesome', emoji: '😁' },
];

const MoodScreen = () => {
  const [level, setLevel] = useState(3);
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get('/mood');
      setHistory(res?.data?.data || []);
    } catch (err) {
      setError('Could not load mood history.');
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await api.post('/mood', { level, note });
      setNote('');
      setSuccessMessage('Mood logged successfully.');
      loadHistory();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save mood entry.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView contentContainerStyle={commonStyles.contentContainer}>
        <View style={[commonStyles.card, { gap: 10 }]}>
          <Text style={commonStyles.title}>Daily mood check-in</Text>
          <Text style={commonStyles.subtitle}>How are you feeling right now?</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LEVELS.map((item) => {
              const selected = level === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setLevel(item.value)}
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : '#DDE8EE',
                    backgroundColor: selected ? '#EBF4F8' : '#FFFFFF',
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: selected ? '700' : '500' }}>
                    {item.emoji} {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View>
            <Text style={commonStyles.label}>Notes (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              style={[commonStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              multiline
              placeholder="Anything you’d like to remember about today?"
            />
          </View>

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}
          {successMessage ? <Text style={{ color: colors.success }}>{successMessage}</Text> : null}

          <TouchableOpacity style={commonStyles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={commonStyles.buttonText}>{loading ? 'Saving…' : 'Save Mood'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[commonStyles.card, { gap: 8 }]}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>History</Text>
          {history.length === 0 ? (
            <Text style={commonStyles.subtitle}>No mood entries yet.</Text>
          ) : (
            history.map((entry) => {
              const found = LEVELS.find((item) => item.value === entry.level);
              return (
                <View key={entry._id} style={{ borderTopWidth: 1, borderTopColor: '#EEF3F6', paddingTop: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                    {found?.emoji || '🙂'} {found?.label || entry.level}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </Text>
                  <Text style={{ color: colors.textPrimary, marginTop: 4 }}>{entry.note || 'No note'}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MoodScreen;
