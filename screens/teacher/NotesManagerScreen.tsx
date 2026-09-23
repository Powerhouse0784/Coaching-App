import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, FlatList, Alert, Image, Linking, RefreshControl, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  FadeIn, FadeInDown, ZoomIn, LinearTransition,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
} from "react-native-reanimated";
import {
  FileText, Plus, Search, Download, Eye, Bookmark,
  Trash2, Edit, Pin, RefreshCw, Star, Lock, Unlock, X, Sparkles,
} from "lucide-react-native";
import api from "@/lib/api";
import type { TeacherNote } from "@/types";
import NoteFormModal from "@/components/teacher/NoteFormModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import Skeleton from "@/components/ui/Skeleton";
import Card from "@/components/ui/Card";
import ProgressRing from "@/components/ui/ProgressRing";
import { MiniStat, AttentionDot } from "@/components/ui/StatPrimitives";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

// Placeholder editorial photography — swap for your own institute photo before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1727812100173-b33044cd3071?w=1200&q=80&auto=format&fit=crop";

type PublishFilter = "all" | "published" | "draft";

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
        (n) => n.title.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q) || n.topic?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allNotes, publishFilter, selectedSubject, searchQuery]);

  const totalDownloads = allNotes.reduce((s, n) => s + n.downloads, 0);
  const totalViews = allNotes.reduce((s, n) => s + n.views, 0);
  const totalBookmarks = allNotes.reduce((s, n) => s + n.stats.totalBookmarks, 0);
  const publishedCount = allNotes.filter((n) => n.isPublished).length;
  const draftCount = allNotes.length - publishedCount;
  const publishRatio = allNotes.length > 0 ? publishedCount / allNotes.length : 0;

  const handleDelete = (id: string) => {
    Alert.alert("Delete note?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setAllNotes((prev) => prev.filter((n) => n.id !== id));
          try {
            const { data } = await api.delete(`/api/teacher/notes?id=${id}`);
            if (!data.success) fetchNotes();
          } catch (e) { console.error(e); fetchNotes(); }
        },
      },
    ]);
  };

  const handleTogglePublish = async (id: string) => {
    setAllNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPublished: !n.isPublished } : n)));
    try {
      const { data } = await api.patch("/api/teacher/notes", { noteId: id, action: "toggle-publish" });
      if (!data.success) fetchNotes();
    } catch (e) { console.error(e); fetchNotes(); }
  };

  const handleTogglePin = async (id: string) => {
    setAllNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
    try {
      const { data } = await api.patch("/api/teacher/notes", { noteId: id, action: "toggle-pin" });
      if (!data.success) fetchNotes();
    } catch (e) { console.error(e); fetchNotes(); }
  };

  const filters: { value: PublishFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "published", label: "Published" },
    { value: "draft", label: "Drafts" },
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
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10.5 }}>Notes Manager</Text>
                </View>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                  Study Materials
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 }}>{allNotes.length} notes · {publishedCount} published</Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={() => fetchNotes(true)} style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={15} color={colors.white} />
              </AnimatedPressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(450).delay(100)}>
              <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.lg }}>
                  <ProgressRing progress={publishRatio} label="LIVE" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.4, marginBottom: 8 }}>LIBRARY REACH</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, columnGap: 16 }}>
                      <MiniStat icon={Download} value={totalDownloads} label="downloads" />
                      <MiniStat icon={Eye} value={totalViews} label="views" />
                      <MiniStat icon={Bookmark} value={totalBookmarks} label="saved" />
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>
      </View>

      {draftCount > 0 && (
        <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.goldTint, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 }}>
            <AttentionDot color={colors.gold} />
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: "#8A6816" }}>{draftCount} draft{draftCount === 1 ? "" : "s"} not yet visible to students</Text>
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 20, paddingTop: spacing.lg }}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, subject, topic…"
          leftIcon={<Search size={16} color={colors.inkFaint} />}
          rightIcon={searchQuery ? (
            <AnimatedPressable pressScale={0.85} onPress={() => setSearchQuery("")}>
              <X size={16} color={colors.inkFaint} />
            </AnimatedPressable>
          ) : undefined}
        />
        <View style={{ height: spacing.md }} />

        <View style={{ flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3, marginBottom: spacing.md }}>
          {filters.map((f) => {
            const active = publishFilter === f.value;
            return (
              <AnimatedPressable key={f.value} pressScale={0.97} onPress={() => setPublishFilter(f.value)} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm, backgroundColor: active ? colors.indigo : "transparent" }}>
                <Text style={{ fontFamily: active ? fonts.bodySemibold : fonts.bodyMedium, fontSize: 12, color: active ? colors.white : colors.inkMuted }}>{f.label}</Text>
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
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <Card key={i} padding={0} style={{ overflow: "hidden" }}>
                <Skeleton height={128} borderRadius={0} />
                <View style={{ padding: spacing.lg, gap: 8 }}><Skeleton width="70%" height={16} /><Skeleton width="40%" height={12} /></View>
              </Card>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotes(true)} tintColor={colors.indigo} colors={[colors.indigo]} />}
          ListHeaderComponent={listHeader}
          renderItem={({ item: note, index }) => (
            <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index, 6) * 60).springify().damping(15)} layout={LinearTransition.duration(220)}>
              <NoteCard note={note} onDelete={() => handleDelete(note.id)} onTogglePublish={() => handleTogglePublish(note.id)} onTogglePin={() => handleTogglePin(note.id)} onEdit={() => setEditingNote(note)} />
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: spacing.sm }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 20 }}>
              <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
                <FileText size={32} color={colors.indigo} />
              </View>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>No notes found</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 4 }}>Try a different filter, or upload your first note</Text>
            </View>
          }
        />
      )}

      {/* Floating upload button — glowing, always reachable */}
      <Animated.View entering={ZoomIn.duration(350).delay(200)} style={{ position: "absolute", bottom: 24, right: 20 }}>
        <AnimatedPressable
          pressScale={0.9}
          onPress={() => setShowCreateModal(true)}
          style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center", shadowColor: colors.gold, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
        >
          <Plus size={26} color={colors.ink} />
        </AnimatedPressable>
      </Animated.View>

      <NoteFormModal
        visible={showCreateModal}
        mode="create"
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newNote) => { setAllNotes((prev) => [newNote, ...prev]); setShowCreateModal(false); }}
      />
      <NoteFormModal
        visible={!!editingNote}
        mode="edit"
        note={editingNote}
        onClose={() => setEditingNote(null)}
        onSuccess={(updated) => { setAllNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n))); setEditingNote(null); }}
      />
    </SafeAreaView>
  );
}

