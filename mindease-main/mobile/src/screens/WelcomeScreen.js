import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, MINIMUM_AGE } from '../config/constants';
import { colors, commonStyles } from '../styles/common';
import { extractErrorMessage } from '../api/client';

const WelcomeScreen = ({ navigation }) => {
  const { loginAnonymous } = useAuth();
  const [anonLoading, setAnonLoading] = useState(false);
  const [error, setError] = useState('');
  const [age, setAge] = useState('');

  const handleAnonymousStart = async () => {
    const parsedAge = Number(age);
    if (!Number.isFinite(parsedAge)) {
      setError(`Enter your age to continue anonymously (${MINIMUM_AGE}+).`);
      return;
    }
    if (parsedAge < MINIMUM_AGE) {
      setError(`You must be at least ${MINIMUM_AGE} to use MindEase.`);
      return;
    }
    setError('');
    setAnonLoading(true);
    try {
      await loginAnonymous({ age: parsedAge });
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not start anonymous session.'));
    } finally {
      setAnonLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView contentContainerStyle={[commonStyles.contentContainer, { flexGrow: 1, justifyContent: 'center' }]}>
        <View style={[commonStyles.card, { gap: 12, padding: 20 }]}>
          <Text style={commonStyles.title}>MindEase Mobile</Text>
          <Text style={commonStyles.subtitle}>
            Secure mental health support on the go. Sign in, create an account, or start anonymously.
          </Text>

          <TouchableOpacity style={[commonStyles.button, { marginTop: 6 }]} onPress={() => navigation.navigate('Login')}>
            <Text style={commonStyles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.button, commonStyles.buttonSecondary]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>Create Account</Text>
          </TouchableOpacity>

          <View>
            <Text style={commonStyles.label}>Your age (anonymous only, {MINIMUM_AGE}+)</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              style={commonStyles.input}
              placeholder={`e.g. ${MINIMUM_AGE}`}
            />
          </View>

          <TouchableOpacity
            style={[commonStyles.button, { backgroundColor: colors.primaryDark }]}
            onPress={handleAnonymousStart}
            disabled={anonLoading}
          >
            <Text style={commonStyles.buttonText}>{anonLoading ? 'Starting…' : 'Continue Anonymously'}</Text>
          </TouchableOpacity>

          {__DEV__ ? (
            <Text style={[commonStyles.subtitle, { fontSize: 11, opacity: 0.85 }]}>
              Dev API: {API_BASE_URL}
            </Text>
          ) : null}

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
