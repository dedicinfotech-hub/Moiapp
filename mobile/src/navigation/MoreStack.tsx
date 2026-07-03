import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MoreStackParamList } from './types';
import { MoreScreen } from '../screens/settings/MoreScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { OrganizersScreen } from '../screens/dashboard/OrganizersScreen';
import { GuestsScreen } from '../screens/dashboard/GuestsScreen';
import { FeaturesScreen } from '../screens/dashboard/FeaturesScreen';
import { AdminStack } from './AdminStack';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Organizers" component={OrganizersScreen} />
      <Stack.Screen name="Guests" component={GuestsScreen} />
      <Stack.Screen name="Features" component={FeaturesScreen} />
      <Stack.Screen name="AdminPanel" component={AdminStack} />
    </Stack.Navigator>
  );
}
