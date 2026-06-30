import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventSlugProvider } from '../hooks/useEventSlug';
import { useEvent } from '../hooks/useEvent';
import { needsApprovalScreen } from '../utils/eventHelpers';
import type { EventStackParamList, EventTabParamList } from './types';
import { EventMoiRegisterScreen } from '../screens/moi/MoiEntriesScreen';
import { EventPhotosScreen } from '../screens/events/EventPhotosScreen';
import { EventSummaryScreen } from '../screens/events/EventSummaryScreen';
import { EventInvitationsScreen } from '../screens/events/EventInvitationsScreen';
import { ReturnTrackerScreen } from '../screens/events/ReturnTrackerScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<EventTabParamList>();

type Props = NativeStackScreenProps<EventStackParamList, 'EventTabs'>;

function EventTabsContent({ route }: Pick<Props, 'route'>) {
  const { slug } = route.params;

  return (
    <EventSlugProvider slug={slug}>
      <Tab.Navigator
        screenOptions={({ route: tabRoute }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 56,
            paddingBottom: 6,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 8, fontWeight: '600' },
          tabBarIcon: ({ color, size }) => {
            const icons: Record<keyof EventTabParamList, keyof typeof Ionicons.glyphMap> = {
              EventMoiRegister: 'list-outline',
              EventPhotos: 'images-outline',
              EventSummary: 'stats-chart-outline',
              EventInvitations: 'people-outline',
              EventReturnTracker: 'gift-outline',
            };
            return <Ionicons name={icons[tabRoute.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="EventMoiRegister" component={EventMoiRegisterScreen} options={{ tabBarLabel: 'Register' }} initialParams={{ slug }} />
        <Tab.Screen name="EventPhotos" component={EventPhotosScreen} options={{ tabBarLabel: 'Photos' }} initialParams={{ slug }} />
        <Tab.Screen name="EventSummary" component={EventSummaryScreen} options={{ tabBarLabel: 'Summary' }} initialParams={{ slug }} />
        <Tab.Screen name="EventInvitations" component={EventInvitationsScreen} options={{ tabBarLabel: 'Invites' }} initialParams={{ slug }} />
        <Tab.Screen name="EventReturnTracker" component={ReturnTrackerScreen} options={{ tabBarLabel: 'Returns' }} initialParams={{ slug }} />
      </Tab.Navigator>
    </EventSlugProvider>
  );
}

/** Event hub — mirrors web /events/{slug} tabs */
export function EventTabs({ route }: Props) {
  const { slug } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const { event, loading } = useEvent(slug);

  useEffect(() => {
    if (!event || !needsApprovalScreen(event)) return;
    navigation.replace('PendingApproval', { slug });
  }, [event?.approval_status, event?.event_mode, slug, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!event || needsApprovalScreen(event)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  return <EventTabsContent route={route} />;
}

export type EventTabRouteProp<T extends keyof EventTabParamList> = RouteProp<EventTabParamList, T>;
