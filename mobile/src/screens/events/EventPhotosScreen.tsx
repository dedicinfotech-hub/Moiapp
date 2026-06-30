import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { EventHubLayout } from '../../components/event/EventHubLayout';
import { useScreenSlug } from '../../hooks/useScreenSlug';
import { useEvent } from '../../hooks/useEvent';
import { photosApi } from '../../api';
import { uploadFileFromImageAsset } from '../../api/upload';
import type { Photo } from '../../api/photos';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, fontSize, radius, spacing } from '../../theme';

export function EventPhotosScreen() {
  const slug = useScreenSlug();
  const { event } = useEvent(slug);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);

  const load = useCallback(() => {
    if (!event) return;
    photosApi.list(event.id).then(setPhotos).catch(() => setPhotos([]));
  }, [event?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pickAndUpload = async () => {
    if (!event) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const res = await photosApi.upload(event.id, uploadFileFromImageAsset(asset, 'photo'), caption);
      setCaption('');
      load();
      Alert.alert('Uploaded', 'Photo added successfully');
      if (res.url) {
        setPhotos((p) => [{ id: res.id, event_id: event.id, s3_key: '', s3_url: res.url, caption, uploaded_at: new Date().toISOString() }, ...p]);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (photo: Photo) => {
    Alert.alert('Delete Photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await photosApi.delete(photo.id);
            setPhotos((p) => p.filter((x) => x.id !== photo.id));
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <EventHubLayout slug={slug} activeTab="photos">
      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={styles.title}>Upload Photos</Text>
            <Input label="Caption (optional)" value={caption} onChangeText={setCaption} placeholder="Caption" />
            <TouchableOpacity style={styles.uploadBox} onPress={pickAndUpload} disabled={uploading}>
              <Ionicons name="cloud-upload-outline" size={36} color={colors.primary} />
              <Text style={styles.uploadText}>{uploading ? 'Uploading…' : 'Tap to upload photo'}</Text>
              <Text style={styles.formats}>JPG, PNG, WEBP · Max 10MB</Text>
            </TouchableOpacity>
            <Text style={styles.count}>{photos.length} photo(s)</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No photos yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.photoCard} onPress={() => setPreview(item)} onLongPress={() => handleDelete(item)}>
            <Image source={{ uri: item.s3_url }} style={styles.photo} />
            {item.caption ? <Text style={styles.caption} numberOfLines={1}>{item.caption}</Text> : null}
          </TouchableOpacity>
        )}
      />
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setPreview(null)}>
          {preview ? <Image source={{ uri: preview.s3_url }} style={styles.previewImg} resizeMode="contain" /> : null}
        </TouchableOpacity>
      </Modal>
    </EventHubLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  uploadBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', backgroundColor: colors.primaryLight },
  uploadText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  formats: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  count: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.md },
  empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xxl },
  photoCard: { flex: 1, marginBottom: spacing.sm, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border, maxWidth: '48%' },
  photo: { width: '100%', aspectRatio: 1 },
  caption: { fontSize: 10, padding: 4, color: colors.text, backgroundColor: colors.surface },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.lg },
  previewImg: { width: '100%', height: '70%' },
});
