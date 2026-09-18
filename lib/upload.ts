import * as DocumentPicker from "expo-document-picker";
import api from "./api";
import * as ImagePicker from "expo-image-picker";

export interface UploadedFile {
  url: string;
  name: string;
  size: string;
  type?: string;
}

export async function pickAndUploadPDF(): Promise<UploadedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const file = result.assets[0];

  if (file.size && file.size > 16 * 1024 * 1024) {
    throw new Error("File size must be less than 16MB");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/pdf",
  } as any);

  const { data } = await api.post("/api/mobile/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    url: data.url,
    name: data.name,
    size: `${(data.size / 1024 / 1024).toFixed(2)} MB`,
  };
}

export async function pickAndUploadFile(): Promise<UploadedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/jpeg", "image/png"],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const file = result.assets[0];

  if (file.size && file.size > 32 * 1024 * 1024) {
    throw new Error("File size must be less than 32MB");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/octet-stream",
  } as any);

  const { data } = await api.post("/api/mobile/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const fileType = file.mimeType?.includes("pdf") ? "pdf" : file.mimeType?.includes("image") ? "image" : "doc";

  return {
    url: data.url,
    name: data.name,
    size: `${(data.size / 1024 / 1024).toFixed(2)} MB`,
    type: fileType,
  } as UploadedFile & { type: string };
}

export async function pickAndUploadImage(): Promise<UploadedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Permission to access photos is required");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const fileName = asset.fileName || `photo_${Date.now()}.jpg`;

  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: fileName,
    type: asset.mimeType || "image/jpeg",
  } as any);

  const { data } = await api.post("/api/mobile/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    url: data.url,
    name: data.name,
    size: `${(data.size / 1024 / 1024).toFixed(2)} MB`,
  };
}