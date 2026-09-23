import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, FlatList, ActivityIndicator, Alert, Linking,
  KeyboardAvoidingView, Platform, ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeInLeft, FadeInRight, LinearTransition,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing,
} from "react-native-reanimated";
import {
  ArrowLeft, Send, Paperclip, ImageIcon, FileText, Download,
  Trash2, RefreshCw, Bot, User as UserIcon, Copy, Check,
  Sparkles, Zap, Info, PenTool, ListChecks, Lightbulb, Calculator,
  Beaker, Globe, GraduationCap, X,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { pickAndUploadImage, pickAndUploadFile } from "@/lib/upload";
import type { AIAssistantMessage } from "@/types";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing } from "@/constants/theme";

// Placeholder editorial photography — swap for your own abstract/tech visual before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80&auto=format&fit=crop";

type Tone = "brand" | "gold" | "success" | "danger" | "neutral";
const toneColor: Record<Tone, string> = { brand: colors.indigo, gold: colors.gold, success: colors.mint, danger: colors.coral, neutral: colors.inkMuted };
const toneTint: Record<Tone, string> = { brand: colors.indigoTint, gold: colors.goldTint, success: colors.mintTint, danger: colors.coralTint, neutral: colors.surfaceMuted };

const QUICK_ACTIONS: { icon: any; label: string; prompt: string; tone: Tone }[] = [
  { icon: PenTool, label: "Create Lesson Plan", prompt: "Create a detailed lesson plan for [subject] for [grade] students on the topic of [topic]", tone: "brand" },
  { icon: ListChecks, label: "Generate Quiz", prompt: "Generate a 10-question multiple choice quiz on [topic] for [grade] level students", tone: "gold" },
  { icon: FileText, label: "Design Assignment", prompt: "Design a creative assignment on [topic] that encourages critical thinking for [grade] students", tone: "success" },
  { icon: Lightbulb, label: "Teaching Strategy", prompt: "Suggest innovative teaching strategies to make [topic] more engaging for students", tone: "danger" },
  { icon: Calculator, label: "Math Problem", prompt: "Create practice problems with solutions for [math topic] at [grade] level", tone: "brand" },
  { icon: Beaker, label: "Science Experiment", prompt: "Suggest a safe, engaging science experiment to demonstrate [concept] for [grade] students", tone: "success" },
  { icon: Globe, label: "Explain Concept", prompt: "Explain [complex topic] in simple terms suitable for [grade] level students", tone: "gold" },
  { icon: GraduationCap, label: "Study Guide", prompt: "Create a comprehensive study guide for [topic] covering key concepts, definitions, and practice questions", tone: "danger" },
];

