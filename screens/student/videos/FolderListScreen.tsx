import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator,  RefreshControl, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Play, Search, Clock, CheckCircle, Bookmark, X, Users } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import type { VideoFolder, WatchStats } from "@/types";
import type { VideosStackParamList } from "@/navigation/VideosStackNavigator";

type Nav = NativeStackNavigationProp<VideosStackParamList, "FolderList">;

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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#f43f5e" />
        <Text className="text-muted-foreground mt-3">Loading video library…</Text>
      </SafeAreaView>
    );
  }

  const statCards = stats
    ? [
        { icon: Clock, value: `${stats.watchTime.hours}h ${stats.watchTime.minutes}m`, label: "Watch Time", color: "#3b82f6" },
        { icon: CheckCircle, value: stats.completedVideos, label: "Completed", color: "#22c55e" },
        { icon: Play, value: stats.startedVideos, label: "Started", color: "#f43f5e" },
        { icon: Bookmark, value: stats.bookmarkedVideos, label: "Bookmarked", color: "#f59e0b" },
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredFolders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
        ListHeaderComponent={
          <View className="px-5 pt-4">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-11 h-11 bg-rose-600 rounded-xl items-center justify-center">
                <Play size={22} color="#fff" />
              </View>
              <View>
                <Text className="text-xl font-bold text-foreground">Video Library</Text>
                <Text className="text-xs text-muted-foreground">Recorded lectures from your teachers</Text>
              </View>
            </View>

            {stats && (
              <View className="flex-row flex-wrap gap-3 mb-5">
                {statCards.map((s, idx) => (
                  <View key={idx} className="bg-card rounded-2xl p-3 border border-border" style={{ minWidth: "45%" }}>
                    <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${s.color}20` }}>
                      <s.icon size={16} color={s.color} />
                    </View>
                    <Text className="text-lg font-bold text-foreground">{s.value}</Text>
                    <Text className="text-xs text-muted-foreground">{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4 bg-card">
              <Search size={18} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search folders, subjects, chapters…"
                className="flex-1 py-3 px-2 text-foreground"
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
                    className={`px-3.5 py-2 rounded-full ${
                      selectedSubject === s ? "bg-rose-600" : "bg-card border border-border"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${selectedSubject === s ? "text-white" : "text-foreground"}`}>
                      {s === "all" ? "All Subjects" : s}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        }
        renderItem={({ item: folder }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("FolderDetail", { folder })}
            activeOpacity={0.85}
            className="mx-5 mb-4 bg-card rounded-2xl border border-border overflow-hidden"
          >
            <View className="h-36 bg-rose-50">
              {folder.thumbnail ? (
                <Image source={{ uri: folder.thumbnail }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Play size={36} color="#fda4af" />
                </View>
              )}
              <View className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-md">
                <Text className="text-white text-[10px] font-semibold">{folder.videoCount} videos · {folder.totalDuration}</Text>
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row gap-1.5 mb-2">
                <View className="px-2 py-1 rounded-full bg-rose-100">
                  <Text className="text-[10px] font-bold text-rose-700">{folder.subject}</Text>
                </View>
                <View className="px-2 py-1 rounded-full bg-blue-100">
                  <Text className="text-[10px] font-bold text-blue-700">{folder.class}</Text>
                </View>
              </View>

              <Text className="font-bold text-foreground text-sm mb-1" numberOfLines={2}>{folder.name}</Text>
              {folder.chapter ? <Text className="text-xs text-muted-foreground mb-2">Ch. {folder.chapter}</Text> : null}

              <View className="flex-row items-center gap-1.5 mb-3">
                <Users size={12} color="#9ca3af" />
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{folder.teacher}</Text>
              </View>

              {/* Progress bar */}
              <View className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
                <View className="h-full bg-rose-500 rounded-full" style={{ width: `${folder.progress}%` }} />
              </View>
              <Text className="text-[10px] text-muted-foreground">
                {folder.completedCount}/{folder.videoCount} completed · {folder.progress}%
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <Play size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No video folders found</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">
              {searchQuery || selectedSubject !== "all" ? "Try adjusting your filters." : "Your teachers haven't uploaded any videos yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}