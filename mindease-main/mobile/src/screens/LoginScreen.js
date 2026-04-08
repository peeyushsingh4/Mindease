import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { commonStyles } from '../styles/common';

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(extractErrorMessage(err, 'Login failed.'));
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
          <Text style={commonStyles.title}>Welcome back</Text>
          <Text style={commonStyles.subtitle}>Sign in to your MindEase account.</Text>

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
              placeholder="••••••••"
            />
          </View>

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={commonStyles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={commonStyles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
