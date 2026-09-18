import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Image, Linking,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Send, Paperclip, ImageIcon, FileText, Download,
  Trash2, RefreshCw, Bot, User as UserIcon, Copy, Check,
  Sparkles, Zap, Info, PenTool, ListChecks, Lightbulb, Calculator,
  Beaker, Globe, GraduationCap,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { pickAndUploadImage, pickAndUploadFile } from "@/lib/upload";
import type { AIAssistantMessage } from "@/types";

const QUICK_ACTIONS = [
  { icon: PenTool, label: "Create Lesson Plan", prompt: "Create a detailed lesson plan for [subject] for [grade] students on the topic of [topic]", color: "#3b82f6" },
  { icon: ListChecks, label: "Generate Quiz", prompt: "Generate a 10-question multiple choice quiz on [topic] for [grade] level students", color: "#a855f7" },
  { icon: FileText, label: "Design Assignment", prompt: "Design a creative assignment on [topic] that encourages critical thinking for [grade] students", color: "#22c55e" },
  { icon: Lightbulb, label: "Teaching Strategy", prompt: "Suggest innovative teaching strategies to make [topic] more engaging for students", color: "#f97316" },
  { icon: Calculator, label: "Math Problem", prompt: "Create practice problems with solutions for [math topic] at [grade] level", color: "#6366f1" },
  { icon: Beaker, label: "Science Experiment", prompt: "Suggest a safe, engaging science experiment to demonstrate [concept] for [grade] students", color: "#14b8a6" },
  { icon: Globe, label: "Explain Concept", prompt: "Explain [complex topic] in simple terms suitable for [grade] level students", color: "#ec4899" },
  { icon: GraduationCap, label: "Study Guide", prompt: "Create a comprehensive study guide for [topic] covering key concepts, definitions, and practice questions", color: "#eab308" },
];

