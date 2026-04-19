import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import ChatScreen from '../screens/ChatScreen';
import DashboardScreen from '../screens/DashboardScreen';
import JournalScreen from '../screens/JournalScreen';
import MoodScreen from '../screens/MoodScreen';
import ScreeningHubScreen from '../screens/ScreeningHubScreen';
import ScreeningQuestionScreen from '../screens/ScreeningQuestionScreen';

const Stack = createNativeStackNavigator();

const LogoutButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
    <Text style={{ color: '#E63946', fontWeight: '700' }}>Logout</Text>
  </TouchableOpacity>
);

const AppStack = () => {
  const { logout } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1e3a5f',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#f2f9f2' },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'MindEase',
          headerRight: () => <LogoutButton onPress={logout} />,
        }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'AI Support Chat' }} />
      <Stack.Screen name="Mood" component={MoodScreen} options={{ title: 'Mood Tracker' }} />
      <Stack.Screen name="Journal" component={JournalScreen} options={{ title: 'Journal' }} />
      <Stack.Screen name="ScreeningHub" component={ScreeningHubScreen} options={{ title: 'Screenings' }} />
      <Stack.Screen name="ScreeningQuestionnaire" component={ScreeningQuestionScreen} options={{ title: 'Assessment' }} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: 'Appointments' }} />
    </Stack.Navigator>
  );
};

export default AppStack;
