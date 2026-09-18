import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image,
} from "react-native";
import { X, Send, ImageIcon, FileText, Trash2 } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadImage, pickAndUploadPDF, type UploadedFile } from "@/lib/upload";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITIES = [
  { value: "low", label: "Low", bg: "#dcfce7", text: "#15803d" },
  { value: "normal", label: "Normal", bg: "#dbeafe", text: "#1d4ed8" },
  { value: "high", label: "High", bg: "#ffedd5", text: "#c2410c" },
  { value: "urgent", label: "Urgent", bg: "#fee2e2", text: "#b91c1c" },
];

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: "88%" }}>
            <View className="flex-row items-center justify-between p-5 border-b border-border">
              <Text className="text-lg font-bold text-foreground">Ask a Doubt</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Brief summary…"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Subject *</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="e.g., Mathematics, Physics…"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-2">Priority</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    className="px-3.5 py-2 rounded-xl"
                    style={{ backgroundColor: priority === p.value ? p.bg : "#f3f4f6" }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: priority === p.value ? p.text : "#6b7280" }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-semibold text-foreground mb-1.5">Description *</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Explain your doubt in detail…"
                multiline
                numberOfLines={4}
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
                style={{ textAlignVertical: "top", minHeight: 100 }}
              />

              <Text className="text-sm font-semibold text-foreground mb-2">Attachments (Optional)</Text>
              <View className="flex-row gap-3 mb-2">
                {/* Image */}
                <View className="flex-1">
                  {image ? (
                    <View className="relative">
                      <Image source={{ uri: image.url }} className="w-full h-24 rounded-xl" resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => setImage(null)}
                        className="absolute top-1.5 right-1.5 bg-red-500 rounded-full p-1"
                      >
                        <X size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handlePickImage}
                      disabled={uploadingImage}
                      className="border-2 border-dashed border-border rounded-xl p-4 items-center h-24 justify-center"
                    >
                      {uploadingImage ? (
                        <ActivityIndicator color="#3b82f6" size="small" />
                      ) : (
                        <>
                          <ImageIcon size={20} color="#9ca3af" />
                          <Text className="text-xs text-muted-foreground mt-1">Add Image</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* PDF */}
                <View className="flex-1">
                  {pdf ? (
                    <View className="border-2 border-red-200 bg-red-50 rounded-xl p-3 h-24 justify-center">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <FileText size={14} color="#dc2626" />
                        <Text className="text-xs font-semibold text-red-800 flex-1" numberOfLines={1}>{pdf.name}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setPdf(null)}
                        className="flex-row items-center justify-center gap-1 bg-red-600 rounded-lg py-1.5"
                      >
                        <Trash2 size={11} color="#fff" />
                        <Text className="text-white text-[10px] font-semibold">Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handlePickPdf}
                      disabled={uploadingPdf}
                      className="border-2 border-dashed border-border rounded-xl p-4 items-center h-24 justify-center"
                    >
                      {uploadingPdf ? (
                        <ActivityIndicator color="#dc2626" size="small" />
                      ) : (
                        <>
                          <FileText size={20} color="#9ca3af" />
                          <Text className="text-xs text-muted-foreground mt-1">Add PDF</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 p-5 border-t border-border">
              <TouchableOpacity onPress={onClose} className="flex-1 border-2 border-border rounded-xl py-3 items-center">
                <Text className="font-semibold text-foreground text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !title.trim() || !description.trim() || !subject.trim()}
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
                style={{ opacity: submitting || !title.trim() || !description.trim() || !subject.trim() ? 0.5 : 1 }}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Send size={16} color="#fff" />
                    <Text className="text-white font-semibold text-sm">Post</Text>
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