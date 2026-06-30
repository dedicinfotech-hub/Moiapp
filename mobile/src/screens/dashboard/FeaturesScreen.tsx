import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { featuresApi, type FeatureToggle } from '../../api/features';
import type { MoreStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function FeaturesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    featuresApi.list().then((r) => setFeatures(r.toggles || [])).catch(() => setFeatures([])).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (f: FeatureToggle) => {
    try {
      await featuresApi.update(f.feature_key, f.is_enabled ? 0 : 1);
      setFeatures((prev) =>
        prev.map((x) => (x.feature_key === f.feature_key ? { ...x, is_enabled: f.is_enabled ? 0 : 1 } : x))
      );
    } catch { /* ignore */ }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Features"
        subtitle="Enable or disable app features"
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={features}
          keyExtractor={(item) => item.feature_key}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => toggle(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.key}>{item.feature_key.replace(/_/g, ' ')}</Text>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
              <View style={[styles.badge, item.is_enabled ? styles.on : styles.off]}>
                <Text style={styles.badgeText}>{item.is_enabled ? 'ON' : 'OFF'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  key: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  desc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  on: { backgroundColor: colors.successBg },
  off: { backgroundColor: colors.border },
  badgeText: { fontSize: fontSize.xs, fontWeight: '800' },
});
