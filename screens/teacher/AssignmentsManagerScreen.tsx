import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, Alert, Linking, RefreshControl, ImageBackground, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  FadeInDown, FadeIn, FadeOut, ZoomIn, LinearTransition,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from "react-native-reanimated";
import {
  Plus, FileText, Calendar, Users, Download, Trash2, Search,
  MessageSquare, RefreshCw, X, Sparkles,
} from "lucide-react-native";
import api from "@/lib/api";
import type { TeacherAssignment, TeacherStudentProfile } from "@/types";
import CreateAssignmentModal from "@/components/teacher/CreateAssignmentModal";
import StudentProfileModal from "@/components/teacher/StudentProfileModal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import Skeleton from "@/components/ui/Skeleton";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Placeholder editorial photography — swap for your own classroom/institute photo before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80&auto=format&fit=crop";

type StatusFilter = "all" | "active" | "overdue" | "reviewed";

// ── Shared animated primitives ──────────────────────────────────────────

function useCountUp(target: number, duration = 700) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

function ProgressRing({ progress, size = 72, strokeWidth = 7, color = colors.gold, trackColor = "rgba(255,255,255,0.2)", label }: {
  progress: number; size?: number; strokeWidth?: number; color?: string; trackColor?: string; label?: string;
}) {
  const radiusPx = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const glow = useSharedValue(0.55);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size + 10, height: size + 10, borderRadius: 999, backgroundColor: `${color}30` }, glowStyle]} />
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radiusPx} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radiusPx}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          rotation={-90} origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: size < 60 ? 12 : 15 }}>{Math.round(progress * 100)}%</Text>
        {label ? <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.body, fontSize: 8 }}>{label}</Text> : null}
      </View>
    </View>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: typeof FileText; value: number; label: string }) {
  const count = useCountUp(value);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Icon size={12} color="rgba(255,255,255,0.7)" />
      <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{count}</Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: fonts.body, fontSize: 10.5 }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Pulsing coral dot — draws the eye to things needing attention.
function AttentionDot() {
  const glow = useSharedValue(0.4);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: glow.value }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.coral }, style]} />;
}

