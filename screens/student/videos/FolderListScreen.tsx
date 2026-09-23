import { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Dimensions, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Play, Search, Clock, CheckCircle, Bookmark, X, Users, Video as VideoIcon } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import type { VideoFolder, WatchStats } from "@/types";
import type { VideosStackParamList } from "@/navigation/VideosStackNavigator";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { MiniStat } from "@/components/ui/StatPrimitives";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = NativeStackNavigationProp<VideosStackParamList, "FolderList">;

// Placeholder editorial photography — swap for your own studio/recording setup photo before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1587691592099-24045742c181?w=1200&q=80&auto=format&fit=crop";

export default function FolderListScreen() {
  const navigation = useNavigation<Nav>();
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [stats, setStats] = useState<WatchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [foldersRes, statsRes] = await Promise.all([
        api.get("/api/student/video-folders"),
        api.get("/api/student/watch-stats"),
      ]);
      setFolders(foldersRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error("Error fetching video data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subjects = useMemo(() => Array.from(new Set(folders.map((f) => f.subject))).sort(), [folders]);

  const filteredFolders = useMemo(() => {
    let list = [...folders];
    if (selectedSubject !== "all") list = list.filter((f) => f.subject === selectedSubject);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.subject.toLowerCase().includes(q) ||
          (f.chapter?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [folders, selectedSubject, searchQuery]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.md }}>Loading video library…</Text>
      </SafeAreaView>
    );
  }

  const statCards = stats
    ? [
        { icon: Clock, value: `${stats.watchTime.hours}h ${stats.watchTime.minutes}m`, label: "Watch Time", accent: "#8FA6E0" },
        { icon: CheckCircle, value: stats.completedVideos, label: "Completed", accent: colors.mint },
        { icon: Play, value: stats.startedVideos, label: "Started", accent: colors.coral },
        { icon: Bookmark, value: stats.bookmarkedVideos, label: "Bookmarked", accent: colors.gold },
      ]
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <FlatList
        data={filteredFolders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.indigo} colors={[colors.indigo]} />
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
                      <Play size={22} color={colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...type.h2, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>Video Library</Text>
                      <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12.5, marginTop: 1 }}>
                        Recorded lectures from your teachers
                      </Text>
                    </View>
                  </Animated.View>

                  {stats && (
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
                  )}
                </LinearGradient>
              </ImageBackground>
            </View>

            {/* Search + filters */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search folders, subjects, chapters…"
                leftIcon={<Search size={18} color={colors.inkFaint} />}
                rightIcon={
                  searchQuery ? (
                    <AnimatedPressable pressScale={0.85} onPress={() => setSearchQuery("")} hitSlop={8}>
                      <X size={16} color={colors.inkFaint} />
                    </AnimatedPressable>
                  ) : undefined
                }
              />

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
                      <AnimatedPressable
                        pressScale={0.95}
                        onPress={() => setSelectedSubject(s)}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill,
                          backgroundColor: active ? colors.indigo : colors.surface,
                          borderWidth: active ? 0 : 1, borderColor: colors.border,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: active ? colors.white : colors.ink }}>
                          {s === "all" ? "All Subjects" : s}
                        </Text>
                      </AnimatedPressable>
                    );
                  }}
                />
              )}

              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint, marginTop: spacing.md, marginBottom: 4 }}>
                {filteredFolders.length} {filteredFolders.length === 1 ? "folder" : "folders"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item: folder, index }) => (
          <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 60)}>
            <AnimatedPressable
              onPress={() => navigation.navigate("FolderDetail", { folder })}
              pressScale={0.98}
              style={{
                marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.surface,
                borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden",
              }}
            >
              <View style={{ height: 150, backgroundColor: colors.indigoTint }}>
                {folder.thumbnail ? (
                  <Image source={{ uri: folder.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <VideoIcon size={34} color={colors.indigo} />
                  </View>
                )}
                <LinearGradient
                  colors={["transparent", "rgba(23,25,35,0.55)"]}
                  style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60 }}
                  pointerEvents="none"
                />
                <View style={{ position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(23,25,35,0.75)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10.5 }}>
                    {folder.videoCount} videos · {folder.totalDuration}
                  </Text>
                </View>
                <View style={{ position: "absolute", top: 10, left: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" }}>
                  <Play size={15} color={colors.indigo} fill={colors.indigo} />
                </View>
              </View>

              <View style={{ padding: spacing.lg }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm }}>
                  <Badge label={folder.subject} tone="brand" />
                  <Badge label={folder.class} tone="neutral" />
                </View>

                <Text style={{ ...type.h3, fontSize: 15.5, color: colors.ink, marginBottom: 2 }} numberOfLines={2}>
                  {folder.name}
                </Text>
                {folder.chapter ? (
                  <Text style={{ ...type.caption, color: colors.inkMuted, marginBottom: spacing.sm }}>Ch. {folder.chapter}</Text>
                ) : null}

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.md }}>
                  <Users size={12} color={colors.inkFaint} />
                  <Text style={{ ...type.caption, color: colors.inkMuted }} numberOfLines={1}>{folder.teacher}</Text>
                </View>

                {/* Progress bar */}
                <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: "hidden", marginBottom: 6 }}>
                  <View style={{ height: "100%", width: `${folder.progress}%`, borderRadius: radius.pill, backgroundColor: folder.progress >= 100 ? colors.mint : colors.indigo }} />
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkFaint }}>
                  {folder.completedCount}/{folder.videoCount} completed · {folder.progress}%
                </Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <Play size={30} color={colors.inkFaint} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, marginBottom: 4 }}>
              No video folders found
            </Text>
            <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, textAlign: "center" }}>
              {searchQuery || selectedSubject !== "all" ? "Try adjusting your filters." : "Your teachers haven't uploaded any videos yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
