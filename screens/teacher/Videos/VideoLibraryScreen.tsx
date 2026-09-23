import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator, Alert, Image, RefreshControl, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import {
  FolderPlus, Search, Folder, FileVideo, Eye, Edit, Trash2,
  Play, Globe, Lock, RefreshCw, Sparkles,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import type { TeacherVideoFolder, YouTubeSyncStatus } from "@/types";
import type { TeacherVideosStackParamList } from "@/navigation/TeacherVideosStackNavigator";
import FolderFormModal from "@/components/teacher/FolderFormModal";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import ProgressRing from "@/components/ui/ProgressRing";
import { MiniStat } from "@/components/ui/StatPrimitives";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

// Placeholder editorial photography — swap for a real photo of your recording setup.
const HERO_PHOTO = "https://images.unsplash.com/photo-1637065463674-4595b7f32adc?w=1200&q=80&auto=format&fit=crop";

type Nav = NativeStackNavigationProp<TeacherVideosStackParamList, "FolderList">;
type Tab = "library" | "youtube";

export default function VideoLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>("library");
  const [folders, setFolders] = useState<TeacherVideoFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<TeacherVideoFolder | null>(null);

  const [syncStatus, setSyncStatus] = useState<YouTubeSyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchFolders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/api/teacher/video-folders");
      setFolders(data);
    } catch (e) {
      console.error("Error fetching folders:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    setSyncLoading(true);
    try {
      const { data } = await api.get("/api/teacher/youtube-channel-sync");
      setSyncStatus(data);
    } catch (e) {
      console.error("Error fetching sync status:", e);
    } finally {
      setSyncLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
    fetchSyncStatus();
  }, [fetchFolders, fetchSyncStatus]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post("/api/teacher/youtube-channel-sync", {});
      if (data.error) {
        Alert.alert("Sync failed", data.error);
      } else {
        Alert.alert("Sync complete", `${data.created} new, ${data.updated} updated, ${data.removed} removed out of ${data.total} videos.`);
        fetchFolders();
        fetchSyncStatus();
      }
    } catch (err: any) {
      Alert.alert("Sync failed", err.response?.data?.error || "Something went wrong");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete folder?", "All videos inside will be deleted too.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setFolders((prev) => prev.filter((f) => f.id !== id));
          try {
            await api.delete(`/api/teacher/video-folders/${id}`);
          } catch (e) { console.error(e); fetchFolders(); }
        },
      },
    ]);
  };

  const filteredFolders = folders.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q) || f.chapter.toLowerCase().includes(q);
  });

  const totalVideos = folders.reduce((s, f) => s + f.videoCount, 0);
  const totalViews = folders.reduce((s, f) => s + f.totalViews, 0);
  const youtubeCount = folders.filter((f) => f.youtubePlaylistId).length;
  const publicCount = folders.filter((f) => f.isPublic).length;
  const publicRatio = folders.length > 0 ? publicCount / folders.length : 0;

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
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10.5 }}>Video Library</Text>
                </View>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                  Lecture Vault
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 }}>{folders.length} folders · {totalVideos} videos</Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={() => { fetchFolders(true); fetchSyncStatus(); }} style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={15} color={colors.white} />
              </AnimatedPressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(450).delay(100)}>
              <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.lg }}>
                  <ProgressRing progress={publicRatio} label="PUBLIC" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.4, marginBottom: 8 }}>LIBRARY OVERVIEW</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, columnGap: 16 }}>
                      <MiniStat icon={FileVideo} value={totalVideos} label="videos" />
                      <MiniStat icon={Play} value={youtubeCount} label="synced" />
                      <MiniStat icon={Eye} value={totalViews} label="views" />
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: spacing.lg }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3, marginBottom: spacing.lg }}>
          {([
            { id: "library" as const, icon: Folder, label: "Video Library" },
            { id: "youtube" as const, icon: Play, label: "YouTube Sync" },
          ]).map((t) => {
            const active = tab === t.id;
            return (
              <AnimatedPressable key={t.id} pressScale={0.97} onPress={() => setTab(t.id)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: radius.sm, backgroundColor: active ? colors.indigo : "transparent" }}>
                <t.icon size={13} color={active ? colors.white : colors.inkMuted} />
                <Text style={{ fontFamily: active ? fonts.bodySemibold : fonts.bodyMedium, fontSize: 12, color: active ? colors.white : colors.inkMuted }}>{t.label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {tab === "library" && (
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, backgroundColor: colors.surface, marginBottom: spacing.sm }}>
            <Search size={16} color={colors.inkFaint} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search folders, subjects…"
              placeholderTextColor={colors.inkFaint}
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontFamily: fonts.body, fontSize: 13, color: colors.ink }}
            />
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 12 }}>Loading video library…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      {tab === "youtube" ? (
        <View style={{ flex: 1 }}>
          {listHeader}
          <View style={{ paddingHorizontal: 20 }}>
            {syncLoading ? (
              <ActivityIndicator color={colors.indigo} style={{ marginTop: 32 }} />
            ) : (
              <>
                <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.md }}>
                    {syncStatus?.channelThumbnail ? (
                      <Image source={{ uri: syncStatus.channelThumbnail }} style={{ width: 48, height: 48, borderRadius: 999 }} />
                    ) : (
                      <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: colors.coralTint, alignItems: "center", justifyContent: "center" }}>
                        <Play size={22} color={colors.coral} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }} numberOfLines={1}>{syncStatus?.channelTitle || "Your Channel"}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>{syncStatus?.subscriberCount || "0"} subscribers · {syncStatus?.videoCount || "0"} videos</Text>
                    </View>
                  </View>
                  <AnimatedPressable pressScale={0.96} onPress={handleSync} disabled={syncing} style={{ backgroundColor: colors.indigo, borderRadius: radius.md, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: syncing ? 0.6 : 1 }}>
                    {syncing ? <ActivityIndicator color={colors.white} size="small" /> : <RefreshCw size={15} color={colors.white} />}
                    <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{syncing ? "Syncing…" : "Sync Now"}</Text>
                  </AnimatedPressable>
                </View>

                {syncStatus?.folder && (
                  <AnimatedPressable
                    pressScale={0.98}
                    onPress={() => {
                      const f = folders.find((x) => x.id === syncStatus.folder!.id);
                      if (f) navigation.navigate("FolderVideos", { folder: f });
                    }}
                    style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}
                  >
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, marginBottom: 4 }}>{syncStatus.folder.name}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.md }}>{syncStatus.folder.videoCount} videos synced</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {syncStatus.folder.videos.slice(0, 3).map((v) => (
                        <Image key={v.id} source={{ uri: v.thumbnail }} style={{ flex: 1, height: 64, borderRadius: radius.sm }} resizeMode="cover" />
                      ))}
                    </View>
                  </AnimatedPressable>
                )}
              </>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredFolders}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFolders(true)} tintColor={colors.indigo} colors={[colors.indigo]} />}
          ListHeaderComponent={listHeader}
          renderItem={({ item: folder, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index, 6) * 60).springify().damping(15)}>
              <AnimatedPressable pressScale={0.98} onPress={() => navigation.navigate("FolderVideos", { folder })} style={{ marginHorizontal: 20, marginBottom: 18 }}>
                <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ height: 140, backgroundColor: colors.coralTint, position: "relative" }}>
                    {folder.thumbnail ? (
                      <Image source={{ uri: folder.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                        {folder.youtubePlaylistId ? <Play size={38} color={colors.coral} /> : <Folder size={38} color={colors.coral} />}
                      </View>
                    )}
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.55)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60 }} />
                    <View style={{ position: "absolute", bottom: 10, left: 10, right: 10, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <Badge label={folder.subject} tone="danger" />
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {folder.youtubePlaylistId && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(193,68,58,0.9)", paddingHorizontal: 7, paddingVertical: 4, borderRadius: radius.pill }}>
                            <Play size={8} color={colors.white} />
                            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 9 }}>YT</Text>
                          </View>
                        )}
                        <View style={{ backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill }}>
                          <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>{folder.videoCount} videos</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ padding: spacing.lg }}>
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, marginBottom: 6 }} numberOfLines={1}>{folder.name}</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm }}>
                      <Badge label={folder.class} tone="brand" />
                      {folder.isPublic ? <Badge label="Public" tone="success" /> : <Badge label="Private" tone="gold" />}
                    </View>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.md }} numberOfLines={1}>{folder.chapter}</Text>

                    <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.md }}>
                      {[
                        { label: "Videos", value: folder.videoCount },
                        { label: "Duration", value: folder.totalDuration },
                        { label: "Views", value: folder.totalViews },
                      ].map(({ label, value }) => (
                        <View key={label} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted }}>
                          <Text style={{ fontFamily: fonts.body, fontSize: 9, color: colors.inkFaint, marginBottom: 1 }}>{label}</Text>
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink }}>{value}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <AnimatedPressable pressScale={0.96} onPress={() => navigation.navigate("FolderVideos", { folder })} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.indigo, borderRadius: radius.sm, paddingVertical: 11 }}>
                        <Play size={13} color={colors.white} />
                        <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>View Videos</Text>
                      </AnimatedPressable>
                      <AnimatedPressable pressScale={0.9} onPress={() => setEditingFolder(folder)} style={{ width: 40, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm }}>
                        <Edit size={14} color={colors.inkMuted} />
                      </AnimatedPressable>
                      <AnimatedPressable pressScale={0.9} onPress={() => handleDelete(folder.id)} style={{ width: 40, alignItems: "center", justifyContent: "center", backgroundColor: colors.coralTint, borderRadius: radius.sm }}>
                        <Trash2 size={14} color={colors.coral} />
                      </AnimatedPressable>
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 20 }}>
              <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.coralTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
                <Folder size={32} color={colors.coral} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>No folders yet</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 4 }}>Sync your YouTube channel or create a folder manually</Text>
            </View>
          }
        />
      )}

      {tab === "library" && (
        <Animated.View entering={ZoomIn.duration(350).delay(200)} style={{ position: "absolute", bottom: 24, right: 20 }}>
          <AnimatedPressable
            pressScale={0.9}
            onPress={() => setShowCreateModal(true)}
            style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.coral, alignItems: "center", justifyContent: "center", shadowColor: colors.coral, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
          >
            <FolderPlus size={24} color={colors.white} />
          </AnimatedPressable>
        </Animated.View>
      )}

      <FolderFormModal
        visible={showCreateModal}
        mode="create"
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { setShowCreateModal(false); fetchFolders(); }}
      />
      <FolderFormModal
        visible={!!editingFolder}
        mode="edit"
        folder={editingFolder}
        onClose={() => setEditingFolder(null)}
        onSuccess={() => { setEditingFolder(null); fetchFolders(); }}
      />
    </SafeAreaView>
  );
}
