import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, Modal, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Linking, Image, Pressable,
} from "react-native";
import Animated, { FadeIn, FadeInUp, SlideInDown } from "react-native-reanimated";
import { X, MessageSquare, Send, Paperclip, ThumbsUp, ExternalLink } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadPDF, type UploadedFile } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import type { StudentAssignment, AssignmentComment } from "@/types";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

interface Props {
  visible: boolean;
  assignment: StudentAssignment | null;
  onClose: () => void;
}

export default function CommentsModal({ visible, assignment, onClose }: Props) {
  const currentUser = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<AssignmentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!assignment) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/assignments/comments?assignmentId=${assignment.id}`);
      if (data.success) setComments(data.comments);
    } catch (e) {
      console.error("Error fetching comments:", e);
    } finally {
      setLoading(false);
    }
  }, [assignment]);

  useEffect(() => {
    if (visible) fetchComments();
  }, [visible, fetchComments]);

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

  const handlePost = async () => {
    if (!assignment) return;
    if (!newComment.trim() && !uploadedFile) {
      Alert.alert("Empty comment", "Please write a comment or attach a file");
      return;
    }
    setPosting(true);
    try {
      const { data } = await api.post("/api/assignments/comments", {
        assignmentId: assignment.id,
        content: newComment,
        fileUrl: uploadedFile?.url || null,
        fileName: uploadedFile?.name || null,
        fileSize: uploadedFile?.size || null,
      });
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
        setUploadedFile(null);
      } else {
        Alert.alert("Failed to post", data.error || "Unknown error");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "An error occurred while posting");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c)));
    try {
      const { data } = await api.patch("/api/assignments/comments", { commentId, action: "like" });
      if (data.success) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, likes: data.comment.likes } : c)));
      }
    } catch (e) {
      console.error("Error liking comment:", e);
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert("Delete comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          try {
            const { data } = await api.delete(`/api/assignments/comments?id=${commentId}`);
            if (!data.success) fetchComments();
          } catch (e) {
            console.error("Error deleting comment:", e);
            fetchComments();
          }
        },
      },
    ]);
  };

  if (!assignment) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: "rgba(23,25,35,0.6)", justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ maxHeight: "90%" }}>
          <Animated.View
            entering={SlideInDown.duration(280).springify().damping(18)}
            style={{ backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, height: "100%" }}
          >
            <View style={{ alignItems: "center", paddingTop: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <MessageSquare size={17} color={colors.indigo} />
                  <Text style={{ ...type.h3, fontSize: 17, color: colors.ink }}>Discussion</Text>
                </View>
                <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }} numberOfLines={1}>
                  {assignment.title}
                </Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={onClose} style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
                <X size={18} color={colors.inkMuted} />
              </AnimatedPressable>
            </View>

            {/* Comments list */}
            {loading ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={colors.indigo} />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(c) => c.id}
                contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
                      <MessageSquare size={26} color={colors.inkFaint} />
                    </View>
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }}>No comments yet</Text>
                    <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 3 }}>Be the first to start the discussion!</Text>
                  </View>
                }
                renderItem={({ item: comment, index }) => (
                  <Animated.View entering={FadeInUp.duration(280).delay(Math.min(index, 5) * 40)}>
                    <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md }}>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          {comment.user.avatar ? (
                            <Image source={{ uri: comment.user.avatar }} style={{ width: "100%", height: "100%" }} />
                          ) : (
                            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>
                              {comment.user.name?.charAt(0).toUpperCase() ?? "?"}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }}>{comment.user.name}</Text>
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: comment.user.role === "TEACHER" ? colors.goldTint : colors.indigoTint }}>
                              <Text style={{ fontSize: 9, fontFamily: fonts.bodySemibold, color: comment.user.role === "TEACHER" ? colors.gold : colors.indigo }}>
                                {comment.user.role}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 10, color: colors.inkFaint, fontFamily: fonts.body }}>
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          {comment.content ? (
                            <Text style={{ ...type.body, fontSize: 13.5, color: colors.ink, marginBottom: 8 }}>{comment.content}</Text>
                          ) : null}
                          {comment.fileUrl && (
                            <AnimatedPressable
                              onPress={() => Linking.openURL(comment.fileUrl!)}
                              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7, alignSelf: "flex-start", marginBottom: 8 }}
                            >
                              <Paperclip size={12} color={colors.indigo} />
                              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.indigo, maxWidth: 160 }} numberOfLines={1}>
                                {comment.fileName}
                              </Text>
                              <ExternalLink size={11} color={colors.indigo} />
                            </AnimatedPressable>
                          )}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                            <AnimatedPressable pressScale={0.9} onPress={() => handleLike(comment.id)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <ThumbsUp size={13} color={colors.inkMuted} />
                              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.inkMuted }}>{comment.likes}</Text>
                            </AnimatedPressable>
                            {comment.user.id === currentUser?.id && (
                              <AnimatedPressable pressScale={0.9} onPress={() => handleDelete(comment.id)}>
                                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.coral }}>Delete</Text>
                              </AnimatedPressable>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                )}
              />
            )}

            {/* Input */}
            <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
              {uploadedFile && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.indigoTint, borderRadius: radius.sm, padding: 8, marginBottom: 8 }}>
                  <Paperclip size={14} color={colors.indigo} />
                  <Text style={{ ...type.caption, color: colors.ink, flex: 1 }} numberOfLines={1}>{uploadedFile.name}</Text>
                  <AnimatedPressable pressScale={0.9} onPress={() => setUploadedFile(null)}>
                    <X size={14} color={colors.coral} />
                  </AnimatedPressable>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
                <TextInput
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Share your thoughts…"
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
                  onPress={handlePickFile}
                  disabled={uploading}
                  style={{ width: 44, height: 44, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}
                >
                  {uploading ? <ActivityIndicator size="small" color={colors.indigo} /> : <Paperclip size={18} color={colors.inkMuted} />}
                </AnimatedPressable>
                <AnimatedPressable
                  pressScale={0.9}
                  onPress={handlePost}
                  disabled={(!newComment.trim() && !uploadedFile) || posting}
                  style={{
                    width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center",
                    backgroundColor: colors.indigo,
                    opacity: (!newComment.trim() && !uploadedFile) || posting ? 0.5 : 1,
                  }}
                >
                  {posting ? <ActivityIndicator size="small" color={colors.white} /> : <Send size={18} color={colors.white} />}
                </AnimatedPressable>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
