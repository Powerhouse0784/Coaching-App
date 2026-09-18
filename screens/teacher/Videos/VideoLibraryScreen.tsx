import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Image, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FolderPlus, Search, Folder,  FileVideo, Eye, Edit, Trash2,
  Play, Globe, Lock, RefreshCw,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import type { TeacherVideoFolder, YouTubeSyncStatus } from "@/types";
import type { TeacherVideosStackParamList } from "@/navigation/TeacherVideosStackNavigator";
import FolderFormModal from "@/components/teacher/FolderFormModal";

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
        Alert.alert(
          "Sync complete",
          `${data.created} new, ${data.updated} updated, ${data.removed} removed out of ${data.total} videos.`
        );
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
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setFolders((prev) => prev.filter((f) => f.id !== id));
          try {
            await api.delete(`/api/teacher/video-folders/${id}`);
          } catch (e) {
            console.error(e);
            fetchFolders();
          }
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="text-muted-foreground mt-3">Loading video library…</Text>
      </SafeAreaView>
    );
  }

  const stats = [
    { icon: Folder, value: folders.length, label: "Folders", color: "#a855f7" },
    { icon: Play , value: youtubeCount, label: "YouTube", color: "#ef4444" },
    { icon: FileVideo, value: totalVideos, label: "Videos", color: "#3b82f6" },
    { icon: Eye, value: totalViews, label: "Views", color: "#22c55e" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xl font-bold text-foreground">Video Library Manager</Text>
            <Text className="text-xs text-muted-foreground">Manage your YouTube lecture videos</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-purple-600 rounded-xl px-3.5 py-2.5 flex-row items-center gap-1.5"
          >
            <FolderPlus size={15} color="#fff" />
            <Text className="text-white text-xs font-semibold">New</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-4">
          {stats.map((s, idx) => (
            <View key={idx} className="bg-card rounded-2xl p-3 border border-border" style={{ minWidth: "22%", flex: 1 }}>
              <View className="w-8 h-8 rounded-xl items-center justify-center mb-1.5" style={{ backgroundColor: `${s.color}20` }}>
                <s.icon size={14} color={s.color} />
              </View>
              <Text className="text-base font-bold text-foreground">{s.value}</Text>
              <Text className="text-[9px] text-muted-foreground">{s.label}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row bg-card rounded-2xl border border-border p-1 mb-4">
          {([
            { id: "library" as const, label: "📁 Video Library" },
            { id: "youtube" as const, label: "▶️ YouTube Sync" },
          ]).map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              className="flex-1 items-center py-2.5 rounded-xl"
              style={{ backgroundColor: tab === t.id ? "#ef4444" : "transparent" }}
            >
              <Text className={`text-xs font-semibold ${tab === t.id ? "text-white" : "text-muted-foreground"}`}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === "youtube" ? (
        <View className="px-5">
          {syncLoading ? (
            <ActivityIndicator color="#ef4444" className="mt-8" />
          ) : (
            <>
              <View className="bg-card rounded-2xl border-2 border-border p-4 mb-4">
                <View className="flex-row items-center gap-3 mb-3">
                  {syncStatus?.channelThumbnail ? (
                    <Image source={{ uri: syncStatus.channelThumbnail }} className="w-12 h-12 rounded-full" />
                  ) : (
                    <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center">
                      <Play  size={22} color="#ef4444" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{syncStatus?.channelTitle || "Your Channel"}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {syncStatus?.subscriberCount || "0"} subscribers · {syncStatus?.videoCount || "0"} videos
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSync}
                  disabled={syncing}
                  className="bg-red-500 rounded-xl py-3 items-center flex-row justify-center gap-2"
                  style={{ opacity: syncing ? 0.6 : 1 }}
                >
                  {syncing ? <ActivityIndicator color="#fff" size="small" /> : <RefreshCw size={15} color="#fff" />}
                  <Text className="text-white font-semibold text-sm">{syncing ? "Syncing…" : "Sync Now"}</Text>
                </TouchableOpacity>
              </View>

              {syncStatus?.folder && (
                <TouchableOpacity
                  onPress={() => {
                    const f = folders.find((x) => x.id === syncStatus.folder!.id);
                    if (f) navigation.navigate("FolderVideos", { folder: f });
                  }}
                  className="bg-card rounded-2xl border-2 border-border p-4"
                >
                  <Text className="font-bold text-foreground text-sm mb-2">{syncStatus.folder.name}</Text>
                  <Text className="text-xs text-muted-foreground mb-3">{syncStatus.folder.videoCount} videos synced</Text>
                  <View className="flex-row gap-2">
                    {syncStatus.folder.videos.slice(0, 3).map((v) => (
                      <Image key={v.id} source={{ uri: v.thumbnail }} className="flex-1 h-16 rounded-lg" resizeMode="cover" />
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFolders}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFolders(true)} />}
          ListHeaderComponent={
            <View className="px-5 mb-1">
              <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4 bg-card">
                <Search size={16} color="#9ca3af" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search folders, subjects…"
                  className="flex-1 py-2.5 px-2 text-foreground text-sm"
                />
              </View>
            </View>
          }
          renderItem={({ item: folder }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("FolderVideos", { folder })}
              activeOpacity={0.85}
              className="mx-5 mb-4 bg-card rounded-2xl border-2 border-border overflow-hidden"
            >
              <View className="h-36 bg-red-50 relative">
                {folder.thumbnail ? (
                  <Image source={{ uri: folder.thumbnail }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    {folder.youtubePlaylistId ? <Play  size={40} color="#fca5a5" /> : <Folder size={40} color="#fca5a5" />}
                  </View>
                )}
                <View className="absolute bottom-2.5 left-2.5 right-2.5 flex-row items-end justify-between">
                  <View className="bg-red-500 px-2.5 py-1 rounded-full">
                    <Text className="text-white text-[10px] font-bold">{folder.subject}</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    {folder.youtubePlaylistId && (
                      <View className="flex-row items-center gap-1 bg-red-500/90 px-2 py-1 rounded-full">
                        <Play  size={9} color="#fff" />
                        <Text className="text-white text-[9px] font-bold">YT</Text>
                      </View>
                    )}
                    <View className="bg-black/60 px-2.5 py-1 rounded-full">
                      <Text className="text-white text-[10px] font-semibold">{folder.videoCount} videos</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="p-4">
                <Text className="font-bold text-foreground text-base mb-1.5" numberOfLines={1}>{folder.name}</Text>
                <View className="flex-row flex-wrap gap-1.5 mb-2">
                  <View className="bg-blue-100 px-2 py-0.5 rounded">
                    <Text className="text-[10px] font-semibold text-blue-700">{folder.class}</Text>
                  </View>
                  {folder.isPublic ? (
                    <View className="flex-row items-center gap-1 bg-green-100 px-2 py-0.5 rounded">
                      <Globe size={9} color="#15803d" />
                      <Text className="text-[10px] font-semibold text-green-700">Public</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1 bg-orange-100 px-2 py-0.5 rounded">
                      <Lock size={9} color="#c2410c" />
                      <Text className="text-[10px] font-semibold text-orange-700">Private</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-muted-foreground mb-3" numberOfLines={1}>{folder.chapter}</Text>

                <View className="flex-row gap-1.5 mb-3">
                  {[
                    { label: "Videos", value: folder.videoCount },
                    { label: "Duration", value: folder.totalDuration },
                    { label: "Views", value: folder.totalViews },
                  ].map(({ label, value }) => (
                    <View key={label} className="flex-1 items-center py-2 rounded-xl bg-secondary">
                      <Text className="text-[9px] text-muted-foreground mb-0.5">{label}</Text>
                      <Text className="text-xs font-bold text-foreground">{value}</Text>
                    </View>
                  ))}
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => navigation.navigate("FolderVideos", { folder })}
                    className="flex-1 bg-red-500 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
                  >
                    <Play size={13} color="#fff" />
                    <Text className="text-white text-xs font-semibold">View Videos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingFolder(folder)} className="w-10 items-center justify-center border-2 border-border rounded-xl">
                    <Edit size={14} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(folder.id)} className="w-10 items-center justify-center border-2 border-red-200 rounded-xl">
                    <Trash2 size={14} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center py-16 px-5">
              <Folder size={48} color="#9ca3af" />
              <Text className="text-foreground font-bold text-base mt-3">No folders yet</Text>
              <Text className="text-muted-foreground text-sm text-center mt-1">Sync your YouTube channel or create a folder manually</Text>
            </View>
          }
        />
      )}

      <FolderFormModal
        visible={showCreateModal}
        mode="create"
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchFolders();
        }}
      />
      <FolderFormModal
        visible={!!editingFolder}
        mode="edit"
        folder={editingFolder}
        onClose={() => setEditingFolder(null)}
        onSuccess={() => {
          setEditingFolder(null);
          fetchFolders();
        }}
      />
    </SafeAreaView>
  );
}