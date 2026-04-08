import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api, { extractErrorMessage } from '../api/client';
import { colors, commonStyles } from '../styles/common';

const JournalScreen = () => {
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEntries = useCallback(async () => {
    try {
      const res = await api.get('/journal');
      setEntries(res?.data?.data || []);
    } catch (err) {
      setError('Could not load journal history.');
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please write something before saving.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/journal', { content: content.trim() });
      setContent('');
      loadEntries();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save entry.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView contentContainerStyle={commonStyles.contentContainer}>
        <View style={[commonStyles.card, { gap: 10 }]}>
          <Text style={commonStyles.title}>Private journal</Text>
          <Text style={commonStyles.subtitle}>Write freely — your entries are saved to your account.</Text>

          <TextInput
            multiline
            value={content}
            onChangeText={setContent}
            style={[commonStyles.input, { minHeight: 140, textAlignVertical: 'top' }]}
            placeholder="What’s on your mind today?"
          />

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={commonStyles.button} onPress={handleSave} disabled={loading}>
            <Text style={commonStyles.buttonText}>{loading ? 'Saving…' : 'Save Entry'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[commonStyles.card, { gap: 8 }]}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Past entries</Text>
          {entries.length === 0 ? (
            <Text style={commonStyles.subtitle}>No entries yet.</Text>
          ) : (
            entries.map((entry) => (
              <View key={entry._id} style={{ borderTopWidth: 1, borderTopColor: '#EEF3F6', paddingTop: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {new Date(entry.createdAt).toLocaleString()}
                </Text>
                <Text style={{ color: colors.textPrimary, marginTop: 4, lineHeight: 20 }}>{entry.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JournalScreen;
