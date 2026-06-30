import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineBanner } from '../ui/OfflineBanner';
import { colors, spacing } from '../../theme';

interface SafeScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
  showOfflineBanner?: boolean;
}

export function SafeScreen({
  children,
  scroll = true,
  style,
  padded = true,
  showOfflineBanner = false,
}: SafeScreenProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.inner, padded && styles.padded, style]}>
      {showOfflineBanner ? <OfflineBanner embedded /> : null}
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.screen, { paddingBottom: insets.bottom }]}>{content}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
