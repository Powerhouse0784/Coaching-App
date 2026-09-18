import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator,  Linking, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText, Search, Clock, CheckCircle, Activity, BookOpen,
  User, Calendar, Award, Users, MessageSquare, Download, Upload,
  X, Check, Eye, ChevronDown, ChevronUp,
} from "lucide-react-native";
import api from "@/lib/api";
import type { StudentAssignment, AssignmentSubmission } from "@/types";
import SubmitAssignmentModal from "@/components/assignments/SubmitAssignmentModal";
import CommentsModal from "@/components/assignments/CommentsModal";

type FilterType = "all" | "pending" | "submitted";

export default function AssignmentsScreen() {
  const [allAssignments, setAllAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const [submitTarget, setSubmitTarget] = useState<StudentAssignment | null>(null);
  const [commentsTarget, setCommentsTarget] = useState<StudentAssignment | null>(null);

  const fetchAssignments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/api/student/assignments");
      if (data.success) setAllAssignments(data.assignments);
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

  const subjects = useMemo(
    () => Array.from(new Set(allAssignments.map((a) => a.subject))).sort(),
    [allAssignments]
  );

  const filteredAssignments = useMemo(() => {
    let list = [...allAssignments];
    if (filter === "pending") list = list.filter((a) => !a.mySubmission);
    if (filter === "submitted") list = list.filter((a) => a.mySubmission !== null);
    if (selectedSubject !== "all") list = list.filter((a) => a.subject === selectedSubject);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAssignments, filter, selectedSubject, searchQuery]);

  const totalAssignments = allAssignments.length;
  const completedAssignments = allAssignments.filter((a) => a.mySubmission?.isCompleted).length;
  const pendingAssignments = allAssignments.filter((a) => !a.mySubmission).length;
  const submittedAssignments = allAssignments.filter((a) => a.mySubmission !== null).length;

  const handleMarkCompleted = async (submissionId: string) => {
    setAllAssignments((prev) =>
      prev.map((a) =>
        a.mySubmission?.id !== submissionId
          ? a
          : { ...a, mySubmission: { ...a.mySubmission!, isCompleted: true, status: "completed" } }
      )
    );
    try {
      const { data } = await api.patch("/api/student/assignments", { submissionId, isCompleted: true });
      if (!data.success) throw new Error(data.error);
    } catch (e) {
      console.error("Error marking as completed:", e);
      fetchAssignments();
    }
  };

  const handleSubmitSuccess = (assignmentId: string, submission: AssignmentSubmission) => {
    setAllAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, mySubmission: submission } : a))
    );
    setSubmitTarget(null);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-muted-foreground mt-3">Loading assignments…</Text>
      </SafeAreaView>
    );
  }

  const stats = [
    { icon: BookOpen, value: totalAssignments, label: "Total", color: "#3b82f6" },
    { icon: CheckCircle, value: completedAssignments, label: "Completed", color: "#22c55e" },
    { icon: Clock, value: pendingAssignments, label: "Pending", color: "#f97316" },
    { icon: Activity, value: submittedAssignments, label: "Submitted", color: "#a855f7" },
  ];

  const filters: { value: FilterType; label: string; icon: typeof BookOpen }[] = [
    { value: "all", label: "All", icon: BookOpen },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "submitted", label: "Submitted", icon: CheckCircle },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAssignments(true)} />}
        ListHeaderComponent={
          <View className="px-5 pt-4">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-11 h-11 bg-indigo-600 rounded-xl items-center justify-center">
                <FileText size={22} color="#fff" />
              </View>
              <View>
                <Text className="text-xl font-bold text-foreground">My Assignments</Text>
                <Text className="text-xs text-muted-foreground">View, submit, and discuss your work</Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row flex-wrap gap-3 mb-5">
              {stats.map((s, idx) => (
                <View key={idx} className="bg-card rounded-2xl p-3 border border-border" style={{ minWidth: "45%" }}>
                  <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${s.color}20` }}>
                    <s.icon size={16} color={s.color} />
                  </View>
                  <Text className="text-lg font-bold text-foreground">{s.value}</Text>
                  <Text className="text-xs text-muted-foreground">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Search */}
            <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4 bg-card">
              <Search size={18} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search assignments…"
                className="flex-1 py-3 px-2 text-foreground"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter tabs */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={filters}
              keyExtractor={(f) => f.value}
              contentContainerStyle={{ gap: 8, marginBottom: 10 }}
              renderItem={({ item: f }) => (
                <TouchableOpacity
                  onPress={() => setFilter(f.value)}
                  className={`flex-row items-center gap-1.5 px-4 py-2 rounded-xl ${
                    filter === f.value ? "bg-indigo-600" : "bg-card border border-border"
                  }`}
                >
                  <f.icon size={14} color={filter === f.value ? "#fff" : "#6b7280"} />
                  <Text className={`text-sm font-semibold ${filter === f.value ? "text-white" : "text-foreground"}`}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Subject chips */}
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

            <Text className="text-xs text-muted-foreground mb-3">
              Showing {filteredAssignments.length} of {totalAssignments} assignments
            </Text>
          </View>
        }
        renderItem={({ item: assignment }) => (
          <AssignmentCard
            assignment={assignment}
            onSubmit={() => setSubmitTarget(assignment)}
            onViewComments={() => setCommentsTarget(assignment)}
            onMarkCompleted={handleMarkCompleted}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <FileText size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No assignments found</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">
              {searchQuery || selectedSubject !== "all"
                ? "Try adjusting your filters."
                : "Your teachers haven't assigned any work yet."}
            </Text>
          </View>
        }
      />

      <SubmitAssignmentModal
        visible={!!submitTarget}
        assignment={submitTarget}
        onClose={() => setSubmitTarget(null)}
        onSuccess={handleSubmitSuccess}
      />
      <CommentsModal
        visible={!!commentsTarget}
        assignment={commentsTarget}
        onClose={() => setCommentsTarget(null)}
      />
    </SafeAreaView>
  );
}

function AssignmentCard({
  assignment,
  onSubmit,
  onViewComments,
  onMarkCompleted,
}: {
  assignment: StudentAssignment;
  onSubmit: () => void;
  onViewComments: () => void;
  onMarkCompleted: (submissionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  const timeLeftText =
    daysLeft > 1 ? `${daysLeft} days left` : hoursLeft > 1 ? `${hoursLeft} hours left` : daysLeft < 0 ? "Past due" : "Due soon!";
  const timeLeftColor = daysLeft < 0 ? "#9ca3af" : daysLeft <= 2 ? "#f97316" : "#22c55e";

  const statusBadge = assignment.mySubmission?.isCompleted
    ? { label: "Completed", bg: "bg-green-100", text: "text-green-700", Icon: CheckCircle }
    : assignment.mySubmission
    ? { label: "Submitted", bg: "bg-blue-100", text: "text-blue-700", Icon: Activity }
    : { label: "Pending", bg: "bg-orange-100", text: "text-orange-700", Icon: Clock };

  return (
    <View className="mx-5 mb-4 bg-card rounded-2xl border border-border p-4">
      {/* Title + badges */}
      <View className="flex-row flex-wrap items-center gap-1.5 mb-2">
        <Text className="font-bold text-foreground text-base flex-shrink" numberOfLines={2}>{assignment.title}</Text>
      </View>
      <View className="flex-row flex-wrap gap-1.5 mb-3">
        <View className={`px-2 py-1 rounded-full flex-row items-center gap-1 ${statusBadge.bg}`}>
          <statusBadge.Icon size={11} color="#000" />
          <Text className={`text-[10px] font-bold ${statusBadge.text}`}>{statusBadge.label}</Text>
        </View>
        <View className="px-2 py-1 rounded-full bg-purple-100">
          <Text className="text-[10px] font-bold text-purple-700">{assignment.subject}</Text>
        </View>
        <View className="px-2 py-1 rounded-full bg-blue-100">
          <Text className="text-[10px] font-bold text-blue-700">{assignment.class}</Text>
        </View>
      </View>

      <Text className="text-sm text-muted-foreground mb-1" numberOfLines={expanded ? undefined : 2}>
        {assignment.description}
      </Text>
      {assignment.description.length > 100 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} className="flex-row items-center gap-1 mb-2">
          {expanded ? <ChevronUp size={14} color="#6366f1" /> : <ChevronDown size={14} color="#6366f1" />}
          <Text className="text-indigo-600 text-xs font-semibold">{expanded ? "Show less" : "Read more"}</Text>
        </TouchableOpacity>
      )}

      {/* Meta */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-1.5 mb-3">
        <View className="flex-row items-center gap-1">
          <User size={12} color="#6b7280" />
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>{assignment.teacher.name || "Unknown"}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Calendar size={12} color="#6b7280" />
          <Text className="text-xs text-muted-foreground">Due: {dueDate.toLocaleDateString()}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color={timeLeftColor} />
          <Text className="text-xs font-semibold" style={{ color: timeLeftColor }}>{timeLeftText}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Award size={12} color="#6b7280" />
          <Text className="text-xs text-muted-foreground">{assignment.totalMarks} marks</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Users size={12} color="#6b7280" />
          <Text className="text-xs text-muted-foreground">{assignment.stats.totalSubmissions} submissions</Text>
        </View>
      </View>

      {/* Submission box */}
      {assignment.mySubmission && (
        <View className="border-2 border-blue-200 bg-blue-50 rounded-xl p-3 mb-3">
          <View className="flex-row items-start gap-2.5">
            <View className="w-9 h-9 bg-blue-600 rounded-lg items-center justify-center">
              <CheckCircle size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-blue-900 text-sm mb-1">Your Submission</Text>
              <View className="flex-row items-center gap-1">
                <FileText size={12} color="#1d4ed8" />
                <Text className="text-xs text-blue-700" numberOfLines={1}>
                  {assignment.mySubmission.fileName} · {assignment.mySubmission.fileSize}
                </Text>
              </View>
              <Text className="text-[10px] text-blue-600 mt-1">
                Submitted {new Date(assignment.mySubmission.submittedAt).toLocaleDateString()}
              </Text>
              {assignment.mySubmission.remarks ? (
                <Text className="text-xs text-blue-800 italic mt-1.5">"{assignment.mySubmission.remarks}"</Text>
              ) : null}
            </View>
          </View>
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => Linking.openURL(assignment.mySubmission!.fileUrl)}
              className="flex-1 bg-blue-600 rounded-lg py-2 flex-row items-center justify-center gap-1.5"
            >
              <Eye size={14} color="#fff" />
              <Text className="text-white text-xs font-semibold">View</Text>
            </TouchableOpacity>
            {!assignment.mySubmission.isCompleted && (
              <TouchableOpacity
                onPress={() => onMarkCompleted(assignment.mySubmission!.id)}
                className="flex-1 bg-green-600 rounded-lg py-2 flex-row items-center justify-center gap-1.5"
              >
                <Check size={14} color="#fff" />
                <Text className="text-white text-xs font-semibold">Mark Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row flex-wrap gap-2">
        {assignment.fileUrl && (
          <TouchableOpacity
            onPress={() => Linking.openURL(assignment.fileUrl!)}
            className="flex-1 bg-purple-600 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
            style={{ minWidth: "45%" }}
          >
            <Download size={14} color="#fff" />
            <Text className="text-white text-xs font-semibold">Download</Text>
          </TouchableOpacity>
        )}
        {!assignment.mySubmission && (
          <TouchableOpacity
            onPress={onSubmit}
            className="flex-1 bg-emerald-600 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
            style={{ minWidth: "45%" }}
          >
            <Upload size={14} color="#fff" />
            <Text className="text-white text-xs font-semibold">Submit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onViewComments}
          className="flex-1 border-2 border-indigo-300 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
          style={{ minWidth: "45%" }}
        >
          <MessageSquare size={14} color="#6366f1" />
          <Text className="text-indigo-700 text-xs font-semibold">Discuss ({assignment.stats.totalComments})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}