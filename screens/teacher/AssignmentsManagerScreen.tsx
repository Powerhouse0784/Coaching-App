import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Image, Linking, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus, FileText, Calendar, Users, Download, Trash2, Search,
  CheckCircle, XCircle, MessageSquare, RefreshCw, X,
} from "lucide-react-native";
import api from "@/lib/api";
import type { TeacherAssignment, TeacherStudentProfile } from "@/types";
import CreateAssignmentModal from "@/components/teacher/CreateAssignmentModal";
import StudentProfileModal from "@/components/teacher/StudentProfileModal";

export default function AssignmentsManagerScreen() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentProfile | null>(null);

  const fetchAssignments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/api/teacher/assignments");
      if (data.success) setAssignments(data.assignments || []);
    } catch (e) {
      console.error("Error fetching assignments:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const subjects = useMemo(() => Array.from(new Set(assignments.map((a) => a.subject))).sort(), [assignments]);

  const filtered = assignments.filter((a) => {
    if (selectedSubject !== "all" && a.subject !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) && !a.subject.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((s, a) => s + a.stats.totalSubmissions, 0);
  const totalComments = assignments.reduce((s, a) => s + a.stats.totalComments, 0);

  const handleDelete = (id: string) => {
    Alert.alert("Delete assignment?", "All submissions will be deleted too.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setAssignments((prev) => prev.filter((a) => a.id !== id));
          try {
            const { data } = await api.delete(`/api/teacher/assignments?id=${id}`);
            if (!data.success) fetchAssignments();
          } catch (e) {
            console.error(e);
            fetchAssignments();
          }
        },
      },
    ]);
  };

  const handleDeleteComment = (assignmentId: string, commentId: string) => {
    Alert.alert("Delete comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setAssignments((prev) =>
            prev.map((a) =>
              a.id !== assignmentId
                ? a
                : { ...a, comments: a.comments.filter((c) => c.id !== commentId), stats: { ...a.stats, totalComments: a.stats.totalComments - 1 } }
            )
          );
          try {
            await api.delete(`/api/assignments/comments?id=${commentId}`);
          } catch (e) {
            console.error(e);
            fetchAssignments();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#9333ea" />
        <Text className="text-muted-foreground mt-3">Loading assignments…</Text>
      </SafeAreaView>
    );
  }

  const stats = [
    { icon: FileText, value: totalAssignments, label: "Assignments", color: "#3b82f6" },
    { icon: Users, value: totalSubmissions, label: "Submissions", color: "#a855f7" },
    { icon: MessageSquare, value: totalComments, label: "Comments", color: "#f97316" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAssignments(true)} />}
        ListHeaderComponent={
          <View className="px-5 pt-4">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xl font-bold text-foreground">Assignment Manager</Text>
                <Text className="text-xs text-muted-foreground">Create and manage assignments</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => fetchAssignments(true)}
                  className="w-9 h-9 border-2 border-border rounded-xl items-center justify-center"
                >
                  <RefreshCw size={15} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  className="bg-purple-600 rounded-xl px-3.5 py-2.5 flex-row items-center gap-1.5"
                >
                  <Plus size={15} color="#fff" />
                  <Text className="text-white text-xs font-semibold">Create</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row gap-3 mb-5">
              {stats.map((s, idx) => (
                <View key={idx} className="flex-1 bg-card rounded-2xl p-3 border border-border">
                  <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${s.color}20` }}>
                    <s.icon size={16} color={s.color} />
                  </View>
                  <Text className="text-lg font-bold text-foreground">{s.value}</Text>
                  <Text className="text-[10px] text-muted-foreground">{s.label}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4 bg-card">
              <Search size={16} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search assignments…"
                className="flex-1 py-2.5 px-2 text-foreground text-sm"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {subjects.length > 0 && (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={["all", ...subjects]}
                keyExtractor={(s) => s}
                contentContainerStyle={{ gap: 8, marginBottom: 12 }}
                renderItem={({ item: s }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-full border ${
                      selectedSubject === s ? "bg-purple-100 border-purple-400" : "bg-card border-border"
                    }`}
                  >
                    <Text className={`text-xs font-medium ${selectedSubject === s ? "text-purple-700" : "text-muted-foreground"}`}>
                      {s === "all" ? "All Subjects" : s}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        }
        renderItem={({ item: assignment }) => (
          <AssignmentCard
            assignment={assignment}
            onDelete={() => handleDelete(assignment.id)}
            onDeleteComment={(commentId) => handleDeleteComment(assignment.id, commentId)}
            onViewStudent={setSelectedStudent}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <FileText size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No assignments yet</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">Create your first assignment to get started</Text>
          </View>
        }
      />

      <CreateAssignmentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchAssignments();
        }}
      />
      <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </SafeAreaView>
  );
}

