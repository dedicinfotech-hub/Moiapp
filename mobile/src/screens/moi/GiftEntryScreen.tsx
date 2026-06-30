import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { Input } from '../../components/ui/Input';
import { InfoBanner } from '../../components/ui/InfoBanner';
import { Button } from '../../components/ui/Button';
import { useApprovalGuard } from '../../hooks/useApprovalGuard';
import { saveMoiWithOfflineFallback } from '../../utils/offlineMoiSave';
import { showEntrySavedNotification } from '../../services/localNotifications';
import { useAppSettings } from '../../context/AppSettingsContext';
import { ApprovalBanner } from '../../components/layout/ApprovalBanner';
import { getApprovalBlockMessage } from '../../utils/eventHelpers';
import type { EventStackParamList } from '../../navigation/types';
import type { MoiEntry } from '../../api/types';
import { colors, fontSize, spacing } from '../../theme';

type GiftType = 'gold' | 'silver' | 'gift';

const GIFT_TYPES: { id: GiftType; title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'gold', title: 'Gold', sub: 'Gold ornaments or coins', icon: 'diamond-outline' },
  { id: 'silver', title: 'Silver', sub: 'Silver items', icon: 'ellipse-outline' },
  { id: 'gift', title: 'Gift', sub: 'Other physical gifts', icon: 'gift-outline' },
];

export function GiftEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const route = useRoute<RouteProp<EventStackParamList, 'GiftEntry'>>();
  const slug = useScreenSlug();
  const { event, canAddMoi } = useApprovalGuard(slug);
  const { settings, t } = useAppSettings();
  const initialType: GiftType = route.params?.giftType === 'gold' || route.params?.giftType === 'silver'
    ? route.params.giftType
    : 'gift';
  const [giftType, setGiftType] = useState<GiftType>(initialType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [approxValue, setApproxValue] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!event) return null;

  const handleSave = async () => {
    if (!canAddMoi && event) {
      Alert.alert('Not allowed', getApprovalBlockMessage(event));
      return;
    }
    if (!name.trim()) {
      Alert.alert('Required', 'Contributor name is required');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Item description is required');
      return;
    }
    if ((giftType === 'gold' || giftType === 'silver') && !weight.trim()) {
      Alert.alert('Required', 'Weight is required for gold/silver entries');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<MoiEntry> = {
        event_id: event.id,
        guest_name: name.trim(),
        amount: approxValue ? parseFloat(approxValue) : 0,
        gift_type: giftType,
        gift_description: description.trim(),
        gold_weight: giftType === 'gold' || giftType === 'silver' ? parseFloat(weight) : undefined,
        approximate_value: approxValue ? parseFloat(approxValue) : undefined,
        payment_mode: 'other',
        note: note.trim(),
        relation: 'other',
        entered_by: 'host',
      };
      const result = await saveMoiWithOfflineFallback(
        payload,
        {
          event_id: event.id,
          event_name: event.custom_title || event.slug,
          guest_name: name.trim(),
          amount: approxValue ? parseFloat(approxValue) : 0,
          gift_type: giftType,
          gift_description: description.trim(),
          gold_weight: giftType === 'gold' || giftType === 'silver' ? parseFloat(weight) : undefined,
          approximate_value: approxValue ? parseFloat(approxValue) : undefined,
          payment_mode: 'other',
          note: note.trim(),
          relation: 'other',
          entered_by: 'host',
        },
        () => {
          setName('');
          setDescription('');
          setWeight('');
          setApproxValue('');
          setNote('');
        }
      );
      if (result === 'online') {
        await showEntrySavedNotification(`${name.trim()} — gift`, settings);
        Alert.alert(t('save'), t('giftSaved'));
        setName('');
        setDescription('');
        setWeight('');
        setApproxValue('');
        setNote('');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Gift Entry" onBack={() => navigation.goBack()} />
      <SafeScreen showOfflineBanner>
        <ApprovalBanner event={event} />
        <EventContextCard event={event} />

        <Text style={styles.label}>Gift Type *</Text>
        {GIFT_TYPES.map((g) => (
          <TouchableOpacity
            key={g.id}
            onPress={() => setGiftType(g.id)}
            style={[styles.giftCard, giftType === g.id && styles.giftCardActive]}
          >
            <Ionicons name={g.icon} size={22} color={giftType === g.id ? colors.primary : colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.giftTitle}>{g.title}</Text>
              <Text style={styles.giftSub}>{g.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Input label="Contributor Name" icon="person-outline" placeholder="Enter contributor name" value={name} onChangeText={setName} required />
        <Input label="Item Description" icon="gift-outline" placeholder="e.g., Gold chain, Silver lamp" value={description} onChangeText={setDescription} required />
        {(giftType === 'gold' || giftType === 'silver') ? (
          <Input label="Weight (grams)" icon="scale-outline" placeholder="e.g., 8" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" required />
        ) : null}
        <Input label="Approximate Value (₹) — Optional" icon="cash-outline" placeholder="Estimated value" value={approxValue} onChangeText={setApproxValue} keyboardType="numeric" />
        <Input label="Remarks (Optional)" icon="document-text-outline" placeholder="Additional notes" value={note} onChangeText={setNote} multiline />

        <InfoBanner message="Non-cash entries appear in Moi Register with a gift icon. Value can be left blank and shown as 'not recorded'." />

        <View style={styles.btnRow}>
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} fullWidth={false} />
          <Button title="Save Gift Entry" onPress={handleSave} loading={loading} disabled={!canAddMoi} style={{ flex: 1 }} fullWidth={false} />
        </View>
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  giftCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: colors.border, marginBottom: spacing.sm, backgroundColor: colors.surface },
  giftCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  giftTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  giftSub: { fontSize: 10, color: colors.textMuted },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});
