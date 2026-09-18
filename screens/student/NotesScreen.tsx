import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator,  Linking, RefreshControl, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText, Search, Download, Eye, Bookmark, BookmarkCheck,
  Star, X,
} from "lucide-react-native";
import api from "@/lib/api";
import type { Note } from "@/types";

const FILTERS = [
  { value: "all", label: "All Notes" },
  { value: "bookmarked", label: "Bookmarked" },
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
];

const subjectColors: Record<string, string> = {
  Mathematics: "#3b82f6",
  Physics: "#8b5cf6",
  Chemistry: "#10b981",
  Biology: "#22c55e",
  English: "#ec4899",
  History: "#f59e0b",
};

export default function NotesScreen() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");

  const fetchNotes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get("/api/student/notes");
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

  const subjects = useMemo(
    () => Array.from(new Set(allNotes.map((n) => n.subject))).sort(),
    [allNotes]
  );
  const classes = useMemo(
    () => Array.from(new Set(allNotes.map((n) => n.class))).sort(),
    [allNotes]
  );

  const filteredNotes = useMemo(() => {
    let notes = [...allNotes];

    if (selectedFilter === "bookmarked") {
      notes = notes.filter((n) => n.isBookmarked);
    } else if (selectedFilter === "recent") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      notes = notes.filter((n) => new Date(n.createdAt) > cutoff);
    } else if (selectedFilter === "popular") {
      notes = [...notes].sort((a, b) => b.downloads - a.downloads);
    }

    if (selectedSubject !== "all") notes = notes.filter((n) => n.subject === selectedSubject);
    if (selectedClass !== "all") notes = notes.filter((n) => n.class === selectedClass);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.description?.toLowerCase().includes(q) ?? false) ||
          (n.topic?.toLowerCase().includes(q) ?? false) ||
          (n.chapter?.toLowerCase().includes(q) ?? false) ||
          n.subject.toLowerCase().includes(q) ||
          n.class.toLowerCase().includes(q)
      );
    }

    return notes;
  }, [allNotes, selectedFilter, selectedSubject, selectedClass, searchQuery]);

  const totalNotes = allNotes.length;
  const bookmarkedNotes = allNotes.filter((n) => n.isBookmarked).length;
  const totalDownloads = allNotes.reduce((s, n) => s + n.downloads, 0);
  const pinnedNotes = allNotes.filter((n) => n.isPinned).length;

  const handleBookmark = async (noteId: string) => {
    setAllNotes((prev) =>
      prev.map((n) =>
        n.id !== noteId
          ? n
          : {
              ...n,
              isBookmarked: !n.isBookmarked,
              stats: {
                totalBookmarks: n.isBookmarked
                  ? n.stats.totalBookmarks - 1
                  : n.stats.totalBookmarks + 1,
              },
            }
      )
    );
    try {
      await api.patch("/api/student/notes", { noteId });
    } catch (e) {
      console.error("Bookmark error:", e);
      fetchNotes(); // resync on failure
    }
  };

  const handleDownload = async (note: Note) => {
    setAllNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, downloads: n.downloads + 1 } : n))
    );
    Linking.openURL(note.fileUrl);
    try {
      await api.post("/api/student/notes", { noteId: note.id, action: "download" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleView = async (note: Note) => {
    setAllNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, views: n.views + 1 } : n))
    );
    Linking.openURL(note.fileUrl);
    try {
      await api.post("/api/student/notes", { noteId: note.id, action: "view" });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="text-muted-foreground mt-3">Loading your notes…</Text>
      </SafeAreaView>
    );
  }

  const stats = [
    { icon: FileText, value: totalNotes, label: "Available", color: "#3b82f6" },
    { icon: BookmarkCheck, value: bookmarkedNotes, label: "Bookmarked", color: "#8b5cf6" },
    { icon: Download, value: totalDownloads, label: "Downloads", color: "#10b981" },
    { icon: Star, value: pinnedNotes, label: "Pinned", color: "#f59e0b" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotes(true)} />
        }
        ListHeaderComponent={
          <View className="px-5 pt-4">
            {/* Header */}
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-11 h-11 bg-violet-600 rounded-xl items-center justify-center">
                <FileText size={22} color="#fff" />
              </View>
              <View>
                <Text className="text-xl font-bold text-foreground">Notes Library</Text>
                <Text className="text-xs text-muted-foreground">Study materials from your teachers</Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row flex-wrap gap-3 mb-5">
              {stats.map((s, idx) => (
                <View
                  key={idx}
                  className="bg-card rounded-2xl p-3 border border-border"
                  style={{ minWidth: "45%" }}
                >
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
                placeholder="Search notes, topics, subjects…"
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
              data={FILTERS}
              keyExtractor={(f) => f.value}
              contentContainerStyle={{ gap: 8, marginBottom: 12 }}
              renderItem={({ item: f }) => (
                <TouchableOpacity
                  onPress={() => setSelectedFilter(f.value)}
                  className={`px-4 py-2 rounded-xl ${
                    selectedFilter === f.value ? "bg-violet-600" : "bg-card border border-border"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${selectedFilter === f.value ? "text-white" : "text-foreground"}`}>
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
                contentContainerStyle={{ gap: 8, marginBottom: 8 }}
                renderItem={({ item: s }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-full border ${
                      selectedSubject === s ? "bg-blue-100 border-blue-400" : "bg-card border-border"
                    }`}
                  >
                    <Text className={`text-xs font-medium ${selectedSubject === s ? "text-blue-700" : "text-muted-foreground"}`}>
                      {s === "all" ? "All Subjects" : s}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Class chips */}
            {classes.length > 0 && (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={["all", ...classes]}
                keyExtractor={(c) => c}
                contentContainerStyle={{ gap: 8, marginBottom: 12 }}
                renderItem={({ item: c }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedClass(c)}
                    className={`px-3 py-1.5 rounded-full border ${
                      selectedClass === c ? "bg-purple-100 border-purple-400" : "bg-card border-border"
                    }`}
                  >
                    <Text className={`text-xs font-medium ${selectedClass === c ? "text-purple-700" : "text-muted-foreground"}`}>
                      {c === "all" ? "All Classes" : c}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <Text className="text-xs text-muted-foreground mb-3">
              Showing {filteredNotes.length} of {totalNotes} notes
            </Text>
          </View>
        }
        renderItem={({ item: note }) => (
          <NoteCard
            note={note}
            onBookmark={() => handleBookmark(note.id)}
            onDownload={() => handleDownload(note)}
            onView={() => handleView(note)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <FileText size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No notes found</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">
              {searchQuery || selectedSubject !== "all" || selectedClass !== "all"
                ? "Try adjusting your search or filters."
                : "Your teachers haven't uploaded any notes yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function NoteCard({
  note,
  onBookmark,
  onDownload,
  onView,
}: {
  note: Note;
  onBookmark: () => void;
  onDownload: () => void;
  onView: () => void;
}) {
  const subjectColor = subjectColors[note.subject] || "#6b7280";

  return (
    <View className="mx-5 mb-4 bg-card rounded-2xl border border-border overflow-hidden">
      {/* Thumbnail */}
      <View className="h-32 bg-violet-50 items-center justify-center relative">
        {note.thumbnailUrl ? (
          <Image source={{ uri: note.thumbnailUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <FileText size={40} color="#c4b5fd" />
        )}
        {note.isPinned && (
          <View className="absolute top-2.5 left-2.5 bg-amber-500 px-2 py-1 rounded-lg flex-row items-center gap-1">
            <Star size={11} color="#fff" fill="#fff" />
            <Text className="text-white text-[10px] font-bold">Pinned</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onBookmark}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg items-center justify-center ${
            note.isBookmarked ? "bg-violet-600" : "bg-white/90"
          }`}
        >
          {note.isBookmarked ? (
            <BookmarkCheck size={16} color="#fff" fill="#fff" />
          ) : (
            <Bookmark size={16} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View className="p-4">
        <View className="flex-row flex-wrap gap-1.5 mb-2">
          <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${subjectColor}20` }}>
            <Text className="text-[10px] font-bold" style={{ color: subjectColor }}>{note.subject}</Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-blue-100">
            <Text className="text-[10px] font-bold text-blue-700">{note.class}</Text>
          </View>
          {note.chapter && (
            <View className="px-2 py-1 rounded-full bg-gray-100">
              <Text className="text-[10px] font-medium text-gray-500">Ch. {note.chapter}</Text>
            </View>
          )}
        </View>

        <Text className="font-bold text-foreground text-sm mb-1" numberOfLines={2}>{note.title}</Text>
        {note.topic ? <Text className="text-xs text-muted-foreground mb-1" numberOfLines={1}>📌 {note.topic}</Text> : null}
        {note.description ? <Text className="text-xs text-muted-foreground mb-2" numberOfLines={2}>{note.description}</Text> : null}

        {/* Teacher row */}
        <View className="flex-row items-center gap-2 py-3 border-t border-border mb-3">
          <View className="w-7 h-7 rounded-full bg-violet-500 items-center justify-center overflow-hidden">
            {note.teacher.avatar ? (
              <Image source={{ uri: note.teacher.avatar }} className="w-full h-full" />
            ) : (
              <Text className="text-white text-xs font-bold">{note.teacher.name?.charAt(0) ?? "T"}</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-muted-foreground">Uploaded by</Text>
            <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>{note.teacher.name}</Text>
          </View>
          <Text className="text-[10px] text-muted-foreground">
            {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-2 mb-3">
          {[
            { icon: Download, val: note.downloads, label: "Downloads" },
            { icon: Eye, val: note.views, label: "Views" },
            { icon: Bookmark, val: note.stats.totalBookmarks, label: "Saved" },
          ].map(({ icon: Icon, val, label }) => (
            <View key={label} className="flex-1 items-center py-2 rounded-xl bg-secondary">
              <Icon size={13} color="#9ca3af" />
              <Text className="text-xs font-bold text-foreground mt-0.5">{val}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={onView} className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600">
            <Eye size={15} color="#fff" />
            <Text className="text-white text-xs font-semibold">View</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDownload} className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600">
            <Download size={15} color="#fff" />
            <Text className="text-white text-xs font-semibold">Download</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-[10px] text-muted-foreground text-center mt-2">
          {note.fileType.toUpperCase()} · {note.fileSize}
        </Text>
      </View>
    </View>
  );
}