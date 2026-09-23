import { useState } from "react";
import {
  View, Text, TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Image, Pressable,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { X, Send, ImageIcon, FileText, Trash2 } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadImage, pickAndUploadPDF, type UploadedFile } from "@/lib/upload";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITIES = [
  { value: "low", label: "Low", tone: "success" as const },
  { value: "normal", label: "Normal", tone: "brand" as const },
  { value: "high", label: "High", tone: "gold" as const },
  { value: "urgent", label: "Urgent", tone: "danger" as const },
];

const TONE_BG: Record<string, string> = {
  success: colors.mintTint,
  brand: colors.indigoTint,
  gold: colors.goldTint,
  danger: colors.coralTint,
};
const TONE_TEXT: Record<string, string> = {
  success: colors.mint,
  brand: colors.indigo,
  gold: colors.gold,
  danger: colors.coral,
};

export default function AskDoubtModal({ visible, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<UploadedFile | null>(null);
  const [pdf, setPdf] = useState<UploadedFile | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setSubject(""); setPriority("normal"); setDescription("");
    setImage(null); setPdf(null);
  };

  const handlePickImage = async () => {
    setUploadingImage(true);
    try {
      const file = await pickAndUploadImage();
      if (file) setImage(file);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickPdf = async () => {
    setUploadingPdf(true);
    try {
      const file = await pickAndUploadPDF();
      if (file) setPdf(file);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !subject.trim()) {
      Alert.alert("Missing info", "Please fill in title, subject, and description");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/doubts", {
        title, description, subject, priority,
        imageUrl: image?.url || null,
        imageName: image?.name || null,
        pdfUrl: pdf?.url || null,
        pdfName: pdf?.name || null,
      });
      if (data.success) {
        reset();
        onSuccess();
      } else {
        Alert.alert("Failed to post", data.error || "Unknown error");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = !!title.trim() && !!description.trim() && !!subject.trim();

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
              <Text style={{ ...type.h3, fontSize: 17, color: colors.ink }}>Ask a Doubt</Text>
              <AnimatedPressable pressScale={0.9} onPress={onClose} style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
                <X size={18} color={colors.inkMuted} />
              </AnimatedPressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Brief summary…"
                placeholderTextColor={colors.inkFaint}
                style={{
                  borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                  paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
                  fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface, marginBottom: spacing.lg,
                }}
              />

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Subject *</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g., Mathematics, Physics…"
                placeholderTextColor={colors.inkFaint}
                style={{
                  borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                  paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
                  fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface, marginBottom: spacing.lg,
                }}
              />

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: spacing.sm }}>Priority</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.lg }}>
                {PRIORITIES.map((p) => {
                  const active = priority === p.value;
                  return (
                    <AnimatedPressable
                      key={p.value}
                      pressScale={0.95}
                      onPress={() => setPriority(p.value)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md,
                        backgroundColor: active ? TONE_BG[p.tone] : colors.surfaceMuted,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: active ? TONE_TEXT[p.tone] : colors.inkMuted }}>
                        {p.label}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Description *</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Explain your doubt in detail…"
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={4}
                style={{
                  borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                  paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
                  fontFamily: fonts.body, fontSize: 14, textAlignVertical: "top", minHeight: 100,
                  backgroundColor: colors.surface, marginBottom: spacing.lg,
                }}
              />

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: spacing.sm }}>Attachments (Optional)</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  {image ? (
                    <View>
                      <Image source={{ uri: image.url }} style={{ width: "100%", height: 96, borderRadius: radius.md }} resizeMode="cover" />
                      <AnimatedPressable
                        pressScale={0.9}
                        onPress={() => setImage(null)}
                        style={{ position: "absolute", top: 6, right: 6, backgroundColor: colors.coral, borderRadius: 999, padding: 5 }}
                      >
                        <X size={12} color={colors.white} />
                      </AnimatedPressable>
                    </View>
                  ) : (
                    <AnimatedPressable
                      onPress={handlePickImage}
                      disabled={uploadingImage}
                      style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md, height: 96, alignItems: "center", justifyContent: "center" }}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator color={colors.indigo} size="small" />
                      ) : (
                        <>
                          <ImageIcon size={20} color={colors.inkFaint} />
                          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 4 }}>Add Image</Text>
                        </>
                      )}
                    </AnimatedPressable>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  {pdf ? (
                    <View style={{ borderWidth: 1.5, borderColor: "rgba(200,79,64,0.35)", backgroundColor: colors.coralTint, borderRadius: radius.md, padding: spacing.sm, height: 96, justifyContent: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
                        <FileText size={14} color={colors.coral} />
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.coral, flex: 1 }} numberOfLines={1}>{pdf.name}</Text>
                      </View>
                      <AnimatedPressable
                        pressScale={0.95}
                        onPress={() => setPdf(null)}
                        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: colors.coral, borderRadius: radius.sm, paddingVertical: 6 }}
                      >
                        <Trash2 size={11} color={colors.white} />
                        <Text style={{ color: colors.white, fontSize: 10.5, fontFamily: fonts.bodySemibold }}>Remove</Text>
                      </AnimatedPressable>
                    </View>
                  ) : (
                    <AnimatedPressable
                      onPress={handlePickPdf}
                      disabled={uploadingPdf}
                      style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md, height: 96, alignItems: "center", justifyContent: "center" }}
                    >
                      {uploadingPdf ? (
                        <ActivityIndicator color={colors.coral} size="small" />
                      ) : (
                        <>
                          <FileText size={20} color={colors.inkFaint} />
                          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 4 }}>Add PDF</Text>
                        </>
                      )}
                    </AnimatedPressable>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button label="Post" icon={Send} onPress={handleSubmit} disabled={!isValid || submitting} loading={submitting} style={{ flex: 1 }} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
