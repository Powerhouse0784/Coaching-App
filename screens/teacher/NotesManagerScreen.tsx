import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Image, Linking, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText, Plus, Search, Download, Eye, Bookmark,
  Trash2, Edit, Pin, RefreshCw, Star, Lock, Unlock, X,
} from "lucide-react-native";
import api from "@/lib/api";
import type { TeacherNote } from "@/types";
import NoteFormModal from "@/components/teacher/NoteFormModal";

type PublishFilter = "all" | "published" | "draft";

export default function NotesManagerScreen() {
  const [allNotes, setAllNotes] = useState<TeacherNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TeacherNote | null>(null);

  const fetchNotes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/api/teacher/notes");
      if (data.success) setAllNotes(data.notes);
    } catch (e) {
      console.error("Error fetching notes:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const subjects = useMemo(() => Array.from(new Set(allNotes.map((n) => n.subject))).sort(), [allNotes]);

  const filteredNotes = useMemo(() => {
    let list = [...allNotes];
    if (publishFilter === "published") list = list.filter((n) => n.isPublished);
    if (publishFilter === "draft") list = list.filter((n) => !n.isPublished);
    if (selectedSubject !== "all") list = list.filter((n) => n.subject === selectedSubject);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description?.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          n.topic?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allNotes, publishFilter, selectedSubject, searchQuery]);

  const totalDownloads = allNotes.reduce((s, n) => s + n.downloads, 0);
  const totalViews = allNotes.reduce((s, n) => s + n.views, 0);
  const totalBookmarks = allNotes.reduce((s, n) => s + n.stats.totalBookmarks, 0);
  const publishedCount = allNotes.filter((n) => n.isPublished).length;

  const handleDelete = (id: string) => {
    Alert.alert("Delete note?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setAllNotes((prev) => prev.filter((n) => n.id !== id));
          try {
            const { data } = await api.delete(`/api/teacher/notes?id=${id}`);
            if (!data.success) fetchNotes();
          } catch (e) {
            console.error(e);
            fetchNotes();
          }
        },
      },
    ]);
  };

  const handleTogglePublish = async (id: string) => {
    setAllNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPublished: !n.isPublished } : n)));
    try {
      const { data } = await api.patch("/api/teacher/notes", { noteId: id, action: "toggle-publish" });
      if (!data.success) fetchNotes();
    } catch (e) {
      console.error(e);
      fetchNotes();
    }
  };

  const handleTogglePin = async (id: string) => {
    setAllNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
    try {
      const { data } = await api.patch("/api/teacher/notes", { noteId: id, action: "toggle-pin" });
      if (!data.success) fetchNotes();
    } catch (e) {
      console.error(e);
      fetchNotes();
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#9333ea" />
        <Text className="text-muted-foreground mt-3">Loading notes…</Text>
      </SafeAreaView>
    );
  }

  const stats = [
    { icon: FileText, value: allNotes.length, label: "Total Notes", color: "#3b82f6" },
    { icon: Download, value: totalDownloads, label: "Downloads", color: "#22c55e" },
    { icon: Eye, value: totalViews, label: "Views", color: "#f97316" },
    { icon: Bookmark, value: totalBookmarks, label: "Bookmarks", color: "#a855f7" },
  ];

  const filters: { value: PublishFilter; label: string }[] = [
    { value: "all", label: `All (${allNotes.length})` },
    { value: "published", label: `Published (${publishedCount})` },
    { value: "draft", label: `Drafts (${allNotes.length - publishedCount})` },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotes(true)} />}
        ListHeaderComponent={
          <View className="px-5 pt-4">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xl font-bold text-foreground">Notes Manager</Text>
                <Text className="text-xs text-muted-foreground">{allNotes.length} notes · {publishedCount} published</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => fetchNotes(true)}
                  className="w-9 h-9 border-2 border-border rounded-xl items-center justify-center"
                >
                  <RefreshCw size={15} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  className="bg-purple-600 rounded-xl px-3.5 py-2.5 flex-row items-center gap-1.5"
                >
                  <Plus size={15} color="#fff" />
                  <Text className="text-white text-xs font-semibold">Upload</Text>
                </TouchableOpacity>
              </View>
            </View>

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

            <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4 bg-card">
              <Search size={16} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by title, subject, topic…"
                className="flex-1 py-2.5 px-2 text-foreground text-sm"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={filters}
              keyExtractor={(f) => f.value}
              contentContainerStyle={{ gap: 8, marginBottom: 10 }}
              renderItem={({ item: f }) => (
                <TouchableOpacity
                  onPress={() => setPublishFilter(f.value)}
                  className={`px-4 py-2 rounded-xl ${publishFilter === f.value ? "bg-purple-600" : "bg-card border border-border"}`}
                >
                  <Text className={`text-xs font-semibold ${publishFilter === f.value ? "text-white" : "text-foreground"}`}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

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
        renderItem={({ item: note }) => (
          <NoteCard
            note={note}
            onDelete={() => handleDelete(note.id)}
            onTogglePublish={() => handleTogglePublish(note.id)}
            onTogglePin={() => handleTogglePin(note.id)}
            onEdit={() => setEditingNote(note)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <FileText size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No notes yet</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">Upload your first note to get started</Text>
          </View>
        }
      />

      <NoteFormModal
        visible={showCreateModal}
        mode="create"
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newNote) => {
          setAllNotes((prev) => [newNote, ...prev]);
          setShowCreateModal(false);
        }}
      />
      <NoteFormModal
        visible={!!editingNote}
        mode="edit"
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onSuccess={(updated) => {
          setAllNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          setEditingNote(null);
        }}
      />
    </SafeAreaView>
  );
}

