import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationsApi } from '../../api';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { Notification } from '../../api/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

function getIconName(type: Notification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'entry_saved':
      return 'checkmark-circle-outline';
    case 'approval':
      return 'shield-checkmark-outline';
    case 'reminder':
    case 'function_date':
      return 'calendar-outline';
    case 'return_gift':
      return 'gift-outline';
    default:
      return 'notifications-outline';
  }
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useAppSettings();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await notificationsApi.list();
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch {
      // ignore
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications')}</Text>
        <TouchableOpacity onPress={onRefresh} hitSlop={12}>
          <Text style={styles.refresh}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t('noNotifications')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.is_read && styles.cardUnread]}
              onPress={() => !item.is_read && markAsRead(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={getIconName(item.type)} size={20} color={colors.gold} />
              </View>
              <View style={styles.body}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.message ? <Text style={styles.cardMessage}>{item.message}</Text> : null}
                {item.event_name ? <Text style={styles.cardEvent}>Event: {item.event_name}</Text> : null}
                <Text style={styles.cardTime}>{formatWhen(item.created_at)}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteNotification(item.id)} hitSlop={8} style={styles.deleteBtn}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: { marginRight: spacing.md },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  refresh: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gold },
  empty: { alignItems: 'center', marginTop: 60, gap: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardUnread: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  cardTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  cardMessage: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  cardEvent: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  cardTime: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
  deleteBtn: { padding: 4 },
});
