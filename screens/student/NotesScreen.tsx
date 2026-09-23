import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList, ActivityIndicator,
  Linking, RefreshControl, Image, Dimensions, ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  FileText, Search, Download, Eye, Bookmark, BookmarkCheck,
  Star, X, FolderOpen,
} from "lucide-react-native";
import api from "@/lib/api";
import type { Note } from "@/types";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { MiniStat } from "@/components/ui/StatPrimitives";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "bookmarked", label: "Saved" },
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - GRID_GAP) / 2;

// Placeholder editorial photography — swap for your own library/study-desk photo before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop";

// Deterministic gradient per subject so notes without a thumbnail still look designed, not blank.
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

export default function NotesScreen() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

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

  const subjects = useMemo(() => Array.from(new Set(allNotes.map((n) => n.subject))).sort(), [allNotes]);

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.description?.toLowerCase().includes(q) ?? false) ||
          (n.topic?.toLowerCase().includes(q) ?? false) ||
          (n.chapter?.toLowerCase().includes(q) ?? false) ||
          n.subject.toLowerCase().includes(q)
      );
    }

    return notes;
  }, [allNotes, selectedFilter, selectedSubject, searchQuery]);

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
              stats: { totalBookmarks: n.isBookmarked ? n.stats.totalBookmarks - 1 : n.stats.totalBookmarks + 1 },
            }
      )
    );
    try {
      await api.patch("/api/student/notes", { noteId });
    } catch (e) {
      console.error("Bookmark error:", e);
      fetchNotes();
    }
  };

  const handleDownload = async (note: Note) => {
    setAllNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, downloads: n.downloads + 1 } : n)));
    Linking.openURL(note.fileUrl);
    try {
      await api.post("/api/student/notes", { noteId: note.id, action: "download" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleView = async (note: Note) => {
    setAllNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, views: n.views + 1 } : n)));
    Linking.openURL(note.fileUrl);
    try {
      await api.post("/api/student/notes", { noteId: note.id, action: "view" });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.md }}>Loading your notes…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 20, gap: GRID_GAP }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotes(true)} tintColor={colors.indigo} colors={[colors.indigo]} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Cinematic photo hero — same language as the dashboards */}
            <View style={{ overflow: "hidden", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
              <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
                <LinearGradient
                  colors={["rgba(27,44,92,0.6)", "rgba(27,44,92,0.8)", "rgba(16,24,49,0.95)"]}
                  style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 26 }}
                >
                  <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <View style={{ width: 46, height: 46, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                      <FolderOpen size={22} color={colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...type.h2, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>Notes Library</Text>
                      <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.body, fontSize: 12.5, marginTop: 1 }}>Study materials from your teachers</Text>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(450).delay(80)}>
                    <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 10, columnGap: 18, padding: spacing.lg }}>
                        <MiniStat icon={FileText} value={totalNotes} label="notes" />
                        <MiniStat icon={BookmarkCheck} value={bookmarkedNotes} label="saved" />
                        <MiniStat icon={Download} value={totalDownloads} label="downloads" />
                        <MiniStat icon={Star} value={pinnedNotes} label="pinned" />
                      </View>
                    </BlurView>
                  </Animated.View>
                </LinearGradient>
              </ImageBackground>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search notes, topics, subjects…"
                leftIcon={<Search size={18} color={colors.inkFaint} />}
                rightIcon={
                  searchQuery ? (
                    <AnimatedPressable pressScale={0.85} onPress={() => setSearchQuery("")} hitSlop={8}>
                      <X size={16} color={colors.inkFaint} />
                    </AnimatedPressable>
                  ) : undefined
                }
              />

              {/* Segmented control — one continuous grouped bar, distinct from pill/underline tabs elsewhere */}
              <View style={{ flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3, marginTop: spacing.md }}>
                {FILTERS.map((f) => {
                  const active = selectedFilter === f.value;
                  return (
                    <AnimatedPressable
                      key={f.value}
                      pressScale={0.97}
                      onPress={() => setSelectedFilter(f.value)}
                      style={{
                        flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm,
                        backgroundColor: active ? colors.surface : "transparent",
                      }}
                    >
                      <Text style={{ fontFamily: active ? fonts.bodySemibold : fonts.bodyMedium, fontSize: 12, color: active ? colors.indigo : colors.inkMuted }}>
                        {f.label}
                      </Text>
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
                  contentContainerStyle={{ gap: 8, marginTop: spacing.md, marginBottom: spacing.md }}
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
            </View>
          </View>
        }
        renderItem={({ item: note, index }) => (
          <Animated.View entering={FadeInUp.duration(280).delay(Math.min(index, 9) * 40)} style={{ width: CARD_WIDTH, marginBottom: GRID_GAP }}>
            <NoteCard
              note={note}
              onBookmark={() => handleBookmark(note.id)}
              onDownload={() => handleDownload(note)}
              onView={() => handleView(note)}
            />
          </Animated.View>
        )}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 32 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <FileText size={30} color={colors.inkFaint} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, marginBottom: 4 }}>No notes found</Text>
            <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, textAlign: "center" }}>
              {searchQuery || selectedSubject !== "all" ? "Try adjusting your search or filters." : "Your teachers haven't uploaded any notes yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function NoteCard({
  note, onBookmark, onDownload, onView,
}: {
  note: Note; onBookmark: () => void; onDownload: () => void; onView: () => void;
}) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
      {/* Thumbnail — a real image if provided, otherwise a designed gradient card (not a blank tile) */}
      <View style={{ height: CARD_WIDTH * 0.82 }}>
        {note.thumbnailUrl ? (
          <Image source={{ uri: note.thumbnailUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradientForSubject(note.subject)} style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <View pointerEvents="none" style={{ position: "absolute", top: -18, right: -18, width: 76, height: 76, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <FileText size={28} color="rgba(255,255,255,0.85)" />
            <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: fonts.bodySemibold, fontSize: 10, marginTop: 6 }}>{note.subject}</Text>
          </LinearGradient>
        )}
        {note.isPinned && (
          <View style={{ position: "absolute", top: 8, left: 8, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.gold, paddingHorizontal: 7, paddingVertical: 4, borderRadius: radius.sm }}>
            <Star size={9} color={colors.white} fill={colors.white} />
            <Text style={{ color: colors.white, fontSize: 9, fontFamily: fonts.bodySemibold }}>Pinned</Text>
          </View>
        )}
        <AnimatedPressable
          pressScale={0.85}
          onPress={onBookmark}
          style={{
            position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: radius.sm,
            alignItems: "center", justifyContent: "center",
            backgroundColor: note.isBookmarked ? colors.indigo : "rgba(255,255,255,0.92)",
          }}
        >
          {note.isBookmarked ? <BookmarkCheck size={14} color={colors.white} fill={colors.white} /> : <Bookmark size={14} color={colors.inkMuted} />}
        </AnimatedPressable>
      </View>

      {/* Body */}
      <View style={{ padding: spacing.sm + 2 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          <Badge label={note.subject} tone="brand" />
          {note.chapter ? (
            <Text style={{ ...type.caption, color: colors.inkFaint, fontSize: 10, alignSelf: "center" }} numberOfLines={1}>Ch. {note.chapter}</Text>
          ) : null}
        </View>

        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink, lineHeight: 16.5, marginBottom: 6, minHeight: 33 }} numberOfLines={2}>
          {note.title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Download size={10} color={colors.inkFaint} />
            <Text style={{ fontSize: 10, fontFamily: fonts.body, color: colors.inkFaint }}>{note.downloads}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Eye size={10} color={colors.inkFaint} />
            <Text style={{ fontSize: 10, fontFamily: fonts.body, color: colors.inkFaint }}>{note.views}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          <AnimatedPressable
            pressScale={0.93}
            onPress={onView}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.indigo }}
          >
            <Eye size={12} color={colors.indigo} />
            <Text style={{ fontSize: 11, fontFamily: fonts.bodySemibold, color: colors.indigo }}>View</Text>
          </AnimatedPressable>
          <AnimatedPressable
            pressScale={0.93}
            onPress={onDownload}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.indigo }}
          >
            <Download size={12} color={colors.white} />
            <Text style={{ fontSize: 11, fontFamily: fonts.bodySemibold, color: colors.white }}>Get</Text>
          </AnimatedPressable>
        </View>

        <Text style={{ fontSize: 9.5, fontFamily: fonts.body, color: colors.inkFaint, textAlign: "center", marginTop: 6 }}>
          {note.fileType.toUpperCase()} · {note.fileSize}
        </Text>
      </View>
    </View>
  );
}
