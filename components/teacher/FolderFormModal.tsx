import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { X, Link as LinkIcon, Play , Globe, Lock } from "lucide-react-native";
import api from "@/lib/api";
import type { TeacherVideoFolder } from "@/types";

interface Props {
  visible: boolean;
  mode: "create" | "edit";
  folder?: TeacherVideoFolder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FolderFormModal({ visible, mode, folder, onClose, onSuccess }: Props) {
  const isEdit = mode === "edit";
  const [name, setName] = useState(folder?.name ?? "");
  const [subject, setSubject] = useState(folder?.subject ?? "");
  const [className, setClassName] = useState(folder?.class ?? "");
  const [chapter, setChapter] = useState(folder?.chapter ?? "");
  const [description, setDescription] = useState(folder?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(folder?.thumbnail ?? "");
  const [youtubePlaylistId, setYoutubePlaylistId] = useState(folder?.youtubePlaylistId ?? "");
  const [isPublic, setIsPublic] = useState(folder?.isPublic ?? true);
  const [busy, setBusy] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !subject.trim() || !className.trim() || !chapter.trim()) {
      Alert.alert("Missing info", "Please fill in all required fields");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name,
        subject,
        class: className,
        chapter,
        description,
        thumbnailUrl,
        youtubePlaylistId: youtubePlaylistId.trim() || null,
        isPublic,
      };
      const { data } = isEdit
        ? await api.patch(`/api/teacher/video-folders/${folder!.id}`, payload)
        : await api.post("/api/teacher/video-folders", payload);

      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: "88%" }}>
            <View className="flex-row items-center justify-between p-5 border-b border-border">
              <View>
                <Text className="text-lg font-bold text-foreground">{isEdit ? "Edit Folder" : "Create New Folder"}</Text>
                <Text className="text-xs text-muted-foreground">
                  {isEdit ? "Update folder details" : "Fill in details for your new folder"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Folder Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Wave Optics Complete"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Subject *</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g., Physics, Chemistry"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Class *</Text>
              <TextInput
                value={className}
                onChangeText={setClassName}
                placeholder="e.g., 12th, JEE, NEET"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Chapter *</Text>
              <TextInput
                value={chapter}
                onChangeText={setChapter}
                placeholder="e.g., Chapter 10 - Wave Optics"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description…"
                multiline
                numberOfLines={3}
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
                style={{ textAlignVertical: "top", minHeight: 70 }}
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Thumbnail Image URL</Text>
              <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-1">
                <LinkIcon size={15} color="#9ca3af" />
                <TextInput
                  value={thumbnailUrl}
                  onChangeText={(v) => { setThumbnailUrl(v); setThumbError(false); }}
                  placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
                  autoCapitalize="none"
                  className="flex-1 py-2.5 px-2 text-foreground text-sm"
                />
              </View>
              <Text className="text-xs text-muted-foreground mb-2">
                Paste any image URL. Leave blank to auto-use the first video's thumbnail.
              </Text>
              {thumbnailUrl ? (
                <View className="h-32 rounded-xl overflow-hidden border-2 border-dashed border-border mb-4">
                  {!thumbError ? (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                      onError={() => setThumbError(true)}
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-secondary">
                      <Text className="text-xs text-muted-foreground">Couldn't load this image</Text>
                    </View>
                  )}
                </View>
              ) : null}

              <Text className="text-sm font-semibold text-foreground mb-1.5">YouTube Playlist ID (optional)</Text>
              <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-1">
                <Play  size={15} color="#ef4444" />
                <TextInput
                  value={youtubePlaylistId}
                  onChangeText={setYoutubePlaylistId}
                  placeholder="e.g. PLxxxxxxxxxxxxxxxxxxxx"
                  autoCapitalize="none"
                  className="flex-1 py-2.5 px-2 text-foreground text-sm"
                />
              </View>
              <Text className="text-xs text-muted-foreground mb-4">
                From a playlist URL: youtube.com/playlist?list=THIS_PART
              </Text>

              <Text className="text-sm font-semibold text-foreground mb-2">Visibility</Text>
              <View className="flex-row gap-2.5 mb-2">
                <TouchableOpacity
                  onPress={() => setIsPublic(true)}
                  className="flex-1 flex-row items-center gap-2 p-3 rounded-xl border-2"
                  style={{ borderColor: isPublic ? "#9333ea" : "#e5e7eb", backgroundColor: isPublic ? "#faf5ff" : "transparent" }}
                >
                  <Globe size={16} color="#16a34a" />
                  <Text className="text-xs font-semibold text-foreground">Public</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsPublic(false)}
                  className="flex-1 flex-row items-center gap-2 p-3 rounded-xl border-2"
                  style={{ borderColor: !isPublic ? "#9333ea" : "#e5e7eb", backgroundColor: !isPublic ? "#faf5ff" : "transparent" }}
                >
                  <Lock size={16} color="#ea580c" />
                  <Text className="text-xs font-semibold text-foreground">Private</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 p-5 border-t border-border">
              <TouchableOpacity onPress={onClose} className="flex-1 border-2 border-border rounded-xl py-3 items-center">
                <Text className="font-semibold text-foreground text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={busy}
                className="flex-1 bg-purple-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
                style={{ opacity: busy ? 0.5 : 1 }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-sm">{isEdit ? "Update Folder" : "Create Folder"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}