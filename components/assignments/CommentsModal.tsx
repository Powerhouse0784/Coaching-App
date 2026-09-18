import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Linking, Image,
} from "react-native";
import { X, MessageSquare, Send, Paperclip, ThumbsUp, ExternalLink } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadPDF, type UploadedFile } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import type { StudentAssignment, AssignmentComment } from "@/types";

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ maxHeight: "90%" }}>
          <View className="bg-background rounded-t-3xl" style={{ height: "100%" }}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-border">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2">
                  <MessageSquare size={18} color="#6366f1" />
                  <Text className="text-lg font-bold text-foreground">Discussion</Text>
                </View>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{assignment.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Comments list */}
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#6366f1" />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(c) => c.id}
                contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                ListEmptyComponent={
                  <View className="items-center py-10">
                    <MessageSquare size={40} color="#9ca3af" />
                    <Text className="text-foreground font-semibold mt-3">No comments yet</Text>
                    <Text className="text-muted-foreground text-xs mt-1">Be the first to start the discussion!</Text>
                  </View>
                }
                renderItem={({ item: comment }) => (
                  <View className="bg-card rounded-xl p-3 border border-border mb-3">
                    <View className="flex-row gap-2.5">
                      <View className="w-9 h-9 rounded-full bg-indigo-500 items-center justify-center overflow-hidden">
                        {comment.user.avatar ? (
                          <Image source={{ uri: comment.user.avatar }} className="w-full h-full" />
                        ) : (
                          <Text className="text-white font-bold text-xs">
                            {comment.user.name?.charAt(0).toUpperCase() ?? "?"}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1.5 flex-wrap mb-1">
                          <Text className="font-semibold text-sm text-foreground">{comment.user.name}</Text>
                          <View className={`px-1.5 py-0.5 rounded-full ${comment.user.role === "TEACHER" ? "bg-purple-100" : "bg-blue-100"}`}>
                            <Text className={`text-[9px] font-bold ${comment.user.role === "TEACHER" ? "text-purple-700" : "text-blue-700"}`}>
                              {comment.user.role}
                            </Text>
                          </View>
                          <Text className="text-[10px] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        {comment.content ? (
                          <Text className="text-sm text-foreground mb-2">{comment.content}</Text>
                        ) : null}
                        {comment.fileUrl && (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(comment.fileUrl!)}
                            className="flex-row items-center gap-1.5 bg-secondary border border-border rounded-lg px-2.5 py-1.5 self-start mb-2"
                          >
                            <Paperclip size={13} color="#6366f1" />
                            <Text className="text-xs font-medium text-indigo-600" numberOfLines={1} style={{ maxWidth: 160 }}>
                              {comment.fileName}
                            </Text>
                            <ExternalLink size={11} color="#6366f1" />
                          </TouchableOpacity>
                        )}
                        <View className="flex-row items-center gap-4">
                          <TouchableOpacity onPress={() => handleLike(comment.id)} className="flex-row items-center gap-1">
                            <ThumbsUp size={14} color="#6b7280" />
                            <Text className="text-xs font-semibold text-muted-foreground">{comment.likes}</Text>
                          </TouchableOpacity>
                          {comment.user.id === currentUser?.id && (
                            <TouchableOpacity onPress={() => handleDelete(comment.id)}>
                              <Text className="text-xs font-semibold text-red-500">Delete</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Input */}
            <View className="p-4 border-t border-border">
              {uploadedFile && (
                <View className="flex-row items-center gap-2 bg-card border border-indigo-200 rounded-lg p-2 mb-2">
                  <Paperclip size={14} color="#6366f1" />
                  <Text className="text-xs text-foreground flex-1" numberOfLines={1}>{uploadedFile.name}</Text>
                  <TouchableOpacity onPress={() => setUploadedFile(null)}>
                    <X size={14} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}
              <View className="flex-row gap-2 items-end">
                <TextInput
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Share your thoughts…"
                  multiline
                  className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  style={{ maxHeight: 80 }}
                />
                <TouchableOpacity
                  onPress={handlePickFile}
                  disabled={uploading}
                  className="w-11 h-11 border-2 border-border rounded-xl items-center justify-center"
                >
                  {uploading ? <ActivityIndicator size="small" color="#6366f1" /> : <Paperclip size={18} color="#6b7280" />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePost}
                  disabled={(!newComment.trim() && !uploadedFile) || posting}
                  className="w-11 h-11 bg-indigo-600 rounded-xl items-center justify-center"
                  style={{ opacity: (!newComment.trim() && !uploadedFile) || posting ? 0.5 : 1 }}
                >
                  {posting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}