import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator
    initialRouteName="Welcome"
    screenOptions={{
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerTintColor: '#1D3557',
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: '#F1FAEE' },
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
  </Stack.Navigator>
);

export default AuthStack;
