import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator,  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MessageSquare, Search, ThumbsUp, Clock, CheckCircle2,
  Users, TrendingUp, ArrowLeft, Plus, ImageIcon, FileText,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "@/lib/api";
import type { Doubt } from "@/types";
import type { StudentRootStackParamList } from "@/navigation/StudentRootNavigator";
import AskDoubtModal from "@/components/doubt/AskDoubtModal";

type Nav = NativeStackNavigationProp<StudentRootStackParamList, "Doubts">;

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "#dcfce7", text: "#15803d" },
  normal: { bg: "#dbeafe", text: "#1d4ed8" },
  high: { bg: "#ffedd5", text: "#c2410c" },
  urgent: { bg: "#fee2e2", text: "#b91c1c" },
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

  // Refetch every time this screen regains focus (e.g. returning from detail
  // after posting a reply) so counts and statuses stay accurate.
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

  const stats = [
    { icon: MessageSquare, value: allDoubts.length, label: "Total", color: "#3b82f6" },
    { icon: CheckCircle2, value: allDoubts.filter((d) => d.isSolved).length, label: "Solved", color: "#22c55e" },
    { icon: Users, value: allDoubts.filter((d) => d.isMyDoubt).length, label: "My Doubts", color: "#f97316" },
    { icon: TrendingUp, value: allDoubts.filter((d) => !d.isSolved).length, label: "Active", color: "#a855f7" },
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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-muted-foreground mt-3">Loading doubts…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="px-5 pt-2">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
                  <ArrowLeft size={18} color="#374151" />
                </TouchableOpacity>
                <View>
                  <Text className="text-lg font-bold text-foreground">Discussion Forum</Text>
                  <Text className="text-xs text-muted-foreground">Ask, answer, and help each other</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowAskModal(true)}
                className="bg-blue-600 rounded-xl px-3.5 py-2.5 flex-row items-center gap-1.5"
              >
                <Plus size={16} color="#fff" />
                <Text className="text-white text-xs font-semibold">Ask</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-3 mb-4">
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

            <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-3 bg-card">
              <Search size={16} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search doubts…"
                className="flex-1 py-2.5 px-2 text-foreground text-sm"
              />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={filters}
              keyExtractor={(f) => f.value}
              contentContainerStyle={{ gap: 8, marginBottom: 14 }}
              renderItem={({ item: f }) => (
                <TouchableOpacity
                  onPress={() => setFilter(f.value)}
                  className={`px-3.5 py-2 rounded-full ${filter === f.value ? "bg-blue-600" : "bg-card border border-border"}`}
                >
                  <Text className={`text-xs font-semibold ${filter === f.value ? "text-white" : "text-foreground"}`}>{f.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        renderItem={({ item: doubt }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("DoubtDetail", { doubt })}
            activeOpacity={0.85}
            className="mx-5 mb-3 bg-card rounded-2xl border border-border p-4"
          >
            <View className="flex-row gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center overflow-hidden">
                {doubt.student.avatar ? (
                  <Image source={{ uri: doubt.student.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-white font-bold text-sm">{doubt.student.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-start justify-between gap-2 mb-1">
                  <Text className="font-bold text-foreground text-sm flex-1" numberOfLines={1}>{doubt.title}</Text>
                  {doubt.isSolved && (
                    <View className="flex-row items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} color="#15803d" />
                      <Text className="text-[10px] font-semibold text-green-700">Solved</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center flex-wrap gap-1.5 mb-2">
                  <Text className="text-xs text-muted-foreground">{doubt.student.name}</Text>
                  <Text className="text-xs text-muted-foreground">•</Text>
                  <View className="flex-row items-center gap-1">
                    <Clock size={10} color="#9ca3af" />
                    <Text className="text-xs text-muted-foreground">{formatTimeAgo(doubt.createdAt)}</Text>
                  </View>
                  <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-medium text-blue-700">{doubt.subject}</Text>
                  </View>
                  {PRIORITY_COLORS[doubt.priority] && (
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[doubt.priority].bg }}>
                      <Text className="text-[10px] font-semibold" style={{ color: PRIORITY_COLORS[doubt.priority].text }}>
                        {doubt.priority}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-xs text-muted-foreground mb-2" numberOfLines={2}>{doubt.description}</Text>

                {(doubt.imageUrl || doubt.pdfUrl) && (
                  <View className="flex-row gap-1.5 mb-2">
                    {doubt.imageUrl && (
                      <View className="flex-row items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                        <ImageIcon size={11} color="#1d4ed8" />
                        <Text className="text-[10px] text-blue-700">Image</Text>
                      </View>
                    )}
                    {doubt.pdfUrl && (
                      <View className="flex-row items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                        <FileText size={11} color="#b91c1c" />
                        <Text className="text-[10px] text-red-700">PDF</Text>
                      </View>
                    )}
                  </View>
                )}

                <View className="flex-row items-center gap-4">
                  <TouchableOpacity onPress={() => handleUpvote(doubt.id)} className="flex-row items-center gap-1.5">
                    <ThumbsUp size={13} color={doubt.hasUpvoted ? "#3b82f6" : "#6b7280"} fill={doubt.hasUpvoted ? "#3b82f6" : "none"} />
                    <Text className={`text-xs font-semibold ${doubt.hasUpvoted ? "text-blue-600" : "text-muted-foreground"}`}>
                      {doubt.stats.totalUpvotes}
                    </Text>
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-1.5">
                    <MessageSquare size={13} color="#6b7280" />
                    <Text className="text-xs text-muted-foreground">{doubt.stats.totalReplies}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <MessageSquare size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No doubts found</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">Be the first to ask a question!</Text>
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