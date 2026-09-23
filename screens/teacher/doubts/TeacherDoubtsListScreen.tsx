import { useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from "react-native-reanimated";
import {
  MessageSquare, Search, Clock, CheckCircle2, AlertCircle,
  ThumbsUp, ArrowLeft, Sparkles, X,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import type { Doubt } from "@/types";
import type { TeacherRootStackParamList } from "@/navigation/TeacherRootNavigator";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = NativeStackNavigationProp<TeacherRootStackParamList, "Doubts">;

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

// Count-up used in the glass stat row — same celebratory beat as the dashboards.
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

function GlassStat({ icon: Icon, value, label, idx, total }: { icon: typeof MessageSquare; value: number; label: string; idx: number; total: number }) {
  const count = useCountUp(value);
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: spacing.lg, borderRightWidth: idx < total - 1 ? 1 : 0, borderRightColor: "rgba(255,255,255,0.12)" }}>
      <Icon size={14} color={colors.gold} style={{ marginBottom: 5 }} />
      <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 17 }}>{count}</Text>
      <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.body, fontSize: 9.5 }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Pulsing coral halo — draws the eye to unsolved urgent doubts needing attention.
function UrgentGlow() {
  const glow = useSharedValue(0.35);
  useEffect(() => {
    glow.value = withRepeat(withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: glow.value }));
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral }, style]} />;
}

