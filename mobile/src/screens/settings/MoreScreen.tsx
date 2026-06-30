import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppSidebarContent } from '../../components/layout/AppSidebarContent';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';

export function MoreScreen() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.wrap}>
      <AppSidebarContent activeModule={null} onLogout={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface },
});
