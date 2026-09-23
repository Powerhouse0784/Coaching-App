import { useState } from "react";
import {
  View, Text, TextInput, FlatList, ActivityIndicator, Image, Alert,
  Linking, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp, ZoomIn, LinearTransition } from "react-native-reanimated";
import {
  ArrowLeft, ThumbsUp, Trash2, FileText, ImageIcon, Send,
  CheckCircle2, Pin, X, Eye,
} from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import { pickAndUploadImage, pickAndUploadPDF, type UploadedFile } from "@/lib/upload";
import type { Doubt, DoubtReply } from "@/types";
import type { TeacherRootStackParamList } from "@/navigation/TeacherRootNavigator";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = NativeStackNavigationProp<TeacherRootStackParamList, "DoubtDetail">;
type Rt = RouteProp<TeacherRootStackParamList, "DoubtDetail">;

const PRIORITY_TONE: Record<string, "success" | "brand" | "gold" | "danger"> = {
  low: "success",
  normal: "brand",
  high: "gold",
  urgent: "danger",
};

function formatTimeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d ago`;
  const w = Math.floor(dy / 7); if (w < 4) return `${w}w ago`;
  return new Date(d).toLocaleDateString();
}

function sortReplies(replies: DoubtReply[]) {
  return [...replies].sort((a, b) => {
    if (a.user.role === "TEACHER" && b.user.role !== "TEACHER") return -1;
    if (a.user.role !== "TEACHER" && b.user.role === "TEACHER") return 1;
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function TeacherDoubtDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { doubt: initialDoubt } = useRoute<Rt>().params;
  const [doubt, setDoubt] = useState<Doubt>(initialDoubt);

  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<UploadedFile | null>(null);
  const [replyPdf, setReplyPdf] = useState<UploadedFile | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleMarkSolved = async () => {
    setDoubt((d) => ({ ...d, isSolved: true, status: "solved" }));
    try {
      await api.patch("/api/doubts", { doubtId: doubt.id, action: "solve" });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to mark as solved");
      setDoubt((d) => ({ ...d, isSolved: false, status: "open" }));
    }
  };

  const handleDeleteDoubt = () => {
    Alert.alert("Delete doubt?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/doubts?id=${doubt.id}`);
            navigation.goBack();
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to delete doubt");
          }
        },
      },
    ]);
  };

  const handlePinReply = async (replyId: string) => {
    setDoubt((d) => ({
      ...d,
      replies: d.replies.map((r) => ({ ...r, isPinned: r.id === replyId })),
    }));
    try {
      await api.patch("/api/doubts", { doubtId: doubt.id, action: "pin", replyId });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to pin reply");
    }
  };

  const handlePickImage = async () => {
    setUploadingImage(true);
    try {
      const file = await pickAndUploadImage();
      if (file) setReplyImage(file);
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
      if (file) setReplyPdf(file);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyText.trim() && !replyImage && !replyPdf) {
      Alert.alert("Empty reply", "Please write something or attach a file");
      return;
    }
    setPosting(true);
    try {
      const { data } = await api.post("/api/doubts/reply", {
        doubtId: doubt.id,
        content: replyText,
        imageUrl: replyImage?.url || null,
        imageName: replyImage?.name || null,
        pdfUrl: replyPdf?.url || null,
        pdfName: replyPdf?.name || null,
      });
      if (data.success) {
        const newReply: DoubtReply = { ...data.reply, isMyReply: true, hasUpvoted: false };
        setDoubt((d) => ({
          ...d,
          replies: [newReply, ...d.replies],
          stats: { ...d.stats, totalReplies: d.stats.totalReplies + 1 },
        }));
        setReplyText("");
        setReplyImage(null);
        setReplyPdf(null);
      } else {
        Alert.alert("Failed to post", data.error || "Unknown error");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteReply = (replyId: string) => {
    Alert.alert("Delete reply?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDoubt((d) => ({
            ...d,
            replies: d.replies.filter((r) => r.id !== replyId),
            stats: { ...d.stats, totalReplies: d.stats.totalReplies - 1 },
          }));
          try {
            await api.delete(`/api/doubts/reply?id=${replyId}`);
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const canSend = !posting && (!!replyText.trim() || !!replyImage || !!replyPdf);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <AnimatedPressable
            pressScale={0.9}
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={18} color={colors.ink} />
          </AnimatedPressable>
          <Text style={{ ...type.h3, fontSize: 16, color: colors.ink, flex: 1 }}>Doubt Details & Reply</Text>
          <AnimatedPressable pressScale={0.9} onPress={handleDeleteDoubt} style={{ padding: 6 }}>
            <Trash2 size={18} color={colors.coral} />
          </AnimatedPressable>
        </View>

        <FlatList
          data={sortReplies(doubt.replies)}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 20, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.md }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {doubt.student.avatar ? (
                    <Image source={{ uri: doubt.student.avatar }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 14 }}>{doubt.student.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }}>{doubt.student.name}</Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>{doubt.subject} • {formatTimeAgo(doubt.createdAt)}</Text>
                </View>
              </View>

              <Text style={{ ...type.h3, fontSize: 18, color: colors.ink, marginBottom: 6 }}>{doubt.title}</Text>
              <Text style={{ ...type.body, fontSize: 14, color: colors.inkMuted, lineHeight: 21, marginBottom: spacing.md }}>{doubt.description}</Text>

              {doubt.imageUrl && (
                <Image source={{ uri: doubt.imageUrl }} style={{ width: "100%", height: 180, borderRadius: radius.md, marginBottom: spacing.sm }} resizeMode="cover" />
              )}
              {doubt.pdfUrl && (
                <AnimatedPressable
                  onPress={() => Linking.openURL(doubt.pdfUrl!)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9, alignSelf: "flex-start", marginBottom: spacing.md }}
                >
                  <FileText size={14} color={colors.coral} />
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.coral }}>{doubt.pdfName || "Download PDF"}</Text>
                </AnimatedPressable>
              )}

              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                {!doubt.isSolved && (
                  <AnimatedPressable
                    pressScale={0.97}
                    onPress={handleMarkSolved}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
                      backgroundColor: colors.mint, borderRadius: radius.md, paddingVertical: 11, paddingHorizontal: 16,
                      shadowColor: colors.mint, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5,
                    }}
                  >
                    <CheckCircle2 size={15} color={colors.white} />
                    <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Mark as Solved</Text>
                  </AnimatedPressable>
                )}
                {PRIORITY_TONE[doubt.priority] && <Badge label={doubt.priority} tone={PRIORITY_TONE[doubt.priority]} />}
                {doubt.isSolved && <Badge label="Solved" tone="success" />}
              </View>

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink, marginTop: 4 }}>Replies ({doubt.replies.length})</Text>
            </Animated.View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted }}>No replies yet. Be the first to help!</Text>
            </View>
          }
          renderItem={({ item: reply, index }) => {
            const isTeacher = reply.user.role === "TEACHER";
            const bg = isTeacher ? colors.goldTint : reply.isPinned ? colors.goldTint : reply.isAccepted ? colors.mintTint : colors.surface;
            const border = isTeacher ? "rgba(201,154,46,0.35)" : reply.isPinned ? "rgba(201,154,46,0.35)" : reply.isAccepted ? "rgba(47,143,91,0.3)" : colors.border;
            return (
              <Animated.View entering={FadeInUp.duration(280).delay(Math.min(index, 6) * 45)} layout={LinearTransition.duration(200)}>
                <View style={{ borderRadius: radius.md, borderWidth: 1.5, padding: spacing.md, marginBottom: spacing.md, backgroundColor: bg, borderColor: border }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 9, marginBottom: spacing.sm }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isTeacher ? colors.gold : colors.indigo, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {reply.user.avatar ? (
                        <Image source={{ uri: reply.user.avatar }} style={{ width: "100%", height: "100%" }} />
                      ) : (
                        <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>{reply.user.name.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }}>{reply.user.name}</Text>
                        {isTeacher && <Badge label="Teacher" tone="gold" />}
                        {reply.isPinned && (
                          <Animated.View entering={ZoomIn.duration(250)}>
                            <Pin size={11} color={colors.gold} fill={colors.gold} />
                          </Animated.View>
                        )}
                        {reply.isAccepted && <CheckCircle2 size={11} color={colors.mint} fill={colors.mint} />}
                      </View>
                      <Text style={{ fontSize: 10, fontFamily: fonts.body, color: colors.inkFaint, marginTop: 1 }}>{formatTimeAgo(reply.createdAt)}</Text>
                    </View>
                  </View>

                  <Text style={{ ...type.body, fontSize: 13.5, color: colors.ink, lineHeight: 19, marginBottom: spacing.sm }}>{reply.content}</Text>

                  {reply.imageUrl && (
                    <Image source={{ uri: reply.imageUrl }} style={{ width: "100%", height: 140, borderRadius: radius.sm, marginBottom: spacing.sm }} resizeMode="cover" />
                  )}
                  {reply.pdfUrl && (
                    <AnimatedPressable
                      onPress={() => Linking.openURL(reply.pdfUrl!)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.coralTint, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7, alignSelf: "flex-start", marginBottom: spacing.sm }}
                    >
                      <FileText size={12} color={colors.coral} />
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.coral }}>{reply.pdfName || "Download PDF"}</Text>
                    </AnimatedPressable>
                  )}

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <ThumbsUp size={13} color={colors.inkMuted} />
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.inkMuted }}>{reply.upvotes}</Text>
                    </View>
                    {!reply.isPinned && (
                      <AnimatedPressable pressScale={0.9} onPress={() => handlePinReply(reply.id)} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Pin size={13} color={colors.gold} />
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.gold }}>Pin</Text>
                      </AnimatedPressable>
                    )}
                    <AnimatedPressable pressScale={0.9} onPress={() => handleDeleteReply(reply.id)} style={{ marginLeft: "auto" }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.coral }}>Delete</Text>
                    </AnimatedPressable>
                  </View>
                </View>
              </Animated.View>
            );
          }}
        />

        {/* Reply composer */}
        <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.paper }}>
          {(replyImage || replyPdf) && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: spacing.sm }}>
              {replyImage && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.indigoTint, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 7 }}>
                  <ImageIcon size={12} color={colors.indigo} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.indigo, maxWidth: 100 }} numberOfLines={1}>{replyImage.name}</Text>
                  <AnimatedPressable pressScale={0.9} onPress={() => setReplyImage(null)}><X size={12} color={colors.coral} /></AnimatedPressable>
                </View>
              )}
              {replyPdf && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.coralTint, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 7 }}>
                  <FileText size={12} color={colors.coral} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.coral, maxWidth: 100 }} numberOfLines={1}>{replyPdf.name}</Text>
                  <AnimatedPressable pressScale={0.9} onPress={() => setReplyPdf(null)}><X size={12} color={colors.coral} /></AnimatedPressable>
                </View>
              )}
            </View>
          )}
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.sm }}>Your Response</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type your answer here…"
              placeholderTextColor={colors.inkFaint}
              multiline
              style={{
                flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
                fontFamily: fonts.body, fontSize: 14, maxHeight: 80, backgroundColor: colors.surface,
              }}
            />
            <AnimatedPressable
              pressScale={0.9}
              onPress={handlePickImage}
              disabled={uploadingImage}
              style={{ width: 40, height: 40, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}
            >
              {uploadingImage ? <ActivityIndicator size="small" color={colors.indigo} /> : <ImageIcon size={16} color={colors.inkMuted} />}
            </AnimatedPressable>
            <AnimatedPressable
              pressScale={0.9}
              onPress={handlePickPdf}
              disabled={uploadingPdf}
              style={{ width: 40, height: 40, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}
            >
              {uploadingPdf ? <ActivityIndicator size="small" color={colors.coral} /> : <FileText size={16} color={colors.inkMuted} />}
            </AnimatedPressable>
            <AnimatedPressable
              pressScale={0.9}
              onPress={handlePostReply}
              disabled={!canSend}
              style={{
                width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center",
                backgroundColor: colors.indigo, opacity: canSend ? 1 : 0.5,
              }}
            >
              {posting ? <ActivityIndicator size="small" color={colors.white} /> : <Send size={16} color={colors.white} />}
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
