import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEvent } from '../../hooks/useEvent';
import { EventHubHeader } from './EventHubHeader';
import { EventHubTabs, type EventHubTab } from './EventHubTabs';
import type { EventStackParamList, EventTabParamList } from '../../navigation/types';
import { colors } from '../../theme';

const TAB_ROUTES: Record<EventHubTab, keyof EventTabParamList> = {
  moi: 'EventMoiRegister',
  photos: 'EventPhotos',
  summary: 'EventSummary',
  invitations: 'EventInvitations',
  returns: 'EventReturnTracker',
};

interface Props {
  slug: string;
  activeTab: EventHubTab;
  children: React.ReactNode;
}

export function EventHubLayout({ slug, activeTab, children }: Props) {
  const navigation = useNavigation<CompositeNavigationProp<
    BottomTabNavigationProp<EventTabParamList>,
    NativeStackNavigationProp<EventStackParamList>
  >>();
  const { event, loading } = useEvent(slug);

  const onTabChange = (tab: EventHubTab) => {
    if (tab === activeTab) return;
    navigation.navigate(TAB_ROUTES[tab], { slug });
  };

  if (loading || !event) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <EventHubHeader event={event} slug={slug} />
      <EventHubTabs active={activeTab} onChange={onTabChange} />
      {children}
    </View>
  );
}