// Three dots pulsing in sequence — the AI's "thinking" indicator.
function TypingDots() {
  const d0 = useSharedValue(0.3);
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const dots = [d0, d1, d2];
  useEffect(() => {
    dots.forEach((d, i) => {
      d.value = withDelay(i * 150, withRepeat(withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }), -1, true));
    });
  }, []);
  const s0 = useAnimatedStyle(() => ({ opacity: d0.value, transform: [{ scale: 0.7 + d0.value * 0.3 }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: d1.value, transform: [{ scale: 0.7 + d1.value * 0.3 }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value, transform: [{ scale: 0.7 + d2.value * 0.3 }] }));
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.indigo }, s0]} />
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.indigo }, s1]} />
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.indigo }, s2]} />
    </View>
  );
}

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

  useEffect(() => { fetchMessages(); }, []);

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
        content: inputText, fileUrl: uploadedFile?.url, fileName: uploadedFile?.name,
        fileType: uploadedFile?.type, fileSize: uploadedFile?.size, conversationHistory: history,
      });
      if (data.success) {
        setMessages((prev) => [...prev, { ...data.userMessage, isAI: false }, { ...data.aiMessage, isAI: true }]);
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
        text: "Clear", style: "destructive",
        onPress: async () => {
          try {
            const { data } = await api.delete("/api/teacher/ai-assistant");
            if (data.success) { setMessages([]); setShowQuickActions(true); }
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 12 }}>Loading EduGenius…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ overflow: "hidden" }}>
          <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
            <LinearGradient
              colors={["rgba(27,44,92,0.72)", "rgba(27,44,92,0.85)", "rgba(16,24,49,0.95)"]}
              style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <AnimatedPressable pressScale={0.9} onPress={() => navigation.goBack()} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                <ArrowLeft size={20} color={colors.white} />
              </AnimatedPressable>
              <View style={{ width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}>
                <Bot size={19} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 15 }}>EduGenius AI</Text>
                  <Sparkles size={13} color={colors.gold} />
                </View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontFamily: fonts.body, fontSize: 11.5 }}>Your intelligent teaching assistant</Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={fetchMessages} style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.sm, alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={15} color={colors.white} />
              </AnimatedPressable>
              <AnimatedPressable pressScale={0.9} onPress={handleClearChat} style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.sm, alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={15} color={colors.white} />
              </AnimatedPressable>
            </LinearGradient>
          </ImageBackground>
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
              <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", marginBottom: 20 }}>
                <LinearGradient colors={[colors.indigoDark, colors.indigo]} style={{ width: 68, height: 68, borderRadius: radius.xl, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Bot size={30} color={colors.white} />
                  <View style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.paper }}>
                    <Sparkles size={10} color={colors.ink} />
                  </View>
                </LinearGradient>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink, textAlign: "center" }}>Welcome to EduGenius AI 👋</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 6, maxWidth: "85%" }}>Try a quick action below or ask me anything about teaching</Text>
              </Animated.View>
            }
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.duration(350).delay(index * 45).springify().damping(15)} style={{ flex: 1 }}>
                <AnimatedPressable
                  pressScale={0.96}
                  onPress={() => { setInputText(item.prompt); setShowQuickActions(false); }}
                  style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: toneTint[item.tone], alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <item.icon size={16} color={toneColor[item.tone]} />
                  </View>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 4 }}>{item.label}</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: colors.inkMuted }} numberOfLines={2}>{item.prompt}</Text>
                </AnimatedPressable>
              </Animated.View>
            )}
            ListFooterComponent={
              <Animated.View entering={FadeInDown.duration(400).delay(400)} style={{ backgroundColor: colors.indigoTint, borderRadius: radius.md, padding: spacing.md, marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <Info size={14} color={colors.indigo} />
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.indigo }}>Pro Tips</Text>
                </View>
                {[
                  "Upload images or PDFs for help with visual content",
                  "Be specific with grade level and subject",
                  "Ask follow-up questions to refine content",
                ].map((tip, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 7, marginBottom: 4 }}>
                    <Zap size={11} color={colors.indigo} style={{ marginTop: 2 }} />
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.indigo, flex: 1 }}>{tip}</Text>
                  </View>
                ))}
              </Animated.View>
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
            renderItem={({ item: msg, index }) => (
              <Animated.View
                entering={(msg.isAI ? FadeInLeft : FadeInRight).duration(300).delay(Math.min(index, 4) * 40).springify().damping(16)}
                layout={LinearTransition.duration(200)}
                style={{ flexDirection: msg.isAI ? "row" : "row-reverse", gap: 10, marginBottom: 16 }}
              >
                <View style={{ width: 30, height: 30, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: msg.isAI ? colors.indigo : "#3D9FB0" }}>
                  {msg.isAI ? <Bot size={15} color={colors.white} /> : <UserIcon size={15} color={colors.white} />}
                </View>
                <View style={{ maxWidth: "78%", borderRadius: radius.lg, padding: spacing.md, backgroundColor: msg.isAI ? colors.surfaceMuted : colors.indigo }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, color: msg.isAI ? colors.ink : colors.white }}>{msg.isAI ? "EduGenius AI" : "You"}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 9.5, color: msg.isAI ? colors.inkFaint : "rgba(255,255,255,0.65)" }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>

                  {msg.fileUrl && (
                    <AnimatedPressable pressScale={0.97} onPress={() => Linking.openURL(msg.fileUrl!)} style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.md, padding: 9, marginBottom: 8, backgroundColor: msg.isAI ? colors.surface : "rgba(255,255,255,0.16)" }}>
                      {msg.fileType === "image" ? <ImageIcon size={15} color={msg.isAI ? colors.inkMuted : colors.white} /> : <FileText size={15} color={msg.isAI ? colors.inkMuted : colors.white} />}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: msg.isAI ? colors.ink : colors.white }} numberOfLines={1}>{msg.fileName}</Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 9.5, color: msg.isAI ? colors.inkMuted : "rgba(255,255,255,0.7)" }}>{msg.fileSize}</Text>
                      </View>
                      <Download size={12} color={msg.isAI ? colors.inkMuted : colors.white} />
                    </AnimatedPressable>
                  )}

                  <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: msg.isAI ? colors.ink : colors.white }}>{msg.content}</Text>

                  {msg.isAI && (
                    <AnimatedPressable pressScale={0.93} onPress={() => handleCopy(msg.content, msg.id)} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 9, paddingVertical: 6, alignSelf: "flex-start", marginTop: 8 }}>
                      {copiedId === msg.id ? (
                        <><Check size={11} color={colors.mint} /><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.mint }}>Copied!</Text></>
                      ) : (
                        <><Copy size={11} color={colors.inkMuted} /><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkMuted }}>Copy</Text></>
                      )}
                    </AnimatedPressable>
                  )}
                </View>
              </Animated.View>
            )}
            ListFooterComponent={
              sending ? (
                <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <View style={{ width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center" }}>
                    <Bot size={15} color={colors.white} />
                  </View>
                  <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <TypingDots />
                    <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }}>EduGenius is thinking…</Text>
                  </View>
                </Animated.View>
              ) : null
            }
          />
        )}

        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 12 }}>
          {uploadedFile && (
            <Animated.View entering={FadeInUp.duration(200)} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.indigoTint, borderRadius: radius.md, padding: 10, marginBottom: 10 }}>
              {uploadedFile.type === "image" ? <ImageIcon size={17} color={colors.indigo} /> : <FileText size={17} color={colors.indigo} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink }} numberOfLines={1}>{uploadedFile.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted }}>{uploadedFile.size}</Text>
              </View>
              <AnimatedPressable pressScale={0.85} onPress={() => setUploadedFile(null)}>
                <X size={16} color={colors.coral} />
              </AnimatedPressable>
            </Animated.View>
          )}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
            <AnimatedPressable pressScale={0.9} onPress={handlePickFile} disabled={uploadingFile} style={{ width: 42, height: 42, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}>
              {uploadingFile ? <ActivityIndicator size="small" color={colors.indigo} /> : <Paperclip size={17} color={colors.inkMuted} />}
            </AnimatedPressable>
            <AnimatedPressable pressScale={0.9} onPress={handlePickImage} disabled={uploadingImage} style={{ width: 42, height: 42, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}>
              {uploadingImage ? <ActivityIndicator size="small" color={colors.indigo} /> : <ImageIcon size={17} color={colors.inkMuted} />}
            </AnimatedPressable>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about teaching…"
              placeholderTextColor={colors.inkFaint}
              multiline
              editable={!sending}
              style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 13, color: colors.ink, maxHeight: 90 }}
            />
            <AnimatedPressable
              pressScale={0.9}
              onPress={handleSend}
              disabled={sending || (!inputText.trim() && !uploadedFile)}
              style={{ width: 42, height: 42, backgroundColor: colors.indigo, borderRadius: radius.md, alignItems: "center", justifyContent: "center", opacity: sending || (!inputText.trim() && !uploadedFile) ? 0.5 : 1 }}
            >
              {sending ? <ActivityIndicator size="small" color={colors.white} /> : <Send size={18} color={colors.white} />}
            </AnimatedPressable>
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkFaint, textAlign: "center", marginTop: 8 }}>Supports images (8MB) & PDFs (16MB)</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
