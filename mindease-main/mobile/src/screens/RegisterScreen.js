import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MINIMUM_AGE } from '../config/constants';
import { colors, commonStyles } from '../styles/common';
import { isValidGuardianPhone, sanitizeGuardianPhoneInput } from '../utils/guardianPhone';

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
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }
    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge)) {
      setError('Please enter your age.');
      return;
    }
    if (parsedAge < MINIMUM_AGE) {
      setError(`You must be at least ${MINIMUM_AGE} to use MindEase.`);
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
    if (!isValidGuardianPhone(guardianPhone)) {
      setError('Emergency contact number must be exactly 10 digits with numbers only.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role, age: parsedAge });
      await updateGuardian({
        guardianName: guardianName.trim(),
        guardianPhone: sanitizeGuardianPhoneInput(guardianPhone),
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
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
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
            <Text style={commonStyles.label}>Age ({MINIMUM_AGE}+)</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              style={commonStyles.input}
              placeholder={`Minimum ${MINIMUM_AGE}`}
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
              onChangeText={(value) => setGuardianPhone(sanitizeGuardianPhoneInput(value))}
              style={commonStyles.input}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
