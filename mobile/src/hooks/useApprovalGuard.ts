import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvent } from './useEvent';
import { canAddMoi, needsApprovalScreen } from '../utils/eventHelpers';
import type { EventStackParamList } from '../navigation/types';

/** Redirect unapproved new events to the pending screen (matches web dashboard guard). */
export function useApprovalGuard(slug: string, options?: { redirect?: boolean }) {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const redirect = options?.redirect !== false;
  const { event, loading, reload } = useEvent(slug);

  useEffect(() => {
    if (!redirect || !event || !needsApprovalScreen(event)) return;
    navigation.replace('PendingApproval', { slug });
  }, [event?.approval_status, event?.event_mode, slug, redirect, navigation]);

  return {
    event,
    loading,
    reload,
    canAddMoi: event ? canAddMoi(event) : false,
    needsApproval: event ? needsApprovalScreen(event) : false,
  };
}
