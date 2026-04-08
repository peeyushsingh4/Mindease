import React from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';
import { colors, commonStyles } from '../styles/common';

const LoadingScreen = () => (
  <SafeAreaView style={[commonStyles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
    <View style={{ alignItems: 'center', gap: 12 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.textMuted }}>Preparing your workspace…</Text>
    </View>
  </SafeAreaView>
);

export default LoadingScreen;
