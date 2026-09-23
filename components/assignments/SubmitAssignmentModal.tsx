import { useState } from "react";
import {
  View, Text, TextInput, Modal, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { X, Upload, FileText, Trash2, Send, Sparkles } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadPDF, type UploadedFile } from "@/lib/upload";
import type { StudentAssignment, AssignmentSubmission } from "@/types";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

interface Props {
  visible: boolean;
  assignment: StudentAssignment | null;
  onClose: () => void;
  onSuccess: (assignmentId: string, submission: AssignmentSubmission) => void;
}

export default function SubmitAssignmentModal({ visible, assignment, onClose, onSuccess }: Props) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [remarks, setRemarks] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!assignment) return null;

  const handlePickFile = async () => {
    setUploading(true);
    try {
      const file = await pickAndUploadPDF();
      if (file) setUploadedFile(file);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      Alert.alert("Missing file", "Please upload your assignment PDF");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/student/assignments", {
        assignmentId: assignment.id,
        fileUrl: uploadedFile.url,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        remarks: remarks || null,
      });
      if (data.success) {
        onSuccess(assignment.id, data.submission);
        setUploadedFile(null);
        setRemarks("");
      } else {
        Alert.alert("Failed to submit", data.error || "Unknown error");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "An error occurred while submitting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: "rgba(23,25,35,0.6)", justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View
            entering={SlideInDown.duration(280).springify().damping(18)}
            style={{
              backgroundColor: colors.paper,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight: "85%",
            }}
          >
            {/* Grabber */}
            <View style={{ alignItems: "center", paddingTop: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={{ ...type.h3, fontSize: 17, color: colors.ink }}>Submit Assignment</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }} numberOfLines={1}>
                  {assignment.title}
                </Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={onClose} style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
                <X size={18} color={colors.inkMuted} />
              </AnimatedPressable>
            </View>

            <View style={{ padding: spacing.lg }}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink, marginBottom: spacing.md }}>
                Upload Your Solution (PDF) *
              </Text>

              {uploadedFile ? (
                <View style={{ backgroundColor: colors.mintTint, borderRadius: radius.md, padding: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <View style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: "rgba(47,143,91,0.16)", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={19} color={colors.mint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }} numberOfLines={1}>{uploadedFile.name}</Text>
                      <Text style={{ ...type.caption, color: colors.inkMuted }}>{uploadedFile.size}</Text>
                    </View>
                  </View>
                  <AnimatedPressable pressScale={0.9} onPress={() => setUploadedFile(null)} style={{ padding: 8 }}>
                    <Trash2 size={18} color={colors.coral} />
                  </AnimatedPressable>
                </View>
              ) : (
                <AnimatedPressable
                  onPress={handlePickFile}
                  disabled={uploading}
                  style={{
                    borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border,
                    borderRadius: radius.md, paddingVertical: 32, alignItems: "center",
                  }}
                >
                  {uploading ? (
                    <>
                      <ActivityIndicator color={colors.indigo} />
                      <Text style={{ color: colors.indigo, fontFamily: fonts.bodyMedium, fontSize: 13.5, marginTop: 8 }}>Uploading…</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={30} color={colors.inkFaint} />
                      <Text style={{ ...type.body, fontSize: 13.5, color: colors.inkMuted, marginTop: 8 }}>Tap to upload your solution PDF</Text>
                      <Text style={{ ...type.caption, color: colors.inkFaint, marginTop: 2 }}>PDF only (Max 16MB)</Text>
                    </>
                  )}
                </AnimatedPressable>
              )}

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm }}>
                Remarks (Optional)
              </Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Add any notes about your submission…"
                placeholderTextColor={colors.inkFaint}
                multiline
                numberOfLines={3}
                style={{
                  borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                  paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
                  fontFamily: fonts.body, fontSize: 14, textAlignVertical: "top", minHeight: 80,
                  backgroundColor: colors.surface,
                }}
              />

              <View style={{ flexDirection: "row", gap: 10, backgroundColor: colors.indigoTint, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }}>
                <Sparkles size={16} color={colors.indigo} style={{ marginTop: 2 }} />
                <Text style={{ ...type.caption, color: colors.indigoDark, flex: 1, lineHeight: 17 }}>
                  Make sure your PDF is clear and readable. You can discuss solutions with classmates in the comments!
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Button label="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button
                label="Submit"
                icon={Send}
                onPress={handleSubmit}
                disabled={!uploadedFile || submitting || uploading}
                loading={submitting}
                style={{ flex: 1 }}
              />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
