import { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Dimensions, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  FileText, Search, Clock, CheckCircle, Activity, BookOpen, X,
} from "lucide-react-native";
import api from "@/lib/api";
import type { StudentAssignment, AssignmentSubmission } from "@/types";
import SubmitAssignmentModal from "@/components/assignments/SubmitAssignmentModal";
import CommentsModal from "@/components/assignments/CommentsModal";
import AssignmentCard from "@/components/assignments/AssignmentCard";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type FilterType = "all" | "pending" | "submitted";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Placeholder editorial photography — swap for your own student/desk photo before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80&auto=format&fit=crop";

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

  const statCards = [
    { icon: BookOpen, label: "Total", value: totalAssignments, accent: "#8FA6E0" },
    { icon: CheckCircle, label: "Completed", value: completedAssignments, accent: colors.mint },
    { icon: Clock, label: "Pending", value: pendingAssignments, accent: colors.coral },
    { icon: Activity, label: "Submitted", value: submittedAssignments, accent: colors.gold },
  ];

  const filters: { value: FilterType; label: string; icon: typeof BookOpen }[] = [
    { value: "all", label: "All", icon: BookOpen },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "submitted", label: "Submitted", icon: CheckCircle },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.md }}>Loading assignments…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchAssignments(true)} tintColor={colors.indigo} colors={[colors.indigo]} />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Cinematic photo hero — same language as the dashboards */}
            <View style={{ overflow: "hidden", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
              <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
                <LinearGradient
                  colors={["rgba(27,44,92,0.6)", "rgba(27,44,92,0.8)", "rgba(16,24,49,0.95)"]}
                  style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}
                >
                  <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <View style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={22} color={colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...type.h2, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>My Assignments</Text>
                      <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12.5, marginTop: 1 }}>
                        View, submit, and discuss your work
                      </Text>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(450).delay(80)}>
                    <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, padding: spacing.lg }}>
                        {statCards.map((s, idx) => (
                          <View
                            key={idx}
                            style={{
                              minWidth: "45%", flex: 1, borderRadius: radius.md, padding: spacing.md,
                              backgroundColor: "rgba(255,255,255,0.06)",
                              borderLeftWidth: 3, borderLeftColor: s.accent,
                            }}
                          >
                            <View style={{ width: 28, height: 28, borderRadius: radius.sm, backgroundColor: `${s.accent}30`, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }}>
                              <s.icon size={14} color={s.accent} />
                            </View>
                            <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 17 }}>{s.value}</Text>
                            <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.body, fontSize: 10.5 }}>{s.label}</Text>
                          </View>
                        ))}
                      </View>
                    </BlurView>
                  </Animated.View>
                </LinearGradient>
              </ImageBackground>
            </View>

            {/* Search + filters */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search assignments…"
                leftIcon={<Search size={18} color={colors.inkFaint} />}
                rightIcon={
                  searchQuery ? (
                    <AnimatedPressable pressScale={0.85} onPress={() => setSearchQuery("")} hitSlop={8}>
                      <X size={16} color={colors.inkFaint} />
                    </AnimatedPressable>
                  ) : undefined
                }
              />

              {/* Filter tabs */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: spacing.md }}>
                {filters.map((f) => {
                  const active = filter === f.value;
                  return (
                    <AnimatedPressable
                      key={f.value}
                      pressScale={0.95}
                      onPress={() => setFilter(f.value)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md,
                        backgroundColor: active ? colors.indigo : colors.surface,
                        borderWidth: active ? 0 : 1, borderColor: colors.border,
                      }}
                    >
                      <f.icon size={13} color={active ? colors.white : colors.inkMuted} />
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: active ? colors.white : colors.ink }}>
                        {f.label}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              {/* Subject chips */}
              {subjects.length > 0 && (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={["all", ...subjects]}
                  keyExtractor={(s) => s}
                  contentContainerStyle={{ gap: 8, marginTop: spacing.md }}
                  renderItem={({ item: s }) => {
                    const active = selectedSubject === s;
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedSubject(s)}
                        activeOpacity={0.7}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill,
                          backgroundColor: active ? colors.indigoTint : colors.surfaceMuted,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: active ? colors.indigo : colors.inkMuted }}>
                          {s === "all" ? "All Subjects" : s}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint, marginTop: spacing.md, marginBottom: 4 }}>
                Showing {filteredAssignments.length} of {totalAssignments} assignments
              </Text>
            </View>
          </View>
        }
        renderItem={({ item: assignment, index }) => (
          <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 60)}>
            <AssignmentCard
              assignment={assignment}
              onSubmit={() => setSubmitTarget(assignment)}
              onViewComments={() => setCommentsTarget(assignment)}
              onMarkCompleted={handleMarkCompleted}
            />
          </Animated.View>
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <FileText size={30} color={colors.inkFaint} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, marginBottom: 4 }}>
              No assignments found
            </Text>
            <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, textAlign: "center" }}>
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
