import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { EventContextCard } from '../../components/layout/EventContextCard';
import { Button } from '../../components/ui/Button';
import { useEvent } from '../../hooks/useEvent';
import { eventsApi } from '../../api';
import type { EventStackParamList } from '../../navigation/types';
import { colors, fontSize, radius, spacing } from '../../theme';

export function InvitationUploadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
  const slug = useScreenSlug();
  const { event, reload } = useEvent(slug);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!event) return null;

  const displayUri = preview || event.cover_photo || null;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPreview(asset.uri);
      const ext = asset.uri.split('.').pop() || 'jpg';
      setFileMeta({
        uri: asset.uri,
        name: `invitation.${ext}`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleSave = async () => {
    if (!fileMeta) {
      Alert.alert('Required', 'Please choose an invitation image first');
      return;
    }
    setUploading(true);
    try {
      const res = await eventsApi.uploadCover(event.id, fileMeta);
      await reload();
      Alert.alert('Saved', 'Invitation image uploaded successfully');
      setPreview(res.url || preview);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Could not upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Invitation Upload" onBack={() => navigation.goBack()} />
      <SafeScreen>
        <Text style={styles.desc}>Upload the invitation card for this function. It will be shown on the guest payment page.</Text>
        <EventContextCard event={event} />

        <Text style={styles.label}>Upload Invitation *</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
          <Text style={styles.uploadTitle}>Tap to choose invitation image</Text>
          <View style={styles.chooseBtn}>
            <Ionicons name="folder-open-outline" size={16} color={colors.primary} />
            <Text style={styles.chooseText}>Choose File</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.formats}>Supported formats: JPG, PNG · Max size: 10MB</Text>

        {displayUri ? (
          <>
            <View style={styles.previewHeader}>
              <Text style={styles.label}>Preview</Text>
              <TouchableOpacity onPress={pickImage}><Text style={styles.replace}>Replace</Text></TouchableOpacity>
            </View>
            <Image source={{ uri: displayUri }} style={styles.preview} resizeMode="contain" />
          </>
        ) : null}

        <View style={styles.guidelines}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <View>
            <Text style={styles.guideTitle}>Guidelines</Text>
            <Text style={styles.guideItem}>• Upload a clear and readable invitation image</Text>
            <Text style={styles.guideItem}>• This image will be shown to your guests</Text>
          </View>
        </View>

        <Button title="Save Invitation" onPress={handleSave} loading={uploading} />
      </SafeScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  desc: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold, marginBottom: spacing.sm },
  uploadBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.lg, padding: spacing.xxxl, alignItems: 'center', backgroundColor: colors.primaryLight },
  uploadTitle: { fontSize: fontSize.sm, color: colors.text, marginTop: spacing.md, fontWeight: '600' },
  chooseBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, marginTop: spacing.md },
  chooseText: { color: colors.primary, fontWeight: '600' },
  formats: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  replace: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  preview: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.border, marginBottom: spacing.lg },
  guidelines: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.primaryLight, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg },
  guideTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 4 },
  guideItem: { fontSize: fontSize.sm, color: colors.textSecondary },
});
