import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Image, Linking,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Send, Paperclip, ImageIcon, FileText, Download,
  Users, Check, CheckCheck,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { pickAndUploadImage, pickAndUploadFile } from "@/lib/upload";
import type { TeacherChatMessage } from "@/types";

const POLL_INTERVAL_MS = 3000;

export default function TeacherChatScreen() {
  const navigation = useNavigation();

  const [messages, setMessages] = useState<TeacherChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<TeacherChatMessage[]>([]);
  messagesRef.current = messages;

  const markAsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await api.patch("/api/teacher/chat", { messageIds: ids });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get("/api/teacher/chat?limit=100");
      if (!data.success) return;
      const next: TeacherChatMessage[] = data.messages;
      const prevLength = messagesRef.current.length;
      setMessages(next);
      if (next.length !== prevLength) {
        const unread = next.filter((m) => !m.isSelf && !m.isRead).map((m) => m.id);
        if (unread.length) markAsRead(unread);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      setLoading(false);
    }
  }, [markAsRead]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  const sendMessage = async (fileUrl?: string, fileName?: string, fileType?: string, fileSize?: string) => {
    if (!text.trim() && !fileUrl) return;
    setSending(true);
    try {
      const { data } = await api.post("/api/teacher/chat", {
        content: text || "",
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
      });
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setText("");
      } else {
        Alert.alert("Error", "Failed to send message");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    setUploadingImage(true);
    try {
      const file = await pickAndUploadImage();
      if (file) await sendMessage(file.url, file.name, "image", file.size);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickFile = async () => {
    setUploadingFile(true);
    try {
      const file: any = await pickAndUploadFile();
      if (file) await sendMessage(file.url, file.name, file.type || "pdf", file.size);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingFile(false);
    }
  };

  const startEdit = (msg: TeacherChatMessage) => {
    setEditingId(msg.id);
    setEditingText(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async () => {
    if (!editingId || !editingText.trim()) return;
    setSavingEdit(true);
    try {
      const { data } = await api.put("/api/teacher/chat", { messageId: editingId, content: editingText.trim() });
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, content: editingText.trim(), updatedAt: new Date().toISOString() } : m))
        );
        cancelEdit();
      } else {
        Alert.alert("Error", "Failed to update message");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to update message");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteMessage = (id: string) => {
    Alert.alert("Delete message?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setMessages((prev) => prev.filter((m) => m.id !== id));
          try {
            await api.delete(`/api/teacher/chat?id=${id}`);
          } catch (e) {
            console.error(e);
            fetchMessages();
          }
        },
      },
    ]);
  };

  const handleLongPress = (msg: TeacherChatMessage) => {
    const buttons: any[] = [];
    if (msg.isSelf && msg.content) {
      buttons.push({ text: "Edit", onPress: () => startEdit(msg) });
    }
    if (msg.isSelf) {
      buttons.push({ text: "Delete", style: "destructive", onPress: () => deleteMessage(msg.id) });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    if (buttons.length > 1) {
      Alert.alert("Message options", undefined, buttons);
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#9333ea" />
        <Text className="text-muted-foreground mt-3">Loading messages…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="bg-purple-600 px-5 pt-2 pb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center">
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
            <Users size={18} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-base">Teacher Chat Room</Text>
            <Text className="text-purple-100 text-xs">{messages.length} messages</Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <Users size={48} color="#9ca3af" />
              <Text className="text-foreground font-bold text-base mt-3">No messages yet</Text>
              <Text className="text-muted-foreground text-sm text-center mt-1">Be the first to start the conversation!</Text>
            </View>
          }
          renderItem={({ item: msg }) => {
            const wasEdited = msg.updatedAt && msg.updatedAt !== msg.createdAt;
            const isEditing = editingId === msg.id;

            if (msg.isSelf) {
              return (
                <View className="items-end mb-3">
                  <View style={{ maxWidth: "80%" }}>
                    {msg.fileUrl && (
                      <FileBubble fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} fileSize={msg.fileSize} isSelf />
                    )}
                    {isEditing ? (
                      <View className="bg-purple-100 border-2 border-purple-300 rounded-2xl rounded-br-sm px-3.5 py-2.5">
                        <TextInput
                          value={editingText}
                          onChangeText={setEditingText}
                          multiline
                          className="text-foreground text-sm"
                          autoFocus
                        />
                        <View className="flex-row justify-end gap-2 mt-2">
                          <TouchableOpacity onPress={cancelEdit} disabled={savingEdit} className="bg-secondary px-3 py-1.5 rounded-lg">
                            <Text className="text-xs font-semibold text-foreground">Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={saveEdit}
                            disabled={savingEdit || !editingText.trim()}
                            className="bg-purple-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1"
                          >
                            {savingEdit ? <ActivityIndicator size="small" color="#fff" /> : <Check size={12} color="#fff" />}
                            <Text className="text-xs font-semibold text-white">Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : msg.content ? (
                      <TouchableOpacity
                        onLongPress={() => handleLongPress(msg)}
                        activeOpacity={0.8}
                        className="bg-purple-600 rounded-2xl px-3.5 py-2.5"
                        style={{ borderBottomRightRadius: 4 }}
                      >
                        <Text className="text-white text-sm">{msg.content}</Text>
                        {wasEdited && <Text className="text-purple-200 text-[10px] italic mt-0.5">edited</Text>}
                      </TouchableOpacity>
                    ) : null}
                    <View className="flex-row items-center justify-end gap-1.5 mt-1 px-1">
                      <Text className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</Text>
                      {msg.isRead ? <CheckCheck size={11} color="#3b82f6" /> : <Check size={11} color="#9ca3af" />}
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View className="flex-row items-start gap-2.5 mb-3">
                <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center overflow-hidden">
                  {msg.sender.avatar ? (
                    <Image source={{ uri: msg.sender.avatar }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white font-bold text-xs">{msg.sender.name?.charAt(0).toUpperCase() ?? "?"}</Text>
                  )}
                </View>
                <View style={{ maxWidth: "80%" }}>
                  <Text className="text-xs font-medium text-muted-foreground mb-1">{msg.sender.name || "Unknown"}</Text>
                  {msg.fileUrl && (
                    <FileBubble fileUrl={msg.fileUrl} fileName={msg.fileName} fileType={msg.fileType} fileSize={msg.fileSize} isSelf={false} />
                  )}
                  {msg.content ? (
                    <View className="bg-secondary rounded-2xl px-3.5 py-2.5" style={{ borderTopLeftRadius: 4 }}>
                      <Text className="text-foreground text-sm">{msg.content}</Text>
                      {wasEdited && <Text className="text-muted-foreground text-[10px] italic mt-0.5">edited</Text>}
                    </View>
                  ) : null}
                  <Text className="text-[10px] text-muted-foreground mt-1 px-1">{formatTime(msg.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />

        <View className="border-t border-border p-3 flex-row items-end gap-2">
          <TouchableOpacity
            onPress={handlePickFile}
            disabled={uploadingFile}
            className="w-11 h-11 bg-secondary rounded-xl items-center justify-center"
          >
            {uploadingFile ? <ActivityIndicator size="small" color="#9333ea" /> : <Paperclip size={18} color="#6b7280" />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploadingImage}
            className="w-11 h-11 bg-secondary rounded-xl items-center justify-center"
          >
            {uploadingImage ? <ActivityIndicator size="small" color="#9333ea" /> : <ImageIcon size={18} color="#6b7280" />}
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            multiline
            className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
            style={{ maxHeight: 90 }}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={sending || !text.trim()}
            className="w-11 h-11 bg-purple-600 rounded-xl items-center justify-center"
            style={{ opacity: sending || !text.trim() ? 0.5 : 1 }}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FileBubble({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  isSelf,
}: {
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: string | null;
  isSelf: boolean;
}) {
  if (fileType === "image") {
    return (
      <TouchableOpacity onPress={() => Linking.openURL(fileUrl)} className="mb-1.5">
        <Image source={{ uri: fileUrl }} className="rounded-xl" style={{ width: 220, height: 160 }} resizeMode="cover" />
      </TouchableOpacity>
    );
  }
  return (
    <View
      className="flex-row items-center gap-2.5 border-2 rounded-xl p-3 mb-1.5"
      style={{ backgroundColor: isSelf ? "#faf5ff" : "#f3f4f6", borderColor: isSelf ? "#e9d5ff" : "#e5e7eb" }}
    >
      <FileText size={26} color={isSelf ? "#9333ea" : "#6b7280"} />
      <View className="flex-1">
        <Text className="font-semibold text-xs text-foreground" numberOfLines={1}>{fileName}</Text>
        <Text className="text-[10px] text-muted-foreground">{fileSize}</Text>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(fileUrl)} className="w-8 h-8 bg-purple-600 rounded-lg items-center justify-center">
        <Download size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}