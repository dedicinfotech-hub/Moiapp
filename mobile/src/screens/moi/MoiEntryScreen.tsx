import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { Input } from '../../components/ui/Input';
import { AmountChips } from '../../components/forms/AmountChips';
import { SelectChips, RELATION_OPTIONS, PAYMENT_MODE_OPTIONS } from '../../components/forms/SelectChips';
import { InfoBanner } from '../../components/ui/InfoBanner';
import { Button } from '../../components/ui/Button';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useApprovalGuard } from '../../hooks/useApprovalGuard';
import { useHostEntryStore } from '../../store/hostEntryStore';
import { moiApi } from '../../api';
import { ApprovalBanner } from '../../components/layout/ApprovalBanner';
import { getApprovalBlockMessage } from '../../utils/eventHelpers';
import { saveMoiWithOfflineFallback } from '../../utils/offlineMoiSave';
import { showEntrySavedNotification } from '../../services/localNotifications';
import { useAppSettings } from '../../context/AppSettingsContext';
import type { MoiEntry } from '../../api/types';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, spacing } from '../../theme';

export function MoiEntryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const slug = useScreenSlug();
  const { event, canAddMoi } = useApprovalGuard(slug);
  const storedPayment = useHostEntryStore((s) => s.getPaymentMode(slug));
  const { settings } = useAppSettings();
  const [entryType, setEntryType] = useState<'moi' | 'advance'>('moi');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [company, setCompany] = useState('');
  const [occupation, setOccupation] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<MoiEntry['payment_mode']>(storedPayment?.mode || 'cash');
  const [relation, setRelation] = useState<MoiEntry['relation']>('friend');
  const [upiRef, setUpiRef] = useState('');
  const [otherPayment, setOtherPayment] = useState('');
  const [remarks, setRemarks] = useState('');
  const [chipAmount, setChipAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (storedPayment) setPaymentMode(storedPayment.mode);
  }, [storedPayment?.mode]);

  if (!event) return null;

  const handleSave = async () => {
    if (!canAddMoi && event) {
      Alert.alert('Not Approved', getApprovalBlockMessage(event));
      return;
    }
    const finalAmount = chipAmount || parseFloat(amount);
    if (!name.trim() || !finalAmount) {
      Alert.alert('Required', 'Name and amount are required');
      return;
    }
    setLoading(true);
    try {
      const note = entryType === 'advance' ? `[Advance] ${remarks}` : remarks;
      const result = await saveMoiWithOfflineFallback(
        {
          event_id: event.id,
          guest_name: name.trim(),
          phone: phone || undefined,
          city: city || undefined,
          company: company || undefined,
          occupation: occupation || undefined,
          amount: finalAmount,
          gift_type: 'cash',
          payment_mode: paymentMode,
          upi_ref_id: paymentMode === 'upi' ? upiRef || undefined : undefined,
          other_payment_details: paymentMode === 'other' ? otherPayment || undefined : undefined,
          note,
          relation,
          entered_by: 'host_manual',
          entry_type: entryType,
        } as Partial<MoiEntry>,
        {
          event_id: event.id,
          event_name: event.custom_title || event.slug,
          guest_name: name.trim(),
          phone: phone || undefined,
          city: city || undefined,
          company: company || undefined,
          occupation: occupation || undefined,
          amount: finalAmount,
          gift_type: 'cash',
          payment_mode: paymentMode,
          upi_ref_id: paymentMode === 'upi' ? upiRef || undefined : undefined,
          other_payment_details: paymentMode === 'other' ? otherPayment || undefined : undefined,
          note,
          relation,
          entered_by: 'host_manual',
        },
        () => navigation.goBack()
      );
      if (result === 'online') {
        await showEntrySavedNotification(`${name.trim()} — ₹${finalAmount}`, settings);
        navigation.goBack();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      Alert.alert('Error', msg.includes('approval') || msg.includes('rejected') ? msg : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Moi Entry" onBack={() => navigation.goBack()} />
      <SafeScreen showOfflineBanner>
        {event ? <ApprovalBanner event={event} /> : null}
        <EventContextCard event={event} />

        <Text style={styles.label}>Entry Type *</Text>
        <View style={styles.typeRow}>
          {[
            { id: 'moi' as const, title: 'Moi Collection', sub: 'Record amount contributed' },
            { id: 'advance' as const, title: 'Advance / Top-up', sub: 'Record advance payment' },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setEntryType(t.id)}
              style={[styles.typeCard, entryType === t.id && styles.typeCardActive]}
            >
              <View style={[styles.radio, entryType === t.id && styles.radioActive]} />
              <Text style={styles.typeTitle}>{t.title}</Text>
              <Text style={styles.typeSub}>{t.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Contributor Name" icon="person-outline" placeholder="Enter contributor name" value={name} onChangeText={setName} required />
        <Input label="Phone Number (Optional)" icon="call-outline" placeholder="Enter phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label="City (Optional)" icon="business-outline" placeholder="City" value={city} onChangeText={setCity} />
        <Input label="Company (Optional)" icon="briefcase-outline" placeholder="Company" value={company} onChangeText={setCompany} />
        <Input label="Occupation (Optional)" icon="construct-outline" placeholder="Occupation" value={occupation} onChangeText={setOccupation} />
        <Input label="Amount (₹)" icon="cash-outline" placeholder="Enter amount" value={amount} onChangeText={setAmount} keyboardType="numeric" required />
        <AmountChips values={[101, 501, 1001, 5001]} selected={chipAmount} onSelect={(v) => { setChipAmount(v); if (v) setAmount(String(v)); }} />

        <SelectChips label="Payment Mode" options={PAYMENT_MODE_OPTIONS} value={paymentMode} onChange={setPaymentMode} />
        {paymentMode === 'upi' ? (
          <Input label="UPI Reference ID" icon="card-outline" placeholder="Transaction ref" value={upiRef} onChangeText={setUpiRef} />
        ) : null}
        {paymentMode === 'other' ? (
          <Input label="Payment Details" icon="document-text-outline" placeholder="Bank / other details" value={otherPayment} onChangeText={setOtherPayment} />
        ) : null}
        <SelectChips label="Relation" options={RELATION_OPTIONS} value={relation} onChange={setRelation} />
        <Input label="Remarks (Optional)" icon="document-text-outline" placeholder="Add remarks" value={remarks} onChangeText={setRemarks} multiline maxLength={200} />

        <InfoBanner message="This entry will be recorded under this function. You can view all entries in the dashboard." />

        <View style={styles.btnRow}>
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} fullWidth={false} />
          <Button title="Save Entry" onPress={handleSave} loading={loading} disabled={!canAddMoi} style={{ flex: 1 }} fullWidth={false} />
        </View>
      </SafeScreen>
    </View>
  );
}

interface EditMoiModalProps {
  entry: MoiEntry | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditMoiModal({ entry, visible, onClose, onSaved }: EditMoiModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [relation, setRelation] = useState<MoiEntry['relation']>('friend');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (entry) {
      setName(entry.guest_name);
      setAmount(String(entry.amount));
      setRelation(entry.relation);
      setNote(entry.note || '');
    }
  }, [entry?.id]);

  const handleSave = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      await moiApi.update(entry.id, {
        guest_name: name.trim(),
        amount: parseFloat(amount),
        relation,
        note,
      });
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Edit Entry</Text>
          <Input label="Guest Name" value={name} onChangeText={setName} />
          <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <SelectChips label="Relation" options={RELATION_OPTIONS} value={relation} onChange={setRelation} />
          <Input label="Note" value={note} onChangeText={setNote} multiline />
          <View style={styles.btnRow}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} fullWidth={false} />
            <Button title="Save" onPress={handleSave} loading={loading} style={{ flex: 1 }} fullWidth={false} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  typeCard: { flex: 1, padding: spacing.md, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.border, marginBottom: 6 },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  typeTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  typeSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '85%' },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
});
