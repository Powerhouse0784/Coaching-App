import { useState, type ReactNode } from "react";
import {
  View, Text, TextInput, Modal, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, Pressable,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { X, Link as LinkIcon, Play, Globe, Lock, Save } from "lucide-react-native";
import api from "@/lib/api";
import type { TeacherVideoFolder } from "@/types";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

interface Props {
  visible: boolean;
  mode: "create" | "edit";
  folder?: TeacherVideoFolder | null;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldStyle = {
  borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
  paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
  fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface,
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
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
        name, subject, class: className, chapter, description, thumbnailUrl,
        youtubePlaylistId: youtubePlaylistId.trim() || null,
        isPublic,
      };
      const { data } = isEdit
        ? await api.patch(`/api/teacher/video-folders/${folder!.id}`, payload)
        : await api.post("/api/teacher/video-folders", payload);

      if (data.error) Alert.alert("Error", data.error);
      else onSuccess();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: "rgba(23,25,35,0.6)", justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View
            entering={SlideInDown.duration(280).springify().damping(18)}
            style={{ backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "88%" }}
          >
            <View style={{ alignItems: "center", paddingTop: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <Text style={{ ...type.h3, fontSize: 17, color: colors.ink }}>{isEdit ? "Edit Folder" : "Create New Folder"}</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 1 }}>{isEdit ? "Update folder details" : "Fill in details for your new folder"}</Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={onClose} style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
                <X size={18} color={colors.inkMuted} />
              </AnimatedPressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
              <Field label="Folder Name *">
                <TextInput value={name} onChangeText={setName} placeholder="e.g., Wave Optics Complete" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
              </Field>
              <Field label="Subject *">
                <TextInput value={subject} onChangeText={setSubject} placeholder="e.g., Physics, Chemistry" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
              </Field>
              <Field label="Class *">
                <TextInput value={className} onChangeText={setClassName} placeholder="e.g., 12th, JEE, NEET" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
              </Field>
              <Field label="Chapter *">
                <TextInput value={chapter} onChangeText={setChapter} placeholder="e.g., Chapter 10 - Wave Optics" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
              </Field>
              <Field label="Description">
                <TextInput
                  value={description} onChangeText={setDescription} placeholder="Brief description…" placeholderTextColor={colors.inkFaint}
                  multiline numberOfLines={3} style={[fieldStyle, { textAlignVertical: "top", minHeight: 70 }]}
                />
              </Field>

              <Field label="Thumbnail Image URL">
                <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.surface }}>
                  <LinkIcon size={15} color={colors.inkFaint} />
                  <TextInput
                    value={thumbnailUrl}
                    onChangeText={(v) => { setThumbnailUrl(v); setThumbError(false); }}
                    placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
                    placeholderTextColor={colors.inkFaint}
                    autoCapitalize="none"
                    style={{ flex: 1, paddingVertical: 10, paddingHorizontal: spacing.sm, color: colors.ink, fontFamily: fonts.body, fontSize: 13.5 }}
                  />
                </View>
                <Text style={{ ...type.caption, color: colors.inkFaint, marginTop: 6 }}>Paste any image URL. Leave blank to auto-use the first video's thumbnail.</Text>
                {thumbnailUrl ? (
                  <View style={{ height: 130, borderRadius: radius.md, overflow: "hidden", borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, marginTop: spacing.sm }}>
                    {!thumbError ? (
                      <Image source={{ uri: thumbnailUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" onError={() => setThumbError(true)} />
                    ) : (
                      <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted }}>
                        <Text style={{ ...type.caption, color: colors.inkMuted }}>Couldn't load this image</Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </Field>

              <Field label="YouTube Playlist ID (optional)">
                <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.surface }}>
                  <Play size={14} color={colors.coral} />
                  <TextInput
                    value={youtubePlaylistId}
                    onChangeText={setYoutubePlaylistId}
                    placeholder="e.g. PLxxxxxxxxxxxxxxxxxxxx"
                    placeholderTextColor={colors.inkFaint}
                    autoCapitalize="none"
                    style={{ flex: 1, paddingVertical: 10, paddingHorizontal: spacing.sm, color: colors.ink, fontFamily: fonts.body, fontSize: 13.5 }}
                  />
                </View>
                <Text style={{ ...type.caption, color: colors.inkFaint, marginTop: 6 }}>From a playlist URL: youtube.com/playlist?list=THIS_PART</Text>
              </Field>

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: spacing.sm }}>Visibility</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <AnimatedPressable
                  pressScale={0.97}
                  onPress={() => setIsPublic(true)}
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: isPublic ? colors.indigo : colors.border, backgroundColor: isPublic ? colors.indigoTint : colors.surface }}
                >
                  <Globe size={16} color={colors.mint} />
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink }}>Public</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  pressScale={0.97}
                  onPress={() => setIsPublic(false)}
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: !isPublic ? colors.indigo : colors.border, backgroundColor: !isPublic ? colors.indigoTint : colors.surface }}
                >
                  <Lock size={16} color={colors.gold} />
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink }}>Private</Text>
                </AnimatedPressable>
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Button label="Cancel" variant="ghost" onPress={onClose} disabled={busy} style={{ flex: 1 }} />
              <Button label={isEdit ? "Update Folder" : "Create Folder"} icon={Save} onPress={handleSubmit} disabled={busy} loading={busy} style={{ flex: 1 }} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
