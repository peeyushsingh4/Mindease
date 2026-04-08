import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../styles/common';
import { extractErrorMessage } from '../api/client';

const WelcomeScreen = ({ navigation }) => {
  const { loginAnonymous } = useAuth();
  const [anonLoading, setAnonLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnonymousStart = async () => {
    setError('');
    setAnonLoading(true);
    try {
      await loginAnonymous();
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

          <TouchableOpacity
            style={[commonStyles.button, { backgroundColor: colors.primaryDark }]}
            onPress={handleAnonymousStart}
            disabled={anonLoading}
          >
            <Text style={commonStyles.buttonText}>{anonLoading ? 'Starting…' : 'Continue Anonymously'}</Text>
          </TouchableOpacity>

          {error ? <Text style={commonStyles.errorText}>{error}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
