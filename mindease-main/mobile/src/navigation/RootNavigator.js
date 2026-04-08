import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../screens/LoadingScreen';
import AppStack from './AppStack';
import AuthStack from './AuthStack';

const RootNavigator = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

export default RootNavigator;
