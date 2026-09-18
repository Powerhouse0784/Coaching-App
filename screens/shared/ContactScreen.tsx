import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking, Modal, FlatList,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Send, Mail, Phone, MapPin, Clock, CheckCircle2,
  Bot, X, Sparkles, Globe, HelpCircle,
  Globe2,
  Globe2Icon,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage } from "@/types";

const CATEGORIES = [
  { value: "general", label: "General Inquiry" },
  { value: "technical", label: "Technical Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "feature", label: "Feature Request" },
  { value: "bug", label: "Report a Bug" },
  { value: "feedback", label: "Feedback" },
  { value: "partnership", label: "Partnership" },
  { value: "teaching", label: "Become a Teacher" },
];

const CONTACT_INFO = [
  { icon: Mail, title: "Email Us", value: "pandeyranu087@gmail.com", desc: "Send us an email anytime", color: "#3b82f6", url: "mailto:pandeyranu087@gmail.com" },
  { icon: Phone, title: "Call Us", value: "+91 91186 10664", desc: "Mon-Fri from 9am to 6pm", color: "#22c55e", url: "tel:+919118610664" },
  { icon: MapPin, title: "Visit Us", value: "Hanuman Mandir, Adarsh Nagar, Jeevan Park, Delhi 110059", desc: "Come say hello", color: "#a855f7", url: "https://maps.app.goo.gl/ByExkEywvFAxG84c9?g_st=aw" },
  { icon: Clock, title: "Working Hours", value: "8:00 AM - 10:00 PM", desc: "All Days", color: "#f97316", url: null },
];

const FAQS = [
  { q: "How quickly do you respond?", a: "We aim to respond to all inquiries within 24 hours during business days." },
  { q: "Can I schedule a demo call?", a: "Yes! Mention it in your message and we'll arrange a convenient time." },
  { q: "Do you offer phone support?", a: "Phone support is available for all users. Contact us to learn more." },
];

const SOCIAL_LINKS = [
  { icon: Globe, url: "https://youtube.com/@intense_learners?si=PKpm1w_PnuAImiYG", color: "#ef4444" },
  { icon: Globe2, url: "https://www.instagram.com/intense_learners?igsh=MTVtNTV2Znd6cGVrZQ==", color: "#db2777" },
  { icon: Globe2Icon, url: "https://www.facebook.com/share/1E77DTHG5w/", color: "#2563eb" },
  { icon: Globe, url: "https://maps.app.goo.gl/ByExkEywvFAxG84c9?g_st=aw", color: "#2563eb" },
];

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function ContactScreen() {
  const navigation = useNavigation();
  const currentUser = useAuthStore((s) => s.user);

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert("Missing info", "Please fill in all required fields");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/api/contact", { name, email, subject, category, message });
      if (data.success !== false) {
        setSent(true);
        setTimeout(() => setSent(false), 5000);
        setSubject("");
        setMessage("");
        setCategory("general");
      } else {
        Alert.alert("Error", data.error || "Failed to send message");
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        Alert.alert("Too many requests", err.response.data?.error || "Please try again later");
      } else {
        Alert.alert("Error", err.response?.data?.error || "Failed to send message. Please try again or email us directly.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-3 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <Text className="font-bold text-foreground text-base">Contact Us</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View className="items-center mb-6">
          <View className="flex-row items-center gap-2 bg-indigo-100 px-3 py-1.5 rounded-full mb-3">
            <Bot size={13} color="#6366f1" />
            <Text className="text-indigo-700 text-xs font-semibold">24/7 AI Support Available</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">Let's Connect</Text>
          <Text className="text-sm text-muted-foreground text-center mt-2">
            Have questions? We're here to help. Send us a message or chat with our AI assistant.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-6">
          {CONTACT_INFO.map((info, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => info.url && Linking.openURL(info.url)}
              disabled={!info.url}
              className="bg-card rounded-2xl border-2 border-border p-4"
              style={{ minWidth: "45%", flex: 1 }}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mb-2.5" style={{ backgroundColor: `${info.color}20` }}>
                <info.icon size={18} color={info.color} />
              </View>
              <Text className="font-semibold text-foreground text-xs mb-0.5">{info.title}</Text>
              <Text className="font-bold text-foreground text-xs mb-0.5" numberOfLines={2}>{info.value}</Text>
              <Text className="text-[10px] text-muted-foreground">{info.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-card rounded-2xl border-2 border-border p-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Send Us a Message</Text>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 bg-green-500 rounded-full" />
              <Text className="text-xs text-muted-foreground">Online</Text>
            </View>
          </View>

          {sent && (
            <View className="flex-row items-center gap-2.5 bg-green-50 border-2 border-green-200 rounded-xl p-3.5 mb-4">
              <CheckCircle2 size={18} color="#16a34a" />
              <View className="flex-1">
                <Text className="font-semibold text-green-800 text-sm">Message Sent Successfully! ✨</Text>
                <Text className="text-xs text-green-700">We'll get back to you within 24 hours.</Text>
              </View>
            </View>
          )}

          <View className="gap-4">
            <View>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Your Name *</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Vivek Kumar Jha" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
            </View>
            <View>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Email Address *</Text>
              <TextInput
                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
                placeholder="you@example.com"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    className={`px-3.5 py-2 rounded-xl ${category === c.value ? "bg-indigo-600" : "bg-secondary"}`}
                  >
                    <Text className={`text-xs font-semibold ${category === c.value ? "text-white" : "text-foreground"}`}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Subject *</Text>
              <TextInput value={subject} onChangeText={setSubject} placeholder="How can we help you?" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
            </View>

            <View>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Message *</Text>
              <TextInput
                value={message} onChangeText={setMessage} multiline numberOfLines={6}
                placeholder="Tell us more about your inquiry…"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                style={{ textAlignVertical: "top", minHeight: 130 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={sending}
              className="bg-indigo-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
              style={{ opacity: sending ? 0.6 : 1 }}
            >
              {sending ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Send size={16} color="#fff" />
                  <Text className="text-white font-semibold text-sm">Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-card rounded-2xl border-2 border-border p-5 mb-6">
          <View className="flex-row items-center gap-2 mb-4">
            <HelpCircle size={18} color="#6366f1" />
            <Text className="font-bold text-foreground text-base">Quick FAQs</Text>
          </View>
          <View className="gap-4">
            {FAQS.map((f, idx) => (
              <View key={idx}>
                <Text className="font-semibold text-foreground text-sm mb-1">{f.q}</Text>
                <Text className="text-xs text-muted-foreground">{f.a}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="bg-card rounded-2xl border-2 border-border p-5">
          <Text className="font-bold text-foreground text-base mb-4">Follow Us</Text>
          <View className="flex-row gap-3">
            {SOCIAL_LINKS.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => Linking.openURL(s.url)}
                className="w-11 h-11 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${s.color}20` }}
              >
                <s.icon size={18} color={s.color} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => setChatOpen(true)}
        className="absolute bottom-6 right-5 w-16 h-16 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 6 }}
      >
        <Bot size={26} color="#fff" />
        <View className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
      </TouchableOpacity>

      <ChatWidget visible={chatOpen} onClose={() => setChatOpen(false)} />
    </SafeAreaView>
  );
}

function ChatWidget({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! 👋 I'm your AI assistant. How can I help you today? I can answer questions about our courses, pricing, enrollment, or anything else about Intense Learners!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(generateSessionId());
  const listRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const { data } = await api.post("/api/chat", { message: userMessage, sessionId: sessionIdRef.current });
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: err.response?.data?.response || "Sorry, I encountered an error. Please try again or contact support directly." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ height: "80%" }}>
          <View className="bg-background rounded-t-3xl flex-1">
            <View className="flex-row items-center justify-between px-5 py-4 bg-indigo-600 rounded-t-3xl">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                  <Bot size={20} color="#fff" />
                </View>
                <View>
                  <Text className="text-white font-bold text-sm">AI Assistant</Text>
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <Text className="text-white/80 text-xs">Online</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center">
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ padding: 16 }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item: msg }) => (
                <View className={`flex-row gap-2 mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <View className="w-7 h-7 rounded-full bg-indigo-600 items-center justify-center">
                      <Bot size={14} color="#fff" />
                    </View>
                  )}
                  <View
                    className="rounded-2xl px-3.5 py-2.5"
                    style={{
                      maxWidth: "78%",
                      backgroundColor: msg.role === "user" ? "#6366f1" : "#f3f4f6",
                    }}
                  >
                    {msg.role === "assistant" && (
                      <View className="flex-row items-center gap-1 mb-1">
                        <Sparkles size={11} color="#6366f1" />
                        <Text className="text-[10px] font-semibold text-indigo-600">AI Assistant</Text>
                      </View>
                    )}
                    <Text className="text-sm" style={{ color: msg.role === "user" ? "#fff" : "#111827" }}>{msg.content}</Text>
                  </View>
                </View>
              )}
              ListFooterComponent={
                loading ? (
                  <View className="flex-row items-center gap-2 mb-3">
                    <View className="w-7 h-7 rounded-full bg-indigo-600 items-center justify-center">
                      <Bot size={14} color="#fff" />
                    </View>
                    <View className="bg-secondary rounded-2xl px-4 py-3 flex-row items-center gap-1.5">
                      <ActivityIndicator size="small" color="#6366f1" />
                    </View>
                  </View>
                ) : null
              }
            />

            <View className="flex-row items-center gap-2 p-4 border-t border-border">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything…"
                editable={!loading}
                className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={loading || !input.trim()}
                className="w-11 h-11 bg-indigo-600 rounded-xl items-center justify-center"
                style={{ opacity: loading || !input.trim() ? 0.5 : 1 }}
              >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
            <Text className="text-[10px] text-muted-foreground text-center pb-3">
              AI can make mistakes. Verify important info.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}