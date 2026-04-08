import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../styles/common';

const roleButtonStyle = (active) => ({
  flex: 1,
  minHeight: 40,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: active ? colors.primary : '#FFFFFF',
  borderWidth: 1,
  borderColor: colors.primary,
});

const RegisterScreen = () => {
  const { register, updateGuardian } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!guardianName.trim() || !guardianPhone.trim()) {
      setError('Emergency contact name and phone are required.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
      await updateGuardian({
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianRelation: guardianRelation.trim(),
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: 16 }}
      >
        <View style={[commonStyles.card, { gap: 10 }]}>
          <Text style={commonStyles.title}>Create account</Text>
          <Text style={commonStyles.subtitle}>Set up your private MindEase profile.</Text>

          <View>
            <Text style={commonStyles.label}>Full name</Text>
            <TextInput value={name} onChangeText={setName} style={commonStyles.input} placeholder="Your name" />
          </View>

          <View>
            <Text style={commonStyles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={commonStyles.input}
              placeholder="name@university.edu"
            />
          </View>

          <View>
            <Text style={commonStyles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={commonStyles.input}
              placeholder="Minimum 6 characters"
            />
          </View>

          <View>
            <Text style={commonStyles.label}>Role</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={roleButtonStyle(role === 'student')} onPress={() => setRole('student')}>
                <Text style={{ color: role === 'student' ? '#FFFFFF' : colors.primary, fontWeight: '700' }}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity style={roleButtonStyle(role === 'counsellor')} onPress={() => setRole('counsellor')}>
                <Text style={{ color: role === 'counsellor' ? '#FFFFFF' : colors.primary, fontWeight: '700' }}>Counsellor</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text style={commonStyles.label}>Emergency contact name *</Text>
            <TextInput
              value={guardianName}
              onChangeText={setGuardianName}
              style={commonStyles.input}
              placeholder="Guardian name"
            />
          </View>

          <View>
            <Text style={commonStyles.label}>Emergency contact phone *</Text>
            <TextInput
              value={guardianPhone}
              onChangeText={setGuardianPhone}
              style={commonStyles.input}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text style={commonStyles.label}>Relationship (optional)</Text>
            <TextInput
              value={guardianRelation}
              onChangeText={setGuardianRelation}
              style={commonStyles.input}
              placeholder="Parent, sibling, friend…"
            />
          </View>

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={commonStyles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={commonStyles.buttonText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
