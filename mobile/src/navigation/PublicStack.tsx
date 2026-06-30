import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PublicStackParamList } from './types';
import { PublicHomeScreen } from '../screens/public/PublicHomeScreen';
import { PublicEventsListScreen } from '../screens/public/PublicEventsListScreen';
import { PublicEventDetailScreen } from '../screens/public/PublicEventDetailScreen';

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PublicHome" component={PublicHomeScreen} />
      <Stack.Screen name="PublicEventsList" component={PublicEventsListScreen} />
      <Stack.Screen name="PublicEventDetail" component={PublicEventDetailScreen} />
    </Stack.Navigator>
  );
}
