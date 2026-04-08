import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../styles/common';

const timestampLabel = (dateString) =>
  new Date(dateString || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatScreen = () => {
  const { user, updateGuardian } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [savingGuardian, setSavingGuardian] = useState(false);

  const hasGuardianContact = Boolean(user?.guardianPhone && user.guardianPhone.trim());

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const res = await api.get('/chat/history');
        if (!cancelled) {
          const history = (res?.data?.data || []).map((msg) => ({
            role: msg.role,
            text: msg.text,
            createdAt: msg.createdAt,
            isCrisis: Boolean(msg.isCrisis),
          }));
          setMessages(history);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load message history.');
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setGuardianName(user?.guardianName || '');
    setGuardianPhone(user?.guardianPhone || '');
    setGuardianRelation(user?.guardianRelation || '');
  }, [user?.guardianName, user?.guardianPhone, user?.guardianRelation]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending && hasGuardianContact,
    [input, sending, hasGuardianContact]
  );

  const handleSaveGuardian = async () => {
    if (!guardianName.trim() || !guardianPhone.trim()) {
      setError('Emergency contact name and phone are required before using chat.');
      return;
    }

    setError('');
    setSavingGuardian(true);
    try {
      await updateGuardian({
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianRelation: guardianRelation.trim(),
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save emergency contact.'));
    } finally {
      setSavingGuardian(false);
    }
  };

  const handleSend = async () => {
    if (!canSend) {
      if (!hasGuardianContact) {
        setError('Please add an emergency contact before sending chat messages.');
      }
      return;
    }

    const text = input.trim();
    setInput('');
    setError('');
    const optimisticMessage = { role: 'user', text, createdAt: new Date().toISOString(), isCrisis: false };
    setMessages((prev) => [...prev, optimisticMessage]);
    setSending(true);

    try {
      const res = await api.post('/chat/respond', { message: text, history: messages });
      const payload = res?.data?.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: payload?.response || 'I am here with you.',
          createdAt: new Date().toISOString(),
          isCrisis: Boolean(payload?.isCrisis),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: extractErrorMessage(err, 'I could not respond right now. Please try again.'),
          createdAt: new Date().toISOString(),
          isCrisis: false,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[commonStyles.contentContainer, { paddingBottom: 100 }]}>
          {loadingHistory ? (
            <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 24 }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[commonStyles.subtitle, { marginTop: 10 }]}>Loading conversation…</Text>
            </View>
          ) : null}

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          {!hasGuardianContact ? (
            <View style={[commonStyles.card, { gap: 10, borderColor: '#FCD34D', backgroundColor: '#FFFBEB' }]}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                Emergency contact required
              </Text>
              <Text style={commonStyles.subtitle}>
                Add a guardian contact to enable crisis escalation support in chat.
              </Text>

              <View>
                <Text style={commonStyles.label}>Contact name *</Text>
                <TextInput
                  style={commonStyles.input}
                  value={guardianName}
                  onChangeText={setGuardianName}
                  placeholder="Guardian name"
                />
              </View>

              <View>
                <Text style={commonStyles.label}>Contact phone *</Text>
                <TextInput
                  style={commonStyles.input}
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text style={commonStyles.label}>Relationship (optional)</Text>
                <TextInput
                  style={commonStyles.input}
                  value={guardianRelation}
                  onChangeText={setGuardianRelation}
                  placeholder="Parent, sibling, friend…"
                />
              </View>

              <TouchableOpacity style={commonStyles.button} onPress={handleSaveGuardian} disabled={savingGuardian}>
                <Text style={commonStyles.buttonText}>{savingGuardian ? 'Saving…' : 'Save Emergency Contact'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {messages.length === 0 && !loadingHistory ? (
            <View style={commonStyles.card}>
              <Text style={commonStyles.subtitle}>No messages yet. Start by sharing how you feel.</Text>
            </View>
          ) : null}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={`${msg.createdAt || 'msg'}-${index}`}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  backgroundColor: msg.isCrisis ? '#FEF2F2' : isUser ? colors.primary : '#FFFFFF',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: msg.isCrisis ? '#FCA5A5' : '#DDE8EE',
                }}
              >
                <Text style={{ color: isUser ? '#FFFFFF' : msg.isCrisis ? '#991B1B' : colors.textPrimary, lineHeight: 20 }}>
                  {msg.text}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: isUser ? '#E8F4FF' : '#6A879F',
                    textAlign: isUser ? 'right' : 'left',
                  }}
                >
                  {timestampLabel(msg.createdAt)}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: '#DDE8EE', backgroundColor: '#FFFFFF', padding: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              style={[commonStyles.input, { flex: 1 }]}
              value={input}
              onChangeText={setInput}
              placeholder={hasGuardianContact ? 'Share what’s on your mind…' : 'Save emergency contact to start chat'}
              editable={!sending && hasGuardianContact}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              style={[
                commonStyles.button,
                { minHeight: 42, minWidth: 72, opacity: canSend ? 1 : 0.5 },
              ]}
            >
              <Text style={commonStyles.buttonText}>{sending ? '…' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
