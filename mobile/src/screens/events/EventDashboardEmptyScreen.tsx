import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { Button } from '../../components/ui/Button';
import { useEvent } from '../../hooks/useEvent';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, spacing } from '../../theme';

export function EventDashboardEmptyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const route = useRoute<RouteProp<EventStackParamList, 'EventDashboardEmpty'>>();
  const { slug } = route.params;
  const { event } = useEvent(slug);

  if (!event) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Dashboard" onBack={() => navigation.getParent()?.goBack()} />
      <SafeScreen>
        <EventContextCard event={event} />
        <View style={styles.empty}>
          <View style={styles.illustration}>
            <Ionicons name="paper-plane" size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Moi Entries Yet!</Text>
          <Text style={styles.emptySub}>Share your QR code with your guests to start collecting Moi.</Text>
          <Button title="Share QR Code" onPress={() => navigation.navigate('QRCode', { slug })} style={{ marginTop: spacing.lg }} />
          <Button title="Add Manual Entry" variant="outline" onPress={() => navigation.navigate('MoiEntry', { slug })} style={{ marginTop: spacing.md }} />
        </View>
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  illustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
});
