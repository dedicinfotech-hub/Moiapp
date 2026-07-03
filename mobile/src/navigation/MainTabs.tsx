import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { FunctionsScreen } from '../screens/home/FunctionsScreen';
import { GlobalMoiListScreen, GlobalReportsScreen } from '../screens/home/GlobalScreens';
import { MoreStack } from './MoreStack';
import { PublicStack } from './PublicStack';
import { useAppSettings } from '../context/AppSettingsContext';
import { useScaledTheme } from '../theme/useScaledTheme';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { t } = useAppSettings();
  const { scaledFontSize } = useScaledTheme();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: scaledFontSize.xs, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            PublicBrowse: 'home-outline',
            Dashboard: 'grid-outline',
            Functions: 'calendar-outline',
            MoiList: 'list-outline',
            ReportsTab: 'bar-chart-outline',
            More: 'ellipsis-horizontal',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PublicBrowse" component={PublicStack} options={{ tabBarLabel: t('home') }} />
      <Tab.Screen name="Dashboard" component={HomeScreen} options={{ tabBarLabel: t('dashboard') }} />
      <Tab.Screen name="Functions" component={FunctionsScreen} options={{ tabBarLabel: t('events') }} />
      <Tab.Screen name="MoiList" component={GlobalMoiListScreen} options={{ tabBarLabel: t('moiNotebook') }} />
      <Tab.Screen name="ReportsTab" component={GlobalReportsScreen} options={{ tabBarLabel: t('analytics') }} />
      <Tab.Screen name="More" component={MoreStack} options={{ tabBarLabel: t('menu') }} />
    </Tab.Navigator>
  );
}