export default function AssignmentsManagerScreen() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  const now = Date.now();
  const withMeta = useMemo(
    () =>
      assignments.map((a) => {
        const overdue = new Date(a.dueDate).getTime() < now;
        const completedCount = a.submissions.filter((s) => s.isCompleted).length;
        const fullyReviewed = a.submissions.length > 0 && completedCount === a.submissions.length;
        return { a, overdue, completedCount, fullyReviewed };
      }),
    [assignments, now]
  );

  const subjects = useMemo(() => Array.from(new Set(assignments.map((a) => a.subject))).sort(), [assignments]);

  const filtered = withMeta.filter(({ a, overdue, fullyReviewed }) => {
    if (statusFilter === "active" && (overdue || fullyReviewed)) return false;
    if (statusFilter === "overdue" && !overdue) return false;
    if (statusFilter === "reviewed" && !fullyReviewed) return false;
    if (selectedSubject !== "all" && a.subject !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q) && !a.subject.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((s, a) => s + a.stats.totalSubmissions, 0);
  const totalComments = assignments.reduce((s, a) => s + a.stats.totalComments, 0);
  const totalCompleted = withMeta.reduce((s, { completedCount }) => s + completedCount, 0);
  const overallProgress = totalSubmissions > 0 ? totalCompleted / totalSubmissions : 0;
  const overdueCount = withMeta.filter((m) => m.overdue && !m.fullyReviewed).length;
  const reviewedCount = withMeta.filter((m) => m.fullyReviewed).length;

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

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "overdue", label: "Overdue" },
    { value: "reviewed", label: "Reviewed" },
  ];

  const listHeader = (
    <View>
      {/* Cinematic photo hero — same language as the dashboards */}
      <View style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: "hidden" }}>
        <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
          <LinearGradient colors={["rgba(27,44,92,0.6)", "rgba(27,44,92,0.8)", "rgba(16,24,49,0.95)"]} style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26 }}>
            <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 11, paddingVertical: 5, borderRadius: radius.pill, marginBottom: 10 }}>
                  <Sparkles size={11} color={colors.gold} />
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10.5 }}>Assignment Manager</Text>
                </View>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                  Track & Grade
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 }}>
                  {totalAssignments} assignments · {totalSubmissions} submissions
                </Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={() => fetchAssignments(true)} style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={15} color={colors.white} />
              </AnimatedPressable>
            </Animated.View>

            {/* Glass panel — aggregate completion ring + live counters, mirroring the dashboard's hero panel */}
            <Animated.View entering={FadeInDown.duration(450).delay(100)}>
              <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.lg }}>
                  <ProgressRing progress={overallProgress} label="DONE" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.4, marginBottom: 8 }}>OVERALL COMPLETION</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, columnGap: 16 }}>
                      <MiniStat icon={FileText} value={totalAssignments} label="assignments" />
                      <MiniStat icon={Users} value={totalSubmissions} label="submissions" />
                      <MiniStat icon={MessageSquare} value={totalComments} label="comments" />
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>
      </View>

      {/* Insight chips */}
      {(overdueCount > 0 || reviewedCount > 0) && (
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginTop: spacing.lg }}>
          {overdueCount > 0 && (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.coralTint, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 }}>
              <AttentionDot />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.coral, flex: 1 }}>{overdueCount} need attention</Text>
            </View>
          )}
          {reviewedCount > 0 && (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.goldTint, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Sparkles size={13} color={colors.gold} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.gold, flex: 1 }}>{reviewedCount} fully reviewed</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: 20, paddingTop: spacing.lg }}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search assignments…"
          leftIcon={<Search size={16} color={colors.inkFaint} />}
          rightIcon={searchQuery ? (
            <AnimatedPressable pressScale={0.85} onPress={() => setSearchQuery("")}>
              <X size={16} color={colors.inkFaint} />
            </AnimatedPressable>
          ) : undefined}
        />
        <View style={{ height: spacing.md }} />

        <View style={{ flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3, marginBottom: spacing.md }}>
          {statusTabs.map((t) => {
            const active = statusFilter === t.value;
            return (
              <AnimatedPressable
                key={t.value}
                pressScale={0.97}
                onPress={() => setStatusFilter(t.value)}
                style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm, backgroundColor: active ? colors.indigo : "transparent" }}
              >
                <Text style={{ fontFamily: active ? fonts.bodySemibold : fonts.bodyMedium, fontSize: 12, color: active ? colors.white : colors.inkMuted }}>{t.label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {subjects.length > 0 && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={["all", ...subjects]}
            keyExtractor={(s) => s}
            contentContainerStyle={{ gap: 8, marginBottom: spacing.md }}
            renderItem={({ item: s }) => {
              const active = selectedSubject === s;
              return (
                <AnimatedPressable pressScale={0.94} onPress={() => setSelectedSubject(s)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: active ? colors.indigoTint : colors.surface, borderWidth: 1, borderColor: active ? colors.indigo : colors.border }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: active ? colors.indigo : colors.inkMuted }}>{s === "all" ? "All Subjects" : s}</Text>
                </AnimatedPressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      {loading ? (
        <View>
          {listHeader}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {[0, 1, 2].map((i) => <Card key={i} padding="md"><Skeleton height={160} /></Card>)}
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={({ a }) => a.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAssignments(true)} tintColor={colors.indigo} colors={[colors.indigo]} />}
          ListHeaderComponent={listHeader}
          renderItem={({ item: { a, overdue, completedCount, fullyReviewed }, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 40)}>
              <AssignmentCard
                assignment={a}
                overdue={overdue}
                completedCount={completedCount}
                fullyReviewed={fullyReviewed}
                onDelete={() => handleDelete(a.id)}
                onDeleteComment={(commentId) => handleDeleteComment(a.id, commentId)}
                onViewStudent={setSelectedStudent}
              />
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: spacing.sm }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 20 }}>
              <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
                <FileText size={32} color={colors.indigo} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>No assignments found</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 4 }}>Try a different filter, or create your first one</Text>
            </View>
          }
        />
      )}

      {/* Floating create button — glowing, always reachable */}
      <Animated.View entering={ZoomIn.duration(350).delay(200)} style={{ position: "absolute", bottom: 24, right: 20 }}>
        <AnimatedPressable
          pressScale={0.9}
          onPress={() => setShowCreateModal(true)}
          style={{
            width: 58, height: 58, borderRadius: 29, backgroundColor: colors.gold,
            alignItems: "center", justifyContent: "center",
            shadowColor: colors.gold, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
          }}
        >
          <Plus size={26} color={colors.ink} />
        </AnimatedPressable>
      </Animated.View>

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

