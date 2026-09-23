import { useState, useRef } from "react";
import {
  View, Text, TextInput, ScrollView, ActivityIndicator, Alert, Linking,
  Modal, FlatList, KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming,
} from "react-native-reanimated";
import {
  ArrowLeft, Send, Mail, Phone, MapPin, Clock, CheckCircle2,
  Bot, X, Sparkles, Globe, HelpCircle, ChevronDown, Instagram, Facebook, Youtube,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage } from "@/types";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

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
  { icon: Mail, title: "Email Us", value: "pandeyranu087@gmail.com", desc: "Send us an email anytime", url: "mailto:pandeyranu087@gmail.com" },
  { icon: Phone, title: "Call Us", value: "+91 91186 10664", desc: "Mon–Fri, 9am to 6pm", url: "tel:+919118610664" },
  { icon: MapPin, title: "Visit Us", value: "Hanuman Mandir, Adarsh Nagar, Delhi", desc: "Come say hello", url: "https://maps.app.goo.gl/ByExkEywvFAxG84c9?g_st=aw" },
  { icon: Clock, title: "Working Hours", value: "8:00 AM – 10:00 PM", desc: "All days", url: null },
];

const FAQS = [
  { q: "How quickly do you respond?", a: "We aim to respond to all inquiries within 24 hours during business days." },
  { q: "Can I schedule a demo call?", a: "Yes! Mention it in your message and we'll arrange a convenient time." },
  { q: "Do you offer phone support?", a: "Phone support is available for all users. Contact us to learn more." },
];

