import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Alert, Linking,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, ThumbsUp, Trash2, FileText, ImageIcon, Send,
  CheckCircle2, Pin, X,
} from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import { pickAndUploadImage, pickAndUploadPDF, type UploadedFile } from "@/lib/upload";
import type { Doubt, DoubtReply } from "@/types";
import type { TeacherRootStackParamList } from "@/navigation/TeacherRootNavigator";

type Nav = NativeStackNavigationProp<TeacherRootStackParamList, "DoubtDetail">;
type Rt = RouteProp<TeacherRootStackParamList, "DoubtDetail">;

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "#dcfce7", text: "#15803d" },
  normal: { bg: "#dbeafe", text: "#1d4ed8" },
  high: { bg: "#ffedd5", text: "#c2410c" },
  urgent: { bg: "#fee2e2", text: "#b91c1c" },
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

  const priorityColor = PRIORITY_COLORS[doubt.priority];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-3 px-5 pt-2 pb-3 border-b border-border">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
            <ArrowLeft size={18} color="#374151" />
          </TouchableOpacity>
          <Text className="font-bold text-foreground text-base flex-1">Doubt Details & Reply</Text>
          <TouchableOpacity onPress={handleDeleteDoubt} className="p-2">
            <Trash2 size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={sortReplies(doubt.replies)}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 20, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="mb-4 pb-4 border-b border-border">
              <View className="flex-row items-center gap-2.5 mb-3">
                <View className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center overflow-hidden">
                  {doubt.student.avatar ? (
                    <Image source={{ uri: doubt.student.avatar }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white font-bold text-sm">{doubt.student.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View>
                  <Text className="font-bold text-foreground text-sm">{doubt.student.name}</Text>
                  <Text className="text-xs text-muted-foreground">{doubt.subject} • {formatTimeAgo(doubt.createdAt)}</Text>
                </View>
              </View>

              <Text className="font-bold text-foreground text-lg mb-1.5">{doubt.title}</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed mb-3">{doubt.description}</Text>

              {doubt.imageUrl && (
                <Image source={{ uri: doubt.imageUrl }} className="w-full rounded-xl mb-2" style={{ height: 180 }} resizeMode="cover" />
              )}
              {doubt.pdfUrl && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(doubt.pdfUrl!)}
                  className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 self-start mb-3"
                >
                  <FileText size={14} color="#dc2626" />
                  <Text className="text-xs font-semibold text-red-700">{doubt.pdfName || "Download PDF"}</Text>
                </TouchableOpacity>
              )}

              <View className="flex-row flex-wrap gap-2 mb-1">
                {!doubt.isSolved && (
                  <TouchableOpacity
                    onPress={handleMarkSolved}
                    className="flex-1 bg-green-600 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
                    style={{ minWidth: "45%" }}
                  >
                    <CheckCircle2 size={14} color="#fff" />
                    <Text className="text-white text-xs font-semibold">Mark as Solved</Text>
                  </TouchableOpacity>
                )}
                {priorityColor && (
                  <View className="px-2.5 py-1 rounded-full self-start" style={{ backgroundColor: priorityColor.bg }}>
                    <Text className="text-xs font-semibold" style={{ color: priorityColor.text }}>{doubt.priority}</Text>
                  </View>
                )}
                {doubt.isSolved && (
                  <View className="flex-row items-center gap-1 bg-green-100 px-2.5 py-1 rounded-full self-start">
                    <CheckCircle2 size={12} color="#15803d" />
                    <Text className="text-xs font-semibold text-green-700">Solved</Text>
                  </View>
                )}
              </View>

              <Text className="font-bold text-foreground text-sm mt-4">Replies ({doubt.replies.length})</Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted-foreground text-sm">No replies yet. Be the first to help!</Text>
            </View>
          }
          renderItem={({ item: reply }) => {
            const bg =
              reply.user.role === "TEACHER" ? "#faf5ff" : reply.isPinned ? "#fffbeb" : reply.isAccepted ? "#f0fdf4" : "#f9fafb";
            const border =
              reply.user.role === "TEACHER" ? "#e9d5ff" : reply.isPinned ? "#fde68a" : reply.isAccepted ? "#bbf7d0" : "#e5e7eb";
            return (
              <View className="rounded-xl border-2 p-3.5 mb-3" style={{ backgroundColor: bg, borderColor: border }}>
                <View className="flex-row items-start gap-2.5 mb-2">
                  <View className={`w-8 h-8 rounded-full items-center justify-center overflow-hidden ${reply.user.role === "TEACHER" ? "bg-purple-500" : "bg-blue-500"}`}>
                    {reply.user.avatar ? (
                      <Image source={{ uri: reply.user.avatar }} className="w-full h-full" />
                    ) : (
                      <Text className="text-white font-bold text-xs">{reply.user.name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-1.5">
                      <Text className="font-semibold text-sm text-foreground">{reply.user.name}</Text>
                      {reply.user.role === "TEACHER" && (
                        <View className="bg-purple-600 px-1.5 py-0.5 rounded-full">
                          <Text className="text-[10px] font-semibold text-white">Teacher</Text>
                        </View>
                      )}
                      {reply.isPinned && <Pin size={11} color="#d97706" fill="#d97706" />}
                      {reply.isAccepted && <CheckCircle2 size={11} color="#16a34a" fill="#16a34a" />}
                    </View>
                    <Text className="text-[10px] text-muted-foreground">{formatTimeAgo(reply.createdAt)}</Text>
                  </View>
                </View>

                <Text className="text-sm text-foreground mb-2">{reply.content}</Text>

                {reply.imageUrl && (
                  <Image source={{ uri: reply.imageUrl }} className="w-full rounded-lg mb-2" style={{ height: 140 }} resizeMode="cover" />
                )}
                {reply.pdfUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(reply.pdfUrl!)}
                    className="flex-row items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 self-start mb-2"
                  >
                    <FileText size={12} color="#dc2626" />
                    <Text className="text-xs font-semibold text-red-700">{reply.pdfName || "Download PDF"}</Text>
                  </TouchableOpacity>
                )}

                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center gap-1">
                    <ThumbsUp size={13} color="#6b7280" />
                    <Text className="text-xs font-semibold text-muted-foreground">{reply.upvotes}</Text>
                  </View>
                  {!reply.isPinned && (
                    <TouchableOpacity onPress={() => handlePinReply(reply.id)} className="flex-row items-center gap-1">
                      <Pin size={13} color="#d97706" />
                      <Text className="text-xs font-semibold text-amber-600">Pin</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDeleteReply(reply.id)} className="ml-auto">
                    <Text className="text-xs font-semibold text-red-500">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />

        <View className="p-4 border-t border-border">
          {(replyImage || replyPdf) && (
            <View className="flex-row gap-2 mb-2">
              {replyImage && (
                <View className="flex-row items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-2 py-1.5">
                  <ImageIcon size={12} color="#7c3aed" />
                  <Text className="text-xs text-purple-700" numberOfLines={1} style={{ maxWidth: 100 }}>{replyImage.name}</Text>
                  <TouchableOpacity onPress={() => setReplyImage(null)}><X size={12} color="#dc2626" /></TouchableOpacity>
                </View>
              )}
              {replyPdf && (
                <View className="flex-row items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                  <FileText size={12} color="#b91c1c" />
                  <Text className="text-xs text-red-700" numberOfLines={1} style={{ maxWidth: 100 }}>{replyPdf.name}</Text>
                  <TouchableOpacity onPress={() => setReplyPdf(null)}><X size={12} color="#dc2626" /></TouchableOpacity>
                </View>
              )}
            </View>
          )}
          <Text className="text-xs font-semibold text-foreground mb-2">Your Response</Text>
          <View className="flex-row items-end gap-2">
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type your answer here…"
              multiline
              className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
              style={{ maxHeight: 80 }}
            />
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploadingImage}
              className="w-10 h-10 border-2 border-border rounded-xl items-center justify-center"
            >
              {uploadingImage ? <ActivityIndicator size="small" color="#7c3aed" /> : <ImageIcon size={16} color="#6b7280" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickPdf}
              disabled={uploadingPdf}
              className="w-10 h-10 border-2 border-border rounded-xl items-center justify-center"
            >
              {uploadingPdf ? <ActivityIndicator size="small" color="#dc2626" /> : <FileText size={16} color="#6b7280" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePostReply}
              disabled={posting || (!replyText.trim() && !replyImage && !replyPdf)}
              className="w-10 h-10 bg-purple-600 rounded-xl items-center justify-center"
              style={{ opacity: posting || (!replyText.trim() && !replyImage && !replyPdf) ? 0.5 : 1 }}
            >
              {posting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}