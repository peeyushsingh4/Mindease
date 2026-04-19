import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../styles/common';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (__DEV__) {
      console.warn('[ErrorBoundary]', error, info?.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={[commonStyles.screen, { justifyContent: 'center', padding: 24 }]}>
          <View style={[commonStyles.card, { gap: 12 }]}>
            <Text style={commonStyles.title}>Something went wrong</Text>
            <Text style={commonStyles.subtitle}>
              Close Expo Go completely (swipe it away), then run{' '}
              <Text style={{ fontWeight: '700' }}>npm run start:clear</Text> and scan the QR code again.
            </Text>
            <TouchableOpacity style={commonStyles.button} onPress={this.handleReset}>
              <Text style={commonStyles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}
