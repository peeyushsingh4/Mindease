import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { signInWithPhoneNumber } from 'firebase/auth';
import api, { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { firebaseAuth, firebaseConfig } from '../lib/firebaseClient';
import { colors, commonStyles } from '../styles/common';
import { isValidGuardianPhone, sanitizeGuardianPhoneInput } from '../utils/guardianPhone';

const timestampLabel = (dateString) =>
  new Date(dateString || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatScreen = () => {
  const recaptchaVerifier = useRef(null);
  const { user, updateGuardian, verifyGuardianWithFirebase } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianOtp, setGuardianOtp] = useState('');
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [requestingGuardianOtp, setRequestingGuardianOtp] = useState(false);
  const [verifyingGuardianOtp, setVerifyingGuardianOtp] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const hasGuardianContact = Boolean(user?.guardianPhone && user.guardianPhone.trim());
  const hasVerifiedGuardianContact = Boolean(user?.guardianPhone && user?.guardianPhoneVerified);

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
    setOtpRequested(false);
    setGuardianOtp('');
    setConfirmation(null);
  }, [user?.guardianName, user?.guardianPhone, user?.guardianRelation, user?.guardianPhoneVerified]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending && hasVerifiedGuardianContact,
    [input, sending, hasVerifiedGuardianContact]
  );

  const handleSaveGuardian = async () => {
    if (!guardianName.trim() || !guardianPhone.trim()) {
      setError('Emergency contact name and phone are required before using chat.');
      return;
    }
    if (!isValidGuardianPhone(guardianPhone)) {
      setError('Emergency contact number must be exactly 10 digits with numbers only.');
      return;
    }

    setError('');
    setSavingGuardian(true);
    try {
      const updatedUser = await updateGuardian({
        guardianName: guardianName.trim(),
        guardianPhone: sanitizeGuardianPhoneInput(guardianPhone),
        guardianRelation: guardianRelation.trim(),
      });
      if (updatedUser && !updatedUser.guardianPhoneVerified) {
        setOtpRequested(false);
        setGuardianOtp('');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save emergency contact.'));
    } finally {
      setSavingGuardian(false);
    }
  };

  const handleRequestGuardianOtp = async () => {
    if (!guardianName.trim() || !isValidGuardianPhone(guardianPhone)) {
      setError('Enter a valid emergency contact name and a 10-digit phone number first.');
      return;
    }

    setError('');
    setRequestingGuardianOtp(true);
    try {
      await updateGuardian({
        guardianName: guardianName.trim(),
        guardianPhone: sanitizeGuardianPhoneInput(guardianPhone),
        guardianRelation: guardianRelation.trim(),
      });
      const phoneE164 = `+91${sanitizeGuardianPhoneInput(guardianPhone)}`;
      const response = await signInWithPhoneNumber(firebaseAuth, phoneE164, recaptchaVerifier.current);
      setConfirmation(response);
      setOtpRequested(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not send OTP.'));
    } finally {
      setRequestingGuardianOtp(false);
    }
  };

  const handleVerifyGuardianOtp = async () => {
    if (!confirmation) {
      setError('Please request OTP first.');
      return;
    }
    if (!/^\d{6}$/.test(guardianOtp.trim())) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    setError('');
    setVerifyingGuardianOtp(true);
    try {
      const credential = await confirmation.confirm(guardianOtp.trim());
      const firebaseIdToken = await credential.user.getIdToken(true);
      await verifyGuardianWithFirebase({
        guardianName: guardianName.trim(),
        guardianPhone: sanitizeGuardianPhoneInput(guardianPhone),
        guardianRelation: guardianRelation.trim(),
        firebaseIdToken,
      });
      setOtpRequested(false);
      setGuardianOtp('');
      setConfirmation(null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not verify OTP.'));
    } finally {
      setVerifyingGuardianOtp(false);
    }
  };

  const handleSend = async () => {
    if (!canSend) {
      if (!hasVerifiedGuardianContact) {
        setError('Please add and verify an emergency contact before sending chat messages.');
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
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[commonStyles.contentContainer, { paddingBottom: 100 }]}>
          {loadingHistory ? (
            <View style={[commonStyles.card, { alignItems: 'center', paddingVertical: 24 }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[commonStyles.subtitle, { marginTop: 10 }]}>Loading conversation…</Text>
            </View>
          ) : null}

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          {!hasVerifiedGuardianContact ? (
            <View style={[commonStyles.card, { gap: 10, borderColor: '#FCD34D', backgroundColor: '#FFFBEB' }]}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                Emergency contact verification required
              </Text>
              <Text style={commonStyles.subtitle}>
                Add a guardian contact and verify the 10-digit phone number by OTP before chat can trigger crisis support.
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
                  onChangeText={(value) => setGuardianPhone(sanitizeGuardianPhoneInput(value))}
                  placeholder="10-digit number"
                  keyboardType="phone-pad"
                  maxLength={10}
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

              <TouchableOpacity
                style={[commonStyles.button, commonStyles.buttonSecondary]}
                onPress={handleRequestGuardianOtp}
                disabled={requestingGuardianOtp}
              >
                <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
                  {requestingGuardianOtp ? 'Sending OTP…' : 'Send OTP'}
                </Text>
              </TouchableOpacity>

              {otpRequested ? (
                <View style={{ gap: 8 }}>
                  <View>
                    <Text style={commonStyles.label}>Enter OTP</Text>
                    <TextInput
                      style={commonStyles.input}
                      value={guardianOtp}
                      onChangeText={(value) => setGuardianOtp(String(value || '').replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      placeholder="6-digit OTP"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity
                    style={commonStyles.button}
                    onPress={handleVerifyGuardianOtp}
                    disabled={verifyingGuardianOtp}
                  >
                    <Text style={commonStyles.buttonText}>
                      {verifyingGuardianOtp ? 'Verifying…' : 'Verify OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {hasGuardianContact && !user?.guardianPhoneVerified ? (
                <Text style={commonStyles.subtitle}>
                  Your contact is saved but not verified yet.
                </Text>
              ) : null}
              {user?.guardianPhoneVerified ? (
                <Text style={[commonStyles.subtitle, { color: colors.success }]}>
                  Emergency contact verified.
                </Text>
              ) : null}
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
              placeholder={hasVerifiedGuardianContact ? 'Share what’s on your mind…' : 'Verify emergency contact to start chat'}
              editable={!sending && hasVerifiedGuardianContact}
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
