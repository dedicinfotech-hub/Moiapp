import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminStackParamList } from './types';
import {
  AdminDashboardScreen,
  AdminApprovalsScreen,
  AdminUsersScreen,
  AdminRevenueScreen,
  AdminAnalyticsScreen,
  AdminSupportScreen,
  AdminPrivateEventsScreen,
  AdminFeaturesScreen,
  AdminLoginLogsScreen,
} from '../screens/admin/AdminScreens';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminApprovals" component={AdminApprovalsScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminRevenue" component={AdminRevenueScreen} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <Stack.Screen name="AdminSupport" component={AdminSupportScreen} />
      <Stack.Screen name="AdminPrivateEvents" component={AdminPrivateEventsScreen} />
      <Stack.Screen name="AdminFeatures" component={AdminFeaturesScreen} />
      <Stack.Screen name="AdminLoginLogs" component={AdminLoginLogsScreen} />
    </Stack.Navigator>
  );
}
