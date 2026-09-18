import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { X, Upload, FileText, Trash2, Plus, AlertCircle } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadPDF, type UploadedFile } from "@/lib/upload";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CreateAssignmentModal({ visible, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setTitle(""); setDescription(""); setSubject(""); setClassName(""); setDueDate(""); setUploadedFile(null);
  };

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
    if (!title.trim() || !description.trim() || !subject.trim() || !className.trim() || !dueDate.trim()) {
      Alert.alert("Missing info", "Please fill in all required fields");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert("Invalid date", "Please enter the due date as YYYY-MM-DD");
      return;
    }
    const selected = new Date(dueDate);
    if (isNaN(selected.getTime())) {
      Alert.alert("Invalid date", "That date doesn't look right");
      return;
    }
    const today = new Date(todayISO());
    if (selected < today) {
      Alert.alert("Invalid date", "Due date cannot be in the past");
      return;
    }
    if (!uploadedFile) {
      Alert.alert("Missing file", "Please upload the assignment PDF");
      return;
    }

    setCreating(true);
    try {
      selected.setHours(23, 59, 59, 999);
      const { data } = await api.post("/api/teacher/assignments", {
        title,
        description,
        subject,
        class: className,
        dueDate: selected.toISOString(),
        fileUrl: uploadedFile.url,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
      });
      if (data.success) {
        reset();
        onSuccess();
      } else {
        Alert.alert("Error", data.error || "Failed to create assignment");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const isBusy = creating || uploading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: "88%" }}>
            <View className="flex-row items-center justify-between p-5 border-b border-border">
              <Text className="text-lg font-bold text-foreground">Create New Assignment</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Assignment Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Chapter 5 - Thermodynamics Problems"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Description *</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the assignment…"
                multiline
                numberOfLines={4}
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
                style={{ textAlignVertical: "top", minHeight: 90 }}
              />

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Subject *</Text>
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="e.g., Physics"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Class *</Text>
                  <TextInput
                    value={className}
                    onChangeText={setClassName}
                    placeholder="e.g., Class 12"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
              </View>

              <Text className="text-sm font-semibold text-foreground mb-1.5">Due Date * (YYYY-MM-DD)</Text>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder={todayISO()}
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-1"
              />
              <Text className="text-xs text-muted-foreground mb-4">Due date must be today or in the future</Text>

              <Text className="text-sm font-semibold text-foreground mb-2">Assignment File (PDF) *</Text>
              {uploadedFile ? (
                <View className="border-2 border-green-300 bg-green-50 rounded-xl p-3 flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                      <FileText size={18} color="#16a34a" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>{uploadedFile.name}</Text>
                      <Text className="text-xs text-muted-foreground">{uploadedFile.size}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setUploadedFile(null)}>
                    <Trash2 size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFile}
                  disabled={isBusy}
                  className="border-2 border-dashed border-border rounded-xl p-6 items-center mb-4"
                >
                  {uploading ? (
                    <>
                      <ActivityIndicator color="#9333ea" />
                      <Text className="text-purple-600 font-medium text-sm mt-2">Uploading…</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={28} color="#9ca3af" />
                      <Text className="font-semibold text-sm text-foreground mt-2">Tap to upload assignment PDF</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">PDF only · Max 16MB · Required</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View className="flex-row gap-2.5 bg-purple-50 border-2 border-purple-200 rounded-xl p-3.5 mb-2">
                <AlertCircle size={16} color="#7c3aed" style={{ marginTop: 2 }} />
                <Text className="text-xs text-purple-700 flex-1">
                  Students will submit their answers as PDF files and can discuss solutions in comments.
                </Text>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 p-5 border-t border-border">
              <TouchableOpacity onPress={onClose} className="flex-1 border-2 border-border rounded-xl py-3 items-center">
                <Text className="font-semibold text-foreground text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isBusy || !uploadedFile}
                className="flex-1 bg-purple-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
                style={{ opacity: isBusy || !uploadedFile ? 0.5 : 1 }}
              >
                {creating ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Plus size={16} color="#fff" />
                    <Text className="text-white font-semibold text-sm">Create Assignment</Text>
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