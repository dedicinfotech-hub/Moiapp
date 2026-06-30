import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { notificationsApi } from '../../api';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

export function NotificationBellButton({ color = colors.text }: { color?: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.list();
      setUnreadCount(data.unread_count || 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadCount();
  }, [loadCount]));

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      hitSlop={12}
      style={styles.wrap}
      accessibilityLabel="Notifications"
    >
      <Ionicons name="notifications-outline" size={24} color={color} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