export default function TeacherDoubtsListScreen() {
  const navigation = useNavigation<Nav>();
  const [allDoubts, setAllDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "solved">("all");
  const [subjectFilter, setSubjectFilter] = useState("All");

  const fetchDoubts = useCallback(async () => {
    try {
      const { data } = await api.get("/api/doubts");
      if (data.success) setAllDoubts(data.doubts);
    } catch (e) {
      console.error("Error fetching doubts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDoubts();
    }, [fetchDoubts])
  );

  const subjects = ["All", ...Array.from(new Set(allDoubts.map((d) => d.subject)))];

  const filtered = allDoubts.filter((d) => {
    if (filter === "open" && d.status !== "open") return false;
    if (filter === "solved" && d.status !== "solved") return false;
    if (subjectFilter !== "All" && d.subject !== subjectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: allDoubts.length,
    pending: allDoubts.filter((d) => !d.isSolved).length,
    solved: allDoubts.filter((d) => d.isSolved).length,
    highPriority: allDoubts.filter((d) => d.priority === "high" || d.priority === "urgent").length,
  };

  const statCards = [
    { icon: MessageSquare, value: stats.total, label: "Total" },
    { icon: Clock, value: stats.pending, label: "Pending" },
    { icon: CheckCircle2, value: stats.solved, label: "Solved" },
    { icon: AlertCircle, value: stats.highPriority, label: "High Priority" },
  ];

  const filters: { value: typeof filter; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Open Only" },
    { value: "solved", label: "Solved Only" },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.md }}>Loading doubts…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Cinematic banner */}
            <View style={{ overflow: "hidden", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
              <LinearGradient colors={[colors.indigoDark, colors.indigo]} style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26 }}>
                <View pointerEvents="none" style={{ position: "absolute", top: -50, right: -40, width: 160, height: 160, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.05)" }} />
                <View pointerEvents="none" style={{ position: "absolute", top: 40, right: 50, width: 70, height: 70, borderRadius: 999, backgroundColor: "rgba(201,154,46,0.14)" }} />

                <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg }}>
                  <AnimatedPressable
                    pressScale={0.9}
                    onPress={() => navigation.goBack()}
                    style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}
                  >
                    <ArrowLeft size={18} color={colors.white} />
                  </AnimatedPressable>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginBottom: 6 }}>
                      <Sparkles size={10} color={colors.gold} />
                      <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>Doubt Manager</Text>
                    </View>
                    <Text style={{ ...type.h2, fontSize: 21, color: colors.white, textShadowColor: "rgba(0,0,0,0.25)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 }}>
                      Answer Students
                    </Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(400).delay(80)}>
                  <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                    <View style={{ flexDirection: "row" }}>
                      {statCards.map((s, idx) => <GlassStat key={idx} {...s} idx={idx} total={statCards.length} />)}
                    </View>
                  </BlurView>
                </Animated.View>
              </LinearGradient>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.surface, marginBottom: spacing.md }}>
                <Search size={16} color={colors.inkFaint} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search doubts…"
                  placeholderTextColor={colors.inkFaint}
                  style={{ flex: 1, paddingVertical: 11, paddingHorizontal: spacing.sm, color: colors.ink, fontFamily: fonts.body, fontSize: 14 }}
                />
                {searchQuery ? (
                  <AnimatedPressable pressScale={0.85} onPress={() => setSearchQuery("")} hitSlop={8}>
                    <X size={14} color={colors.inkFaint} />
                  </AnimatedPressable>
                ) : null}
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filters}
                keyExtractor={(f) => f.value}
                contentContainerStyle={{ gap: 8, marginBottom: spacing.sm }}
                renderItem={({ item: f }) => {
                  const active = filter === f.value;
                  return (
                    <AnimatedPressable pressScale={0.95} onPress={() => setFilter(f.value)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: active ? colors.indigo : colors.surface, borderWidth: active ? 0 : 1, borderColor: colors.border }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: active ? colors.white : colors.ink }}>{f.label}</Text>
                    </AnimatedPressable>
                  );
                }}
              />

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={subjects}
                keyExtractor={(s) => s}
                contentContainerStyle={{ gap: 8, marginBottom: spacing.md }}
                renderItem={({ item: s }) => {
                  const active = subjectFilter === s;
                  return (
                    <AnimatedPressable onPress={() => setSubjectFilter(s)} pressScale={0.95} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: active ? colors.indigoTint : colors.surfaceMuted }}>
                      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: active ? colors.indigo : colors.inkMuted }}>{s}</Text>
                    </AnimatedPressable>
                  );
                }}
              />
            </View>
          </View>
        }
        renderItem={({ item: doubt, index }) => {
          const isUrgent = doubt.priority === "urgent" && !doubt.isSolved;
          return (
            <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 45)}>
              <AnimatedPressable
                onPress={() => navigation.navigate("DoubtDetail", { doubt })}
                pressScale={0.98}
                style={{
                  marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.surface,
                  borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border,
                  borderLeftWidth: 3, borderLeftColor: doubt.isSolved ? colors.mint : isUrgent ? colors.coral : colors.indigo,
                }}
              >
                {isUrgent && <UrgentGlow />}
                <View style={{ padding: spacing.lg }}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {doubt.student.avatar ? (
                        <Image source={{ uri: doubt.student.avatar }} style={{ width: "100%", height: "100%" }} />
                      ) : (
                        <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{doubt.student.name.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, flex: 1 }} numberOfLines={1}>{doubt.title}</Text>
                        {doubt.isSolved && <Badge label="Solved" tone="success" />}
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm }}>
                        <Text style={{ ...type.caption, color: colors.inkMuted }}>{doubt.student.name}</Text>
                        <Text style={{ ...type.caption, color: colors.inkFaint }}>•</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                          <Clock size={10} color={colors.inkFaint} />
                          <Text style={{ ...type.caption, color: colors.inkMuted }}>{formatTimeAgo(doubt.createdAt)}</Text>
                        </View>
                        <Badge label={doubt.subject} tone="brand" />
                        {PRIORITY_TONE[doubt.priority] && <Badge label={doubt.priority} tone={PRIORITY_TONE[doubt.priority]} />}
                      </View>

                      <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: spacing.sm }} numberOfLines={2}>{doubt.description}</Text>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <MessageSquare size={13} color={colors.inkFaint} />
                          <Text style={{ ...type.caption, color: colors.inkMuted }}>{doubt.stats.totalReplies} replies</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <ThumbsUp size={13} color={colors.inkFaint} />
                          <Text style={{ ...type.caption, color: colors.inkMuted }}>{doubt.stats.totalUpvotes} votes</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            </Animated.View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 20 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <MessageSquare size={32} color={colors.indigo} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>No doubts found</Text>
            <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 4 }}>No doubts match your current filters.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