function AssignmentCard({
  assignment,
  onDelete,
  onDeleteComment,
  onViewStudent,
}: {
  assignment: TeacherAssignment;
  onDelete: () => void;
  onDeleteComment: (commentId: string) => void;
  onViewStudent: (student: TeacherStudentProfile) => void;
}) {
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now;
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View className="mx-5 mb-4 bg-card rounded-2xl border-2 border-border p-4">
      <View className="flex-row flex-wrap items-center gap-1.5 mb-2">
        <Text className="font-bold text-foreground text-base flex-shrink" numberOfLines={1}>{assignment.title}</Text>
      </View>
      <View className="flex-row flex-wrap gap-1.5 mb-2.5">
        <View className="bg-purple-100 px-2.5 py-0.5 rounded-full">
          <Text className="text-[10px] font-bold text-purple-700">{assignment.subject}</Text>
        </View>
        <View className="bg-blue-100 px-2.5 py-0.5 rounded-full">
          <Text className="text-[10px] font-bold text-blue-700">{assignment.class}</Text>
        </View>
      </View>

      <Text className="text-sm text-muted-foreground mb-3" numberOfLines={2}>{assignment.description}</Text>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        <View className="flex-row items-center gap-1">
          <Calendar size={12} color="#6b7280" />
          <Text className="text-xs text-muted-foreground">Due: {dueDate.toLocaleDateString()}</Text>
        </View>
        {isOverdue ? (
          <View className="flex-row items-center gap-1">
            <XCircle size={12} color="#dc2626" />
            <Text className="text-xs font-semibold text-red-600">Overdue</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1">
            <CheckCircle size={12} color="#16a34a" />
            <Text className="text-xs font-semibold text-green-600">{daysLeft} {daysLeft === 1 ? "day" : "days"} left</Text>
          </View>
        )}
      </View>

      <View className="bg-blue-50 rounded-xl p-3 items-center mb-3">
        <Text className="text-xs text-blue-700 mb-0.5">Total Submissions</Text>
        <Text className="text-2xl font-bold text-blue-600">{assignment.stats.totalSubmissions}</Text>
      </View>

      {assignment.submissions.length > 0 && (
        <View className="mb-3">
          <TouchableOpacity onPress={() => setShowSubmissions((v) => !v)} className="flex-row items-center gap-1.5 mb-2">
            <Users size={13} color="#9333ea" />
            <Text className="text-xs font-semibold text-purple-600">
              {showSubmissions ? "Hide" : "View"} Submissions ({assignment.submissions.length})
            </Text>
          </TouchableOpacity>
          {showSubmissions && (
            <View className="bg-secondary rounded-xl p-3 gap-2.5">
              {assignment.submissions.map((sub) => (
                <View key={sub.id} className="bg-card rounded-xl border border-border p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center overflow-hidden">
                        {sub.student.avatar ? (
                          <Image source={{ uri: sub.student.avatar }} className="w-full h-full" />
                        ) : (
                          <Text className="text-white font-bold text-xs">{sub.student.name?.charAt(0).toUpperCase() ?? "?"}</Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-xs text-foreground" numberOfLines={1}>{sub.student.name || "Unknown"}</Text>
                        <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>{sub.student.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => onViewStudent(sub.student)} className="bg-indigo-100 px-2.5 py-1.5 rounded-lg">
                      <Text className="text-[10px] font-semibold text-indigo-700">Profile</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => Linking.openURL(sub.fileUrl)} className="flex-row items-center gap-1.5 mb-1.5">
                    <FileText size={12} color="#9ca3af" />
                    <Text className="text-xs text-blue-600 font-medium flex-1" numberOfLines={1}>{sub.fileName}</Text>
                    <Text className="text-[10px] text-muted-foreground">({sub.fileSize})</Text>
                  </TouchableOpacity>
                  {sub.remarks ? <Text className="text-xs italic text-muted-foreground mb-1.5">"{sub.remarks}"</Text> : null}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] text-muted-foreground">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${sub.isCompleted ? "bg-green-100" : "bg-orange-100"}`}>
                      <Text className={`text-[10px] font-semibold ${sub.isCompleted ? "text-green-700" : "text-orange-700"}`}>{sub.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {assignment.comments.length > 0 && (
        <View className="mb-3">
          <TouchableOpacity onPress={() => setShowComments((v) => !v)} className="flex-row items-center gap-1.5 mb-2">
            <MessageSquare size={13} color="#9333ea" />
            <Text className="text-xs font-semibold text-purple-600">
              {showComments ? "Hide" : "View"} Comments ({assignment.comments.length})
            </Text>
          </TouchableOpacity>
          {showComments && (
            <View className="bg-secondary rounded-xl p-3 gap-2.5">
              {assignment.comments.map((c) => (
                <View key={c.id} className="bg-card rounded-xl border border-border p-3">
                  <View className="flex-row items-start justify-between mb-1.5 gap-2">
                    <View className="flex-row items-center flex-wrap gap-1.5 flex-1">
                      <Text className="font-semibold text-xs text-foreground" numberOfLines={1}>{c.user.name || "Unknown"}</Text>
                      <View className={`px-1.5 py-0.5 rounded-full ${c.user.role === "TEACHER" ? "bg-purple-100" : "bg-blue-100"}`}>
                        <Text className={`text-[9px] font-bold ${c.user.role === "TEACHER" ? "text-purple-700" : "text-blue-700"}`}>
                          {c.user.role}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</Text>
                      <TouchableOpacity onPress={() => onDeleteComment(c.id)}>
                        <Trash2 size={13} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text className="text-xs text-foreground">{c.content}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View className="flex-row gap-2.5">
        <TouchableOpacity
          onPress={() => Linking.openURL(assignment.fileUrl)}
          className="flex-1 bg-blue-600 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
        >
          <Download size={14} color="#fff" />
          <Text className="text-white text-xs font-semibold">Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          className="flex-1 border-2 border-red-300 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
        >
          <Trash2 size={14} color="#dc2626" />
          <Text className="text-red-600 text-xs font-semibold">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}