const SOCIAL_LINKS = [
  { icon: Youtube, url: "https://youtube.com/@intense_learners?si=PKpm1w_PnuAImiYG" },
  { icon: Instagram, url: "https://www.instagram.com/intense_learners?igsh=MTVtNTV2Znd6cGVrZQ==" },
  { icon: Facebook, url: "https://www.facebook.com/share/1E77DTHG5w/" },
  { icon: Globe, url: "https://maps.app.goo.gl/ByExkEywvFAxG84c9?g_st=aw" },
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const fieldStyle = {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
    fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <AnimatedPressable
          pressScale={0.9}
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} color={colors.ink} />
        </AnimatedPressable>
        <Text style={{ ...type.h3, fontSize: 16, color: colors.ink }}>Contact Us</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Centered intro — its own composition, not a hero banner */}
        <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: "center", marginBottom: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.indigoTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginBottom: spacing.md }}>
            <Bot size={12} color={colors.indigo} />
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.indigo }}>24/7 AI Support Available</Text>
          </View>
          <Text style={{ ...type.h2, fontSize: 22, color: colors.ink, textAlign: "center" }}>Let's Connect</Text>
          <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 6, maxWidth: 280 }}>
            Have questions? We're here to help. Send us a message or chat with our AI assistant.
          </Text>
        </Animated.View>

        {/* Contact info — horizontal scroll cards, distinct from any grid used elsewhere */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CONTACT_INFO}
          keyExtractor={(item) => item.title}
          contentContainerStyle={{ gap: 10, marginBottom: spacing.xl }}
          renderItem={({ item: info, index }) => (
            <Animated.View entering={FadeInUp.duration(300).delay(index * 60)}>
              <AnimatedPressable
                pressScale={0.96}
                onPress={() => info.url && Linking.openURL(info.url)}
                disabled={!info.url}
                style={{ width: 150, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md }}
              >
                <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }}>
                  <info.icon size={16} color={colors.indigo} />
                </View>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, marginBottom: 2 }}>{info.title}</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkMuted, marginBottom: 2 }} numberOfLines={2}>{info.value}</Text>
                <Text style={{ fontSize: 10, fontFamily: fonts.body, color: colors.inkFaint }}>{info.desc}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        />

        {/* Message form */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
            <Text style={{ ...type.h3, fontSize: 15.5, color: colors.ink }}>Send Us a Message</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint }} />
              <Text style={{ ...type.caption, color: colors.inkMuted }}>Online</Text>
            </View>
          </View>

          {sent && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.mintTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
              <CheckCircle2 size={18} color={colors.mint} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.mint }}>Message sent successfully ✨</Text>
                <Text style={{ ...type.caption, color: colors.mint }}>We'll get back to you within 24 hours.</Text>
              </View>
            </View>
          )}

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Your Name *</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={colors.inkFaint} style={[fieldStyle, { marginBottom: spacing.md }]} />

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Email Address *</Text>
          <TextInput
            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
            placeholder="you@example.com" placeholderTextColor={colors.inkFaint}
            style={[fieldStyle, { marginBottom: spacing.md }]}
          />

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: spacing.sm }}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: spacing.md }}>
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <AnimatedPressable
                  key={c.value}
                  pressScale={0.95}
                  onPress={() => setCategory(c.value)}
                  style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.md, backgroundColor: active ? colors.indigo : colors.surfaceMuted }}
                >
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: active ? colors.white : colors.inkMuted }}>{c.label}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Subject *</Text>
          <TextInput value={subject} onChangeText={setSubject} placeholder="How can we help you?" placeholderTextColor={colors.inkFaint} style={[fieldStyle, { marginBottom: spacing.md }]} />

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Message *</Text>
          <TextInput
            value={message} onChangeText={setMessage} multiline numberOfLines={6}
            placeholder="Tell us more about your inquiry…" placeholderTextColor={colors.inkFaint}
            style={[fieldStyle, { textAlignVertical: "top", minHeight: 120, marginBottom: spacing.lg }]}
          />

          <AnimatedPressable
            pressScale={0.97}
            onPress={handleSubmit}
            disabled={sending}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.indigo, borderRadius: radius.md, paddingVertical: 13, opacity: sending ? 0.6 : 1 }}
          >
            {sending ? <ActivityIndicator color={colors.white} size="small" /> : (
              <>
                <Send size={16} color={colors.white} />
                <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13.5 }}>Send Message</Text>
              </>
            )}
          </AnimatedPressable>
        </View>

        {/* FAQ accordion — a genuinely different interaction than a static list */}
        <View style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
            <HelpCircle size={17} color={colors.indigo} />
            <Text style={{ ...type.h3, fontSize: 15.5, color: colors.ink }}>Quick FAQs</Text>
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
            {FAQS.map((f, idx) => (
              <FaqRow key={idx} q={f.q} a={f.a} open={openFaq === idx} onToggle={() => setOpenFaq(openFaq === idx ? null : idx)} last={idx === FAQS.length - 1} />
            ))}
          </View>
        </View>

        {/* Social */}
        <View>
          <Text style={{ ...type.h3, fontSize: 15.5, color: colors.ink, marginBottom: spacing.md }}>Follow Us</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {SOCIAL_LINKS.map((s, idx) => (
              <AnimatedPressable
                key={idx}
                pressScale={0.9}
                onPress={() => Linking.openURL(s.url)}
                style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center" }}
              >
                <s.icon size={18} color={colors.indigo} />
              </AnimatedPressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <AnimatedPressable
        pressScale={0.9}
        onPress={() => setChatOpen(true)}
        style={{
          position: "absolute", bottom: 24, right: 20, width: 60, height: 60, borderRadius: 30,
          backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center",
          shadowColor: colors.indigoDark, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}
      >
        <Bot size={24} color={colors.white} />
        <View style={{ position: "absolute", top: 3, right: 3, width: 13, height: 13, borderRadius: 7, backgroundColor: colors.mint, borderWidth: 2, borderColor: colors.white }} />
      </AnimatedPressable>

      <ChatWidget visible={chatOpen} onClose={() => setChatOpen(false)} />
    </SafeAreaView>
  );
}

function FaqRow({ q, a, open, onToggle, last }: { q: string; a: string; open: boolean; onToggle: () => void; last?: boolean }) {
  const rotation = useSharedValue(0);
  rotation.value = withTiming(open ? 180 : 0, { duration: 200 });
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <AnimatedPressable pressScale={0.99} onPress={onToggle} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: 13 }}>
        <Text style={{ flex: 1, fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, paddingRight: spacing.md }}>{q}</Text>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={16} color={colors.inkMuted} />
        </Animated.View>
      </AnimatedPressable>
      {open && (
        <Animated.View entering={FadeIn.duration(180)} style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <Text style={{ ...type.body, fontSize: 12.5, color: colors.inkMuted, lineHeight: 18 }}>{a}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function ChatWidget({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! 👋 I'm your AI assistant. How can I help you today? I can answer questions about our courses, pricing, enrollment, or anything else about Intense Learners!" },
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: "rgba(23,25,35,0.55)", justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ height: "80%" }}>
          <View style={{ backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, flex: 1, overflow: "hidden" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.indigo }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={18} color={colors.white} />
                </View>
                <View>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13.5 }}>AI Assistant</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint }} />
                    <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: fonts.body }}>Online</Text>
                  </View>
                </View>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={onClose} style={{ width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
                <X size={18} color={colors.white} />
              </AnimatedPressable>
            </View>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ padding: spacing.md }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item: msg }) => (
                <View style={{ flexDirection: "row", gap: 8, marginBottom: spacing.md, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "assistant" && (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center" }}>
                      <Bot size={14} color={colors.white} />
                    </View>
                  )}
                  <View style={{ maxWidth: "78%", borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: msg.role === "user" ? colors.indigo : colors.surface, borderWidth: msg.role === "user" ? 0 : 1, borderColor: colors.border }}>
                    {msg.role === "assistant" && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <Sparkles size={10} color={colors.indigo} />
                        <Text style={{ fontSize: 10, fontFamily: fonts.bodySemibold, color: colors.indigo }}>AI Assistant</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 13.5, fontFamily: fonts.body, color: msg.role === "user" ? colors.white : colors.ink, lineHeight: 19 }}>{msg.content}</Text>
                  </View>
                </View>
              )}
              ListFooterComponent={
                loading ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center" }}>
                      <Bot size={14} color={colors.white} />
                    </View>
                    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11 }}>
                      <ActivityIndicator size="small" color={colors.indigo} />
                    </View>
                  </View>
                ) : null
              }
            />

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything…"
                placeholderTextColor={colors.inkFaint}
                editable={!loading}
                style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink, fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface }}
              />
              <AnimatedPressable
                pressScale={0.9}
                onPress={handleSend}
                disabled={loading || !input.trim()}
                style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", opacity: loading || !input.trim() ? 0.5 : 1 }}
              >
                {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Send size={16} color={colors.white} />}
              </AnimatedPressable>
            </View>
            <Text style={{ textAlign: "center", fontSize: 10, fontFamily: fonts.body, color: colors.inkFaint, paddingBottom: spacing.md }}>
              AI can make mistakes. Verify important info.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
