import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { X, Upload, FileText, Trash2, Send, Sparkles } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadPDF, type UploadedFile } from "@/lib/upload";
import type { StudentAssignment, AssignmentSubmission } from "@/types";

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-background rounded-t-3xl max-h-[85%]">
            {/* Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-border">
              <View className="flex-1 pr-3">
                <Text className="text-lg font-bold text-foreground">Submit Assignment</Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{assignment.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="p-5">
              <Text className="text-sm font-semibold text-foreground mb-3">Upload Your Solution (PDF) *</Text>

              {uploadedFile ? (
                <View className="border-2 border-green-300 bg-green-50 rounded-xl p-3 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center">
                      <FileText size={20} color="#16a34a" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>{uploadedFile.name}</Text>
                      <Text className="text-xs text-muted-foreground">{uploadedFile.size}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setUploadedFile(null)} className="p-2">
                    <Trash2 size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFile}
                  disabled={uploading}
                  className="border-2 border-dashed border-border rounded-xl p-8 items-center"
                >
                  {uploading ? (
                    <>
                      <ActivityIndicator color="#6366f1" />
                      <Text className="text-indigo-500 font-medium text-sm mt-2">Uploading…</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={32} color="#9ca3af" />
                      <Text className="text-muted-foreground text-sm mt-2">Tap to upload your solution PDF</Text>
                      <Text className="text-muted-foreground text-xs mt-1">PDF only (Max 16MB)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text className="text-sm font-semibold text-foreground mt-5 mb-2">Remarks (Optional)</Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Add any notes about your submission…"
                multiline
                numberOfLines={3}
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                style={{ textAlignVertical: "top", minHeight: 80 }}
              />

              <View className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3 mt-4 flex-row gap-2.5">
                <Sparkles size={16} color="#6366f1" style={{ marginTop: 2 }} />
                <Text className="text-xs text-indigo-700 flex-1">
                  Make sure your PDF is clear and readable. You can discuss solutions with classmates in the comments!
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View className="flex-row gap-3 p-5 border-t border-border">
              <TouchableOpacity onPress={onClose} className="flex-1 border-2 border-border rounded-xl py-3 items-center">
                <Text className="font-semibold text-foreground text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!uploadedFile || submitting || uploading}
                className="flex-1 bg-indigo-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
                style={{ opacity: !uploadedFile || submitting || uploading ? 0.5 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Send size={16} color="#fff" />
                    <Text className="text-white font-semibold text-sm">Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}