import { useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import {
  MessageSquare, Search, ThumbsUp, Clock, CheckCircle2,
  Users, TrendingUp, ArrowLeft, Plus, ImageIcon, FileText, X,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import type { Doubt } from "@/types";
import type { StudentRootStackParamList } from "@/navigation/StudentRootNavigator";
import AskDoubtModal from "@/components/doubt/AskDoubtModal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = NativeStackNavigationProp<StudentRootStackParamList, "Doubts">;

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

export default function DoubtsListScreen() {
  const navigation = useNavigation<Nav>();
  const [allDoubts, setAllDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "solved" | "myDoubts">("all");
  const [showAskModal, setShowAskModal] = useState(false);

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

  const filtered = allDoubts.filter((d) => {
    if (filter === "open" && d.status !== "open") return false;
    if (filter === "solved" && d.status !== "solved") return false;
    if (filter === "myDoubts" && !d.isMyDoubt) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const statChips = [
    { icon: MessageSquare, value: allDoubts.length, label: "Total", accent: colors.indigo },
    { icon: CheckCircle2, value: allDoubts.filter((d) => d.isSolved).length, label: "Solved", accent: colors.mint },
    { icon: Users, value: allDoubts.filter((d) => d.isMyDoubt).length, label: "Mine", accent: colors.gold },
    { icon: TrendingUp, value: allDoubts.filter((d) => !d.isSolved).length, label: "Active", accent: colors.coral },
  ];

  const filters: { value: typeof filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "solved", label: "Solved" },
    { value: "myDoubts", label: "My Doubts" },
  ];

  const handleUpvote = async (doubtId: string) => {
    setAllDoubts((prev) =>
      prev.map((d) =>
        d.id !== doubtId
          ? d
          : { ...d, hasUpvoted: !d.hasUpvoted, stats: { ...d.stats, totalUpvotes: d.hasUpvoted ? d.stats.totalUpvotes - 1 : d.stats.totalUpvotes + 1 } }
      )
    );
    try {
      await api.patch("/api/doubts", { doubtId, action: "upvote" });
    } catch (e) {
      console.error("Upvote failed:", e);
      fetchDoubts();
    }
  };

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
      {/* Flat header — no gradient hero here, deliberately different from other screens */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.paper }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <AnimatedPressable
            pressScale={0.9}
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={18} color={colors.ink} />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.h2, fontSize: 19, color: colors.ink }}>Discussion Forum</Text>
            <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 1 }}>Ask, answer, and help each other</Text>
          </View>
          <AnimatedPressable
            pressScale={0.93}
            onPress={() => setShowAskModal(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.indigo, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 }}
          >
            <Plus size={15} color={colors.white} />
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.white }}>Ask</Text>
          </AnimatedPressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Horizontal stat-chip strip — distinct from the tile-grid pattern used elsewhere */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={statChips}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}
              renderItem={({ item: s, index }) => (
                <Animated.View entering={FadeInRight.duration(320).delay(index * 60)}>
                  <View
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 8,
                      backgroundColor: colors.surface, borderRadius: radius.pill,
                      borderWidth: 1, borderColor: colors.border,
                      paddingLeft: 6, paddingRight: 14, paddingVertical: 6,
                    }}
                  >
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: `${s.accent}20`, alignItems: "center", justifyContent: "center" }}>
                      <s.icon size={13} color={s.accent} />
                    </View>
                    <Text style={{ fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink }}>{s.value}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }}>{s.label}</Text>
                  </View>
                </Animated.View>
              )}
            />

            {/* Search + filters */}
            <View style={{ paddingHorizontal: 20, paddingTop: spacing.md }}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search doubts…"
                leftIcon={<Search size={18} color={colors.inkFaint} />}
                rightIcon={
                  searchQuery ? (
                    <AnimatedPressable pressScale={0.85} onPress={() => setSearchQuery("")} hitSlop={8}>
                      <X size={16} color={colors.inkFaint} />
                    </AnimatedPressable>
                  ) : undefined
                }
              />

              {/* Underline-style segmented filter, distinct from pill tabs used elsewhere */}
              <View style={{ flexDirection: "row", marginTop: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                {filters.map((f) => {
                  const active = filter === f.value;
                  return (
                    <AnimatedPressable
                      key={f.value}
                      pressScale={0.96}
                      onPress={() => setFilter(f.value)}
                      style={{ marginRight: 22, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: active ? colors.indigo : "transparent" }}
                    >
                      <Text style={{ fontFamily: active ? fonts.bodySemibold : fonts.bodyMedium, fontSize: 13, color: active ? colors.indigo : colors.inkMuted }}>
                        {f.label}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          </View>
        }
        renderItem={({ item: doubt, index }) => (
          <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 50)}>
            <AnimatedPressable
              onPress={() => navigation.navigate("DoubtDetail", { doubt })}
              pressScale={0.98}
              style={{
                marginHorizontal: 20, marginTop: 14, backgroundColor: colors.surface,
                borderRadius: radius.md, overflow: "hidden",
                borderWidth: 1, borderColor: colors.border,
                borderLeftWidth: 3, borderLeftColor: doubt.isSolved ? colors.mint : colors.indigo,
              }}
            >
              <View style={{ padding: spacing.lg }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {doubt.student.avatar ? (
                      <Image source={{ uri: doubt.student.avatar }} style={{ width: "100%", height: "100%" }} />
                    ) : (
                      <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>
                        {doubt.student.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, flex: 1 }} numberOfLines={1}>
                        {doubt.title}
                      </Text>
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

                    <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: spacing.sm }} numberOfLines={2}>
                      {doubt.description}
                    </Text>

                    {(doubt.imageUrl || doubt.pdfUrl) && (
                      <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.sm }}>
                        {doubt.imageUrl && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.indigoTint, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm }}>
                            <ImageIcon size={11} color={colors.indigo} />
                            <Text style={{ fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.indigo }}>Image</Text>
                          </View>
                        )}
                        {doubt.pdfUrl && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.coralTint, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm }}>
                            <FileText size={11} color={colors.coral} />
                            <Text style={{ fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.coral }}>PDF</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
                      <AnimatedPressable pressScale={0.9} onPress={() => handleUpvote(doubt.id)} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <ThumbsUp size={13} color={doubt.hasUpvoted ? colors.indigo : colors.inkFaint} fill={doubt.hasUpvoted ? colors.indigo : "none"} />
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: doubt.hasUpvoted ? colors.indigo : colors.inkMuted }}>
                          {doubt.stats.totalUpvotes}
                        </Text>
                      </AnimatedPressable>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <MessageSquare size={13} color={colors.inkFaint} />
                        <Text style={{ ...type.caption, color: colors.inkMuted }}>{doubt.stats.totalReplies}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </AnimatedPressable>
          </Animated.View>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <MessageSquare size={30} color={colors.inkFaint} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, marginBottom: 4 }}>No doubts found</Text>
            <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, textAlign: "center" }}>Be the first to ask a question!</Text>
          </View>
        }
      />

      <AskDoubtModal
        visible={showAskModal}
        onClose={() => setShowAskModal(false)}
        onSuccess={() => {
          setShowAskModal(false);
          fetchDoubts();
        }}
      />
    </SafeAreaView>
  );
}