function NoteCard({
  note,
  onDelete,
  onTogglePublish,
  onTogglePin,
  onEdit,
}: {
  note: TeacherNote;
  onDelete: () => void;
  onTogglePublish: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
}) {
  return (
    <View className="mx-5 mb-4 bg-card rounded-2xl border-2 border-border overflow-hidden">
      <View className="h-32 bg-purple-50 relative">
        {note.thumbnailUrl ? (
          <Image source={{ uri: note.thumbnailUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <FileText size={36} color="#d8b4fe" />
          </View>
        )}
        <View className="absolute top-2.5 left-2.5 flex-row gap-1.5">
          {note.isPinned && (
            <View className="flex-row items-center gap-1 bg-amber-500 px-2 py-1 rounded-lg">
              <Star size={10} color="#fff" fill="#fff" />
              <Text className="text-white text-[9px] font-bold">Pinned</Text>
            </View>
          )}
          {!note.isPublished && (
            <View className="flex-row items-center gap-1 bg-gray-800/90 px-2 py-1 rounded-lg">
              <Lock size={10} color="#fff" />
              <Text className="text-white text-[9px] font-bold">Draft</Text>
            </View>
          )}
        </View>
        {note.isPublished && (
          <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-green-400" />
        )}
      </View>

      <View className="p-4">
        <Text className="font-bold text-foreground text-base mb-1.5" numberOfLines={1}>{note.title}</Text>
        <View className="flex-row flex-wrap gap-1.5 mb-2">
          <View className="bg-purple-100 px-2.5 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-purple-700">{note.subject}</Text>
          </View>
          <View className="bg-blue-100 px-2.5 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-blue-700">{note.class}</Text>
          </View>
          <View className="bg-secondary px-2.5 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase">{note.fileType}</Text>
          </View>
        </View>
        {note.description ? <Text className="text-xs text-muted-foreground mb-2" numberOfLines={2}>{note.description}</Text> : null}
        {note.topic ? <Text className="text-xs text-muted-foreground mb-3"><Text className="font-semibold">Topic:</Text> {note.topic}</Text> : null}

        <View className="flex-row gap-1.5 mb-4">
          {[
            { label: "Downloads", value: note.downloads },
            { label: "Views", value: note.views },
            { label: "Saved", value: note.stats.totalBookmarks },
            { label: "Price", value: `₹${note.price}` },
          ].map(({ label, value }) => (
            <View key={label} className="flex-1 items-center py-2 rounded-xl bg-secondary">
              <Text className="text-[9px] text-muted-foreground mb-0.5">{label}</Text>
              <Text className="text-xs font-bold text-foreground">{value}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row gap-1.5">
          <TouchableOpacity
            onPress={onTogglePin}
            className="flex-1 items-center py-2.5 rounded-xl"
            style={{ backgroundColor: note.isPinned ? "#fef3c7" : "#f3f4f6" }}
          >
            <Pin size={15} color={note.isPinned ? "#b45309" : "#6b7280"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onTogglePublish}
            className="flex-1 items-center py-2.5 rounded-xl"
            style={{ backgroundColor: note.isPublished ? "#dcfce7" : "#f3f4f6" }}
          >
            {note.isPublished ? <Unlock size={15} color="#15803d" /> : <Lock size={15} color="#6b7280" />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(note.fileUrl)}
            className="flex-1 items-center py-2.5 rounded-xl bg-blue-100"
          >
            <Eye size={15} color="#1d4ed8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} className="flex-1 items-center py-2.5 rounded-xl bg-indigo-100">
            <Edit size={15} color="#4338ca" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} className="flex-1 items-center py-2.5 rounded-xl bg-red-100">
            <Trash2 size={15} color="#dc2626" />
          </TouchableOpacity>
        </View>

        <Text className="text-[10px] text-muted-foreground text-center mt-2.5">
          Added {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </Text>
      </View>
    </View>
  );
}