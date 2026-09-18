import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image, Switch,
} from "react-native";
import { X, Upload, FileText, Trash2, CheckCircle, ImageIcon } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadFile, pickAndUploadImage } from "@/lib/upload";
import type { TeacherNote } from "@/types";

interface Props {
  visible: boolean;
  mode: "create" | "edit";
  note?: TeacherNote | null;
  onClose: () => void;
  onSuccess: (note: TeacherNote) => void;
}

export default function NoteFormModal({ visible, mode, note, onClose, onSuccess }: Props) {
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(note?.title ?? "");
  const [description, setDescription] = useState(note?.description ?? "");
  const [subject, setSubject] = useState(note?.subject ?? "");
  const [className, setClassName] = useState(note?.class ?? "");
  const [topic, setTopic] = useState(note?.topic ?? "");
  const [chapter, setChapter] = useState(note?.chapter ?? "");
  const [price, setPrice] = useState(String(note?.price ?? 30));
  const [isPublished, setIsPublished] = useState(note?.isPublished ?? true);
  const [isPinned, setIsPinned] = useState(note?.isPinned ?? false);

  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string; type: string } | null>(
    note ? { url: note.fileUrl, name: note.fileName, size: note.fileSize, type: note.fileType } : null
  );
  const [uploadedThumb, setUploadedThumb] = useState<{ url: string; name: string } | null>(
    note?.thumbnailUrl ? { url: note.thumbnailUrl, name: "Current thumbnail" } : null
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickFile = async () => {
    setUploadingFile(true);
    try {
      const file: any = await pickAndUploadFile();
      if (file) setUploadedFile({ url: file.url, name: file.name, size: file.size, type: file.type || "pdf" });
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePickThumb = async () => {
    setUploadingThumb(true);
    try {
      const file = await pickAndUploadImage();
      if (file) setUploadedThumb({ url: file.url, name: file.name });
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !subject.trim() || !className.trim() || !uploadedFile) {
      Alert.alert("Missing info", "Please fill in all required fields and upload a file");
      return;
    }
    const priceNum = parseInt(price, 10) || 0;
    if (priceNum < 0) {
      Alert.alert("Invalid price", "Price cannot be negative");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title,
        description: description || null,
        subject,
        class: className,
        topic: topic || null,
        chapter: chapter || null,
        fileUrl: uploadedFile.url,
        fileName: uploadedFile.name,
        fileType: uploadedFile.type,
        fileSize: uploadedFile.size,
        thumbnailUrl: uploadedThumb?.url || null,
        price: priceNum,
        isPublished,
        isPinned,
      };
      if (isEdit) payload.noteId = note!.id;

      const { data } = await api.request({
        url: "/api/teacher/notes",
        method: isEdit ? "PUT" : "POST",
        data: payload,
      });

      if (data.success) {
        onSuccess(data.note);
      } else {
        Alert.alert("Error", data.error || `Failed to ${isEdit ? "update" : "upload"} note`);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = saving || uploadingFile;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: "90%" }}>
            <View className="flex-row items-center justify-between p-5 border-b border-border">
              <View>
                <Text className="text-lg font-bold text-foreground">{isEdit ? "Edit Note" : "Upload New Note"}</Text>
                <Text className="text-xs text-muted-foreground">
                  {isEdit ? "Update details below" : "Fill in details and upload your file"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Organic Chemistry Chapter 5"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <Text className="text-sm font-semibold text-foreground mb-1.5">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of the note content…"
                multiline
                numberOfLines={3}
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
                style={{ textAlignVertical: "top", minHeight: 70 }}
              />

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Subject *</Text>
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="e.g., Chemistry"
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

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Topic</Text>
                  <TextInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g., Alcohols and Phenols"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Chapter</Text>
                  <TextInput
                    value={chapter}
                    onChangeText={setChapter}
                    placeholder="e.g., Chapter 11"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
              </View>

              <Text className="text-sm font-semibold text-foreground mb-1.5">Hardcopy Price (₹) *</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="30"
                keyboardType="number-pad"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-1"
              />
              <Text className="text-xs text-muted-foreground mb-4">Price when students order a physical hardcopy. Default ₹30.</Text>

              <Text className="text-sm font-semibold text-foreground mb-2">Upload File (PDF or Image) *</Text>
              {uploadedFile ? (
                <View className="border-2 border-green-300 bg-green-50 rounded-xl p-3 flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                      <FileText size={18} color="#16a34a" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>{uploadedFile.name}</Text>
                      <Text className="text-xs text-muted-foreground">{uploadedFile.size} · {uploadedFile.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <CheckCircle size={18} color="#22c55e" />
                    <TouchableOpacity onPress={() => setUploadedFile(null)}>
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickFile}
                  disabled={isBusy}
                  className="border-2 border-dashed border-border rounded-xl p-6 items-center mb-4"
                >
                  {uploadingFile ? (
                    <>
                      <ActivityIndicator color="#9333ea" />
                      <Text className="text-purple-600 font-medium text-sm mt-2">Uploading…</Text>
                    </>
                  ) : (
                    <>
                      <Upload size={28} color="#9ca3af" />
                      <Text className="font-semibold text-sm text-foreground mt-2">Tap to upload file</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">PDF or Image · Max 32MB</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text className="text-sm font-semibold text-foreground mb-2">Thumbnail (Optional)</Text>
              {uploadedThumb ? (
                <View className="border-2 border-green-300 bg-green-50 rounded-xl p-3 flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <Image source={{ uri: uploadedThumb.url }} className="w-11 h-11 rounded-xl" />
                    <Text className="font-semibold text-sm text-foreground flex-1" numberOfLines={1}>{uploadedThumb.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setUploadedThumb(null)}>
                    <Trash2 size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickThumb}
                  disabled={uploadingThumb}
                  className="border-2 border-dashed border-border rounded-xl p-4 items-center mb-4"
                >
                  {uploadingThumb ? (
                    <ActivityIndicator color="#9333ea" size="small" />
                  ) : (
                    <>
                      <ImageIcon size={22} color="#9ca3af" />
                      <Text className="text-xs text-muted-foreground mt-1.5">Upload cover image · Max 4MB</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View className="bg-secondary rounded-xl p-4 gap-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-semibold text-foreground">Publish immediately</Text>
                    <Text className="text-xs text-muted-foreground">Students can see this note right away</Text>
                  </View>
                  <Switch value={isPublished} onValueChange={setIsPublished} trackColor={{ true: "#9333ea" }} />
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-semibold text-foreground">Pin to top</Text>
                    <Text className="text-xs text-muted-foreground">This note appears first in the list</Text>
                  </View>
                  <Switch value={isPinned} onValueChange={setIsPinned} trackColor={{ true: "#9333ea" }} />
                </View>
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
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Upload size={16} color="#fff" />
                    <Text className="text-white font-semibold text-sm">{isEdit ? "Save Changes" : "Upload Note"}</Text>
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