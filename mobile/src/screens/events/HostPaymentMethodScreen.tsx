import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { InfoBanner } from '../../components/ui/InfoBanner';
import { Button } from '../../components/ui/Button';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useApprovalGuard } from '../../hooks/useApprovalGuard';
import { useHostEntryStore } from '../../store/hostEntryStore';
import type { MoiEntry } from '../../api/types';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

const METHODS: { mode: MoiEntry['payment_mode']; label: string; desc: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'cash', label: 'Cash', desc: 'Received in cash', color: '#22C55E', icon: 'wallet-outline' },
  { mode: 'upi', label: 'UPI Payment', desc: 'Google Pay, PhonePe, Paytm', color: '#3B82F6', icon: 'phone-portrait-outline' },
  { mode: 'other', label: 'Bank Transfer', desc: 'NEFT, RTGS, IMPS', color: '#6366F1', icon: 'business-outline' },
  { mode: 'card', label: 'Card Payment', desc: 'Debit / Credit Card', color: '#FFC107', icon: 'card-outline' },
  { mode: 'other', label: 'Digital Wallet', desc: 'Paytm Wallet, Amazon Pay', color: '#F97316', icon: 'wallet-outline' },
  { mode: 'cheque', label: 'Cheque', desc: 'Received by cheque', color: '#14B8A6', icon: 'document-text-outline' },
  { mode: 'other', label: 'Other', desc: 'Any other payment method', color: '#9CA3AF', icon: 'ellipsis-horizontal' },
];

const GIFT_METHODS: { giftType: 'gold' | 'silver' | 'gift'; label: string; desc: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { giftType: 'gold', label: 'Gold', desc: 'Record gold moi', color: '#EAB308', icon: 'diamond-outline' },
  { giftType: 'silver', label: 'Silver', desc: 'Record silver moi', color: '#94A3B8', icon: 'ellipse-outline' },
  { giftType: 'gift', label: 'Gift / Others', desc: 'Physical gifts & items', color: '#F97316', icon: 'gift-outline' },
];

export function HostPaymentMethodScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const slug = useScreenSlug();
  const { event } = useApprovalGuard(slug);
  const stored = useHostEntryStore((s) => s.getPaymentMode(slug));
  const setPaymentMode = useHostEntryStore((s) => s.setPaymentMode);
  const [selectedLabel, setSelectedLabel] = useState(stored?.label || 'Cash');

  if (!event) return null;

  const selected = METHODS.find((m) => m.label === selectedLabel) || METHODS[0];

  const handleConfirm = () => {
    setPaymentMode(slug, selected.mode, selected.label);
    navigation.navigate('MoiEntry', { slug });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Payment Method" onBack={() => navigation.goBack()} />
      <SafeScreen>
        <EventContextCard event={event} />
        <Text style={styles.title}>Select Payment Method</Text>
        <Text style={styles.sub}>Choose how the contributor made the payment.</Text>

        {METHODS.map((m, i) => {
          const isSelected = selectedLabel === m.label;
          return (
            <TouchableOpacity
              key={`${m.label}-${i}`}
              onPress={() => setSelectedLabel(m.label)}
              style={[styles.methodCard, isSelected && styles.methodActive]}
            >
              <View style={[styles.radio, isSelected && styles.radioActive]} />
              <View style={[styles.iconWrap, { backgroundColor: `${m.color}18` }]}>
                <Ionicons name={m.icon} size={20} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>{m.label}</Text>
                <Text style={styles.methodSub}>{m.desc}</Text>
              </View>
              {isSelected ? <Text style={styles.selectedBadge}>Selected</Text> : null}
            </TouchableOpacity>
          );
        })}

        <InfoBanner message="This helps in better tracking, reporting and reconciliation of moi collections." />

        <Text style={styles.title}>Non-Cash Moi</Text>
        <Text style={styles.sub}>Gold, silver, or gift contributions</Text>
        {GIFT_METHODS.map((g) => (
          <TouchableOpacity
            key={g.giftType}
            onPress={() => navigation.navigate('GiftEntry', { slug, giftType: g.giftType })}
            style={styles.methodCard}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${g.color}18` }]}>
              <Ionicons name={g.icon} size={20} color={g.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>{g.label}</Text>
              <Text style={styles.methodSub}>{g.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <Button title="Continue to Moi Entry" onPress={handleConfirm} />
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.lg },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, backgroundColor: colors.surface },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  methodTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  methodSub: { fontSize: 10, color: colors.textMuted },
  selectedBadge: { fontSize: 9, fontWeight: '700', color: colors.success, backgroundColor: colors.successBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
});
