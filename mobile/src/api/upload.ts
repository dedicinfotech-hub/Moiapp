import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { API_BASE, getToken } from './client';

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
  /** Set on web by expo-image-picker / document-picker when available */
  file?: File | Blob;
}

export interface UploadResult {
  success?: boolean;
  url?: string;
  error?: string;
  count?: number;
  [key: string]: unknown;
}

export function uploadFileFromImageAsset(asset: ImagePickerAsset, namePrefix = 'photo'): UploadFile {
  const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
  return {
    uri: asset.uri,
    name: `${namePrefix}.${ext}`,
    type: asset.mimeType || 'image/jpeg',
    file: asset.file,
  };
}

async function appendFormFile(form: FormData, field: string, file: UploadFile): Promise<void> {
  if (file.file instanceof File) {
    form.append(field, file.file, file.name);
    return;
  }
  if (file.file instanceof Blob) {
    form.append(field, file.file, file.name);
    return;
  }
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const type = file.type || blob.type || 'application/octet-stream';
    form.append(field, new File([blob], file.name, { type }));
    return;
  }
  form.append(field, {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
}

/** Multipart POST for cover photos, CSV uploads, etc. */
export async function multipartUpload(
  path: string,
  formFields: Record<string, string>,
  fileField: string,
  file: UploadFile
): Promise<UploadResult> {
  const token = await getToken();
  const form = new FormData();

  Object.entries(formFields).forEach(([k, v]) => form.append(k, v));
  await appendFormFile(form, fileField, file);

  const url = `${API_BASE}${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { 'X-Auth-Token': `Bearer ${token}` } : {},
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as UploadResult;
  if (!res.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data;
}