function NoteCard({
  note, onDelete, onTogglePublish, onTogglePin, onEdit,
}: {
  note: TeacherNote;
  onDelete: () => void;
  onTogglePublish: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
}) {
  const [gradFrom, gradTo] = gradientForSubject(note.subject);
  const pinScale = useSharedValue(1);
  const handlePin = () => {
    pinScale.value = withSequence(withSpring(1.4, { damping: 4, stiffness: 300 }), withSpring(1, { damping: 8 }));
    onTogglePin();
  };
  const pinAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pinScale.value }] }));

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 18 }}>
      <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        {note.thumbnailUrl ? (
          <View style={{ height: 128 }}>
            <Image source={{ uri: note.thumbnailUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <LinearGradient colors={["rgba(0,0,0,0.45)", "transparent"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60 }} />
          </View>
        ) : (
          <LinearGradient colors={[gradFrom, gradTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 90, alignItems: "center", justifyContent: "center" }}>
            <FileText size={32} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        )}

        <View style={{ position: "absolute", top: 10, left: 10, flexDirection: "row", gap: 6 }}>
          {note.isPinned && (
            <Animated.View entering={ZoomIn.duration(250)} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm }}>
              <Star size={10} color={colors.white} fill={colors.white} />
              <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 9.5 }}>Pinned</Text>
            </Animated.View>
          )}
        </View>
        <View style={{ position: "absolute", top: 10, right: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: note.isPublished ? "rgba(47,143,91,0.9)" : "rgba(23,25,35,0.85)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm }}>
            {note.isPublished ? <Unlock size={10} color={colors.white} /> : <Lock size={10} color={colors.white} />}
            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 9.5 }}>{note.isPublished ? "Published" : "Draft"}</Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg }}>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, marginBottom: 6 }} numberOfLines={1}>{note.title}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm }}>
            <Badge label={note.subject} tone="brand" />
            <Badge label={note.class} tone="gold" />
            <Badge label={note.fileType.toUpperCase()} tone="neutral" />
          </View>
          {note.description ? <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginBottom: spacing.md }} numberOfLines={2}>{note.description}</Text> : null}

          <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.md }}>
            {[
              { label: "Downloads", value: note.downloads },
              { label: "Views", value: note.views },
              { label: "Saved", value: note.stats.totalBookmarks },
              { label: "Price", value: `₹${note.price}` },
            ].map(({ label, value }) => (
              <View key={label} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 9, color: colors.inkFaint, marginBottom: 1 }}>{label}</Text>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink }}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <AnimatedPressable pressScale={0.88} onPress={handlePin} style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: radius.sm, backgroundColor: note.isPinned ? colors.goldTint : colors.surfaceMuted }}>
              <Animated.View style={pinAnimatedStyle}>
                <Pin size={15} color={note.isPinned ? colors.gold : colors.inkMuted} fill={note.isPinned ? colors.gold : "transparent"} />
              </Animated.View>
            </AnimatedPressable>
            <AnimatedPressable pressScale={0.88} onPress={onTogglePublish} style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: radius.sm, backgroundColor: note.isPublished ? colors.mintTint : colors.surfaceMuted }}>
              {note.isPublished ? <Unlock size={15} color={colors.mint} /> : <Lock size={15} color={colors.inkMuted} />}
            </AnimatedPressable>
            <AnimatedPressable pressScale={0.88} onPress={() => Linking.openURL(note.fileUrl)} style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.indigoTint }}>
              <Eye size={15} color={colors.indigo} />
            </AnimatedPressable>
            <AnimatedPressable pressScale={0.88} onPress={onEdit} style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.indigoTint }}>
              <Edit size={15} color={colors.indigo} />
            </AnimatedPressable>
            <AnimatedPressable pressScale={0.88} onPress={onDelete} style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: radius.sm, backgroundColor: colors.coralTint }}>
              <Trash2 size={15} color={colors.coral} />
            </AnimatedPressable>
          </View>

          <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint, textAlign: "center", marginTop: spacing.md }}>
            Added {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      </View>
    </View>
  );
}