export default function TeacherAIAssistantScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<AIAssistantMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string; size: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const listRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get("/api/teacher/ai-assistant");
      if (data.success) {
        const withRoles = data.messages.map((msg: AIAssistantMessage, i: number) => ({ ...msg, isAI: i % 2 === 1 }));
        setMessages(withRoles);
        if (withRoles.length > 0) setShowQuickActions(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handlePickImage = async () => {
    setUploadingImage(true);
    try {
      const file = await pickAndUploadImage();
      if (file) setUploadedFile({ url: file.url, name: file.name, type: "image", size: file.size });
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
      if (file) setUploadedFile({ url: file.url, name: file.name, type: file.type || "pdf", size: file.size });
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !uploadedFile) return;
    setSending(true);
    setShowQuickActions(false);
    try {
      const history = messages.map((m) => ({ role: m.isAI ? "assistant" : "user", content: m.content }));
      const { data } = await api.post("/api/teacher/ai-assistant", {
        content: inputText,
        fileUrl: uploadedFile?.url,
        fileName: uploadedFile?.name,
        fileType: uploadedFile?.type,
        fileSize: uploadedFile?.size,
        conversationHistory: history,
      });
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { ...data.userMessage, isAI: false },
          { ...data.aiMessage, isAI: true },
        ]);
        setInputText("");
        setUploadedFile(null);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        Alert.alert("Error", data.error || "Failed to send message");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert("Clear chat history?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            const { data } = await api.delete("/api/teacher/ai-assistant");
            if (data.success) {
              setMessages([]);
              setShowQuickActions(true);
            }
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to clear chat history");
          }
        },
      },
    ]);
  };

  const handleCopy = (text: string, id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loadingMessages) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-muted-foreground mt-3">Loading EduGenius…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="bg-indigo-600 px-5 pt-2 pb-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center">
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
            <Bot size={18} color="#fff" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-white font-bold text-base">EduGenius AI</Text>
              <Sparkles size={13} color="#fde047" />
            </View>
            <Text className="text-indigo-100 text-xs">Your intelligent teaching assistant</Text>
          </View>
          <TouchableOpacity onPress={fetchMessages} className="w-9 h-9 bg-white/15 rounded-lg items-center justify-center mr-1.5">
            <RefreshCw size={15} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearChat} className="w-9 h-9 bg-white/15 rounded-lg items-center justify-center">
            <Trash2 size={15} color="#fff" />
          </TouchableOpacity>
        </View>

        {messages.length === 0 && showQuickActions ? (
        <FlatList
            key="quick-actions-grid"
            data={QUICK_ACTIONS}
            keyExtractor={(a) => a.label}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ padding: 20, gap: 10 }}
            ListHeaderComponent={
              <View className="items-center mb-5">
                <View className="w-16 h-16 bg-indigo-500 rounded-2xl items-center justify-center mb-3">
                  <Bot size={30} color="#fff" />
                </View>
                <Text className="text-lg font-bold text-foreground text-center">Welcome to EduGenius AI! 👋</Text>
                <Text className="text-sm text-muted-foreground text-center mt-1.5">
                  Try a quick action below or ask me anything
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setInputText(item.prompt); setShowQuickActions(false); }}
                className="flex-1 bg-card rounded-2xl border border-border p-3.5"
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mb-2.5" style={{ backgroundColor: `${item.color}20` }}>
                  <item.icon size={16} color={item.color} />
                </View>
                <Text className="font-bold text-foreground text-sm mb-1">{item.label}</Text>
                <Text className="text-[11px] text-muted-foreground" numberOfLines={2}>{item.prompt}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <View className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3.5 mt-2">
                <View className="flex-row items-center gap-2 mb-2">
                  <Info size={14} color="#2563eb" />
                  <Text className="font-bold text-xs text-blue-900">Pro Tips</Text>
                </View>
                {[
                  "Upload images or PDFs for help with visual content",
                  "Be specific with grade level and subject",
                  "Ask follow-up questions to refine content",
                ].map((tip, i) => (
                  <View key={i} className="flex-row items-start gap-1.5 mb-1">
                    <Zap size={11} color="#2563eb" style={{ marginTop: 2 }} />
                    <Text className="text-xs text-blue-700 flex-1">{tip}</Text>
                  </View>
                ))}
              </View>
            }
          />
        ) : (
          <FlatList
            key="messages-list"
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item: msg }) => (
              <View className={`flex-row gap-2.5 mb-4 ${msg.isAI ? "" : "flex-row-reverse"}`}>
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: msg.isAI ? "#6366f1" : "#0ea5e9" }}
                >
                  {msg.isAI ? <Bot size={16} color="#fff" /> : <UserIcon size={16} color="#fff" />}
                </View>
                <View
                  className="rounded-2xl p-3.5"
                  style={{
                    maxWidth: "78%",
                    backgroundColor: msg.isAI ? "#f9fafb" : "#0ea5e9",
                  }}
                >
                  <View className="flex-row items-center justify-between gap-2 mb-1.5">
                    <Text className="font-semibold text-xs" style={{ color: msg.isAI ? "#111827" : "#fff" }}>
                      {msg.isAI ? "EduGenius AI" : "You"}
                    </Text>
                    <Text className="text-[10px]" style={{ color: msg.isAI ? "#9ca3af" : "#bae6fd" }}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>

                  {msg.fileUrl && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(msg.fileUrl!)}
                      className="flex-row items-center gap-2 rounded-xl p-2.5 mb-2"
                      style={{ backgroundColor: msg.isAI ? "#f3f4f6" : "#0284c7" }}
                    >
                      {msg.fileType === "image" ? (
                        <ImageIcon size={16} color={msg.isAI ? "#4b5563" : "#e0f2fe"} />
                      ) : (
                        <FileText size={16} color={msg.isAI ? "#4b5563" : "#e0f2fe"} />
                      )}
                      <View className="flex-1">
                        <Text className="text-xs font-medium" style={{ color: msg.isAI ? "#111827" : "#fff" }} numberOfLines={1}>
                          {msg.fileName}
                        </Text>
                        <Text className="text-[10px]" style={{ color: msg.isAI ? "#6b7280" : "#bae6fd" }}>{msg.fileSize}</Text>
                      </View>
                      <Download size={13} color={msg.isAI ? "#4b5563" : "#e0f2fe"} />
                    </TouchableOpacity>
                  )}

                  <Text className="text-sm leading-relaxed" style={{ color: msg.isAI ? "#374151" : "#fff" }}>
                    {msg.content}
                  </Text>

                  {msg.isAI && (
                    <TouchableOpacity
                      onPress={() => handleCopy(msg.content, msg.id)}
                      className="flex-row items-center gap-1.5 bg-secondary rounded-lg px-2.5 py-1.5 self-start mt-2.5"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={12} color="#22c55e" />
                          <Text className="text-xs font-medium text-foreground">Copied!</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={12} color="#6b7280" />
                          <Text className="text-xs font-medium text-foreground">Copy</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListFooterComponent={
              sending ? (
                <View className="flex-row items-center gap-2.5 mb-4">
                  <View className="w-8 h-8 rounded-xl bg-indigo-600 items-center justify-center">
                    <Bot size={16} color="#fff" />
                  </View>
                  <View className="bg-secondary rounded-2xl p-3.5 flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text className="text-xs text-muted-foreground">EduGenius is thinking…</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View className="border-t border-border p-3">
          {uploadedFile && (
            <View className="flex-row items-center gap-2.5 bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-2.5">
              {uploadedFile.type === "image" ? <ImageIcon size={18} color="#2563eb" /> : <FileText size={18} color="#2563eb" />}
              <View className="flex-1">
                <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>{uploadedFile.name}</Text>
                <Text className="text-[10px] text-muted-foreground">{uploadedFile.size}</Text>
              </View>
              <TouchableOpacity onPress={() => setUploadedFile(null)}>
                <Text className="text-red-600 text-xs font-semibold">Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-end gap-2">
            <TouchableOpacity
              onPress={handlePickFile}
              disabled={uploadingFile}
              className="w-11 h-11 bg-secondary rounded-xl items-center justify-center"
            >
              {uploadingFile ? <ActivityIndicator size="small" color="#6366f1" /> : <Paperclip size={18} color="#6b7280" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploadingImage}
              className="w-11 h-11 bg-secondary rounded-xl items-center justify-center"
            >
              {uploadingImage ? <ActivityIndicator size="small" color="#6366f1" /> : <ImageIcon size={18} color="#6b7280" />}
            </TouchableOpacity>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about teaching…"
              multiline
              editable={!sending}
              className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
              style={{ maxHeight: 90 }}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || (!inputText.trim() && !uploadedFile)}
              className="w-11 h-11 bg-indigo-600 rounded-xl items-center justify-center"
              style={{ opacity: sending || (!inputText.trim() && !uploadedFile) ? 0.5 : 1 }}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-muted-foreground text-center mt-2">
            Supports images (8MB) & PDFs (16MB)
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}