const SUBJECT_GRADIENTS: [string, string][] = [
  [colors.indigo, colors.indigoDark],
  ["#8A6D1F", "#5C4813"],
  [colors.mint, "#1F6B45"],
  [colors.coral, "#8E2E24"],
];
function gradientForSubject(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  return SUBJECT_GRADIENTS[Math.abs(hash) % SUBJECT_GRADIENTS.length];
}

function AvatarStack({ submissions, max = 4 }: { submissions: TeacherAssignment["submissions"]; max?: number }) {
  const shown = submissions.slice(0, max);
  const extra = submissions.length - shown.length;
  return (
    <View style={{ flexDirection: "row" }}>
      {shown.map((s, i) => (
        <View key={s.id} style={{ marginLeft: i === 0 ? 0 : -10, borderWidth: 2, borderColor: colors.surface, borderRadius: 16, zIndex: max - i }}>
          <Avatar name={s.student.name ?? "Student"} uri={s.student.avatar} size="sm" />
        </View>
      ))}
      {extra > 0 && (
        <View style={{ marginLeft: -10, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceMuted, borderWidth: 2, borderColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 10, color: colors.inkMuted }}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

function AssignmentCard({
  assignment, overdue, completedCount, fullyReviewed, onDelete, onDeleteComment, onViewStudent,
}: {
  assignment: TeacherAssignment;
  overdue: boolean;
  completedCount: number;
  fullyReviewed: boolean;
  onDelete: () => void;
  onDeleteComment: (commentId: string) => void;
  onViewStudent: (student: TeacherStudentProfile) => void;
}) {
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const dueDate = new Date(assignment.dueDate);
  const total = assignment.submissions.length;
  const ringProgress = total > 0 ? completedCount / total : 0;
  const [gradFrom, gradTo] = gradientForSubject(assignment.subject);

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={{ marginHorizontal: 20, marginBottom: 18 }}>
      <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        {/* Subject-tinted gradient header strip */}
        <LinearGradient colors={[gradFrom, gradTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15.5, color: colors.white }} numberOfLines={1}>{assignment.title}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodyMedium, fontSize: 10.5 }}>{assignment.subject}</Text>
                </View>
                <View style={{ backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodyMedium, fontSize: 10.5 }}>{assignment.class}</Text>
                </View>
              </View>
            </View>
            {fullyReviewed ? (
              <Animated.View entering={ZoomIn.duration(350)} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill }}>
                <Sparkles size={11} color={colors.gold} />
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 10, color: colors.ink }}>Reviewed</Text>
              </Animated.View>
            ) : overdue ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill }}>
                <AttentionDot />
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 10, color: colors.coral }}>Overdue</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.lg }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginBottom: spacing.md }} numberOfLines={2}>{assignment.description}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: spacing.lg }}>
            <Calendar size={12} color={colors.inkFaint} />
            <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }}>Due {dueDate.toLocaleDateString()}</Text>
          </View>

          {/* Completion ring + avatar stack, side by side */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md }}>
            <View style={{ width: 60, height: 60, alignItems: "center", justifyContent: "center" }}>
              <View style={{ position: "absolute", width: 60, height: 60, borderRadius: 30, backgroundColor: colors.indigo }} />
              <ProgressRing progress={ringProgress} size={60} strokeWidth={5} color={colors.mint} trackColor="rgba(255,255,255,0.25)" />
            </View>
            <View style={{ flex: 1 }}>
              {total > 0 ? (
                <>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink, marginBottom: 6 }}>{completedCount}/{total} completed</Text>
                  <AvatarStack submissions={assignment.submissions} />
                </>
              ) : (
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint }}>No submissions yet</Text>
              )}
            </View>
          </View>

          {assignment.submissions.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <AnimatedPressable pressScale={0.98} onPress={() => setShowSubmissions((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
                <Users size={13} color={colors.indigo} />
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.indigo }}>{showSubmissions ? "Hide" : "View"} Submissions ({assignment.submissions.length})</Text>
              </AnimatedPressable>
              {showSubmissions && (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }}>
                  {assignment.submissions.map((sub) => (
                    <View key={sub.id} style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                          <Avatar name={sub.student.name ?? "Student"} uri={sub.student.avatar} size="sm" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink }} numberOfLines={1}>{sub.student.name || "Unknown"}</Text>
                            <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted }} numberOfLines={1}>{sub.student.email}</Text>
                          </View>
                        </View>
                        <AnimatedPressable pressScale={0.92} onPress={() => onViewStudent(sub.student)} style={{ backgroundColor: colors.indigoTint, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm }}>
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 10.5, color: colors.indigo }}>Profile</Text>
                        </AnimatedPressable>
                      </View>
                      <AnimatedPressable pressScale={0.98} onPress={() => Linking.openURL(sub.fileUrl)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
                        <FileText size={12} color={colors.inkFaint} />
                        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: colors.indigo, flex: 1 }} numberOfLines={1}>{sub.fileName}</Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkFaint }}>({sub.fileSize})</Text>
                      </AnimatedPressable>
                      {sub.remarks ? <Text style={{ fontFamily: fonts.body, fontSize: 11.5, fontStyle: "italic", color: colors.inkMuted, marginBottom: spacing.sm }}>"{sub.remarks}"</Text> : null}
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkFaint }}>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</Text>
                        <Badge label={sub.status} tone={sub.isCompleted ? "success" : "gold"} />
                      </View>
                    </View>
                  ))}
                </Animated.View>
              )}
            </View>
          )}

          {assignment.comments.length > 0 && (
            <View style={{ marginBottom: spacing.md }}>
              <AnimatedPressable pressScale={0.98} onPress={() => setShowComments((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm }}>
                <MessageSquare size={13} color={colors.indigo} />
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.indigo }}>{showComments ? "Hide" : "View"} Comments ({assignment.comments.length})</Text>
              </AnimatedPressable>
              {showComments && (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }}>
                  {assignment.comments.map((c) => (
                    <View key={c.id} style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: spacing.sm }}>
                        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, flex: 1 }}>
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink }} numberOfLines={1}>{c.user.name || "Unknown"}</Text>
                          <Badge label={c.user.role} tone={c.user.role === "TEACHER" ? "gold" : "brand"} />
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkFaint }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                          <AnimatedPressable pressScale={0.85} onPress={() => onDeleteComment(c.id)}>
                            <Trash2 size={13} color={colors.coral} />
                          </AnimatedPressable>
                        </View>
                      </View>
                      <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.ink }}>{c.content}</Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="Download PDF" icon={Download} onPress={() => Linking.openURL(assignment.fileUrl)} style={{ flex: 1, justifyContent: "center" }} />
            <Button label="Delete" icon={Trash2} onPress={onDelete} variant="destructive" style={{ flex: 1, justifyContent: "center" }} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
