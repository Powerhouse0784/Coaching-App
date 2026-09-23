import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, ActivityIndicator, Image, Modal, ScrollView, ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  FadeIn, FadeInDown, ZoomIn, SlideInDown,
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from "react-native-reanimated";
import {
  ArrowLeft, Search, Users, UserCheck, Sparkles, Trophy,
  Mail, MapPin, Calendar, X, Phone, ClipboardList,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { DirectoryUser } from "@/types";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

// Placeholder editorial photography — swap for your own classroom/student photo before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&q=80&auto=format&fit=crop";

type FilterKind = "all" | "active" | "new" | "incomplete";

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
}

function formatDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function calculateAge(dob: string | null) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isNewThisMonth(createdAt: string) {
  const d = new Date(createdAt);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
function isNewThisWeek(createdAt: string) {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}
function hasCompleteProfile(s: DirectoryUser) {
  return !!(s.phone && s.location && s.bio);
}

function useCountUp(target: number, duration = 700) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

function ProgressRing({ progress, size = 72, strokeWidth = 7 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radiusPx = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const glow = useSharedValue(0.55);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size + 12, height: size + 12, borderRadius: 999, backgroundColor: `${colors.mint}30` }, glowStyle]} />
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radiusPx} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radiusPx}
          stroke={colors.mint} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          rotation={-90} origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 15 }}>{Math.round(progress * 100)}%</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.body, fontSize: 8 }}>ACTIVE</Text>
      </View>
    </View>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  const count = useCountUp(value);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Icon size={12} color="rgba(255,255,255,0.7)" />
      <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{count}</Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: fonts.body, fontSize: 10.5 }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const AVATAR_GRADIENTS: [string, string][] = [
  [colors.indigo, colors.indigoDark],
  ["#C99A2E", "#8A6D1F"],
  [colors.mint, "#1F6B45"],
  [colors.coral, "#8E2E24"],
];
function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function StudentsListScreen() {
  const navigation = useNavigation();
  const [students, setStudents] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKind, setFilterKind] = useState<FilterKind>("all");
  const [selectedStudent, setSelectedStudent] = useState<DirectoryUser | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get("/api/user/students?role=STUDENT");
      setStudents(data.users || []);
    } catch (e) {
      console.error("Error fetching students:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const activeCount = useMemo(() => students.filter((s) => s.isActive).length, [students]);
  const newThisMonth = useMemo(() => students.filter((s) => isNewThisMonth(s.createdAt)).length, [students]);
  const completeProfiles = useMemo(() => students.filter(hasCompleteProfile).length, [students]);
  const activeRatio = students.length > 0 ? activeCount / students.length : 0;

  const filtered = students.filter((s) => {
    if (filterKind === "active" && !s.isActive) return false;
    if (filterKind === "new" && !isNewThisMonth(s.createdAt)) return false;
    if (filterKind === "incomplete" && hasCompleteProfile(s)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    );
  });

  const filters: { value: FilterKind; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "new", label: "New This Month" },
    { value: "incomplete", label: "Incomplete Profile" },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.md }}>Loading students…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Cinematic photo hero */}
            <View style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: "hidden" }}>
              <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
                <LinearGradient colors={["rgba(27,44,92,0.6)", "rgba(27,44,92,0.8)", "rgba(16,24,49,0.95)"]} style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26 }}>
                  <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg }}>
                    <AnimatedPressable pressScale={0.9} onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                      <ArrowLeft size={18} color={colors.white} />
                    </AnimatedPressable>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginBottom: 6 }}>
                        <Sparkles size={10} color={colors.gold} />
                        <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>Student Directory</Text>
                      </View>
                      <Text style={{ fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                        My Students
                      </Text>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.duration(450).delay(100)}>
                    <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.lg }}>
                        <ProgressRing progress={activeRatio} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.4, marginBottom: 8 }}>ENGAGEMENT SNAPSHOT</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, columnGap: 16 }}>
                            <MiniStat icon={Users} value={students.length} label="total" />
                            <MiniStat icon={Trophy} value={newThisMonth} label="new" />
                            <MiniStat icon={ClipboardList} value={completeProfiles} label="complete" />
                          </View>
                        </View>
                      </View>
                    </BlurView>
                  </Animated.View>
                </LinearGradient>
              </ImageBackground>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: spacing.lg }}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name, email, phone, location…"
                leftIcon={<Search size={16} color={colors.inkFaint} />}
              />
              <View style={{ height: spacing.md }} />

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filters}
                keyExtractor={(f) => f.value}
                contentContainerStyle={{ gap: 8, marginBottom: spacing.sm }}
                renderItem={({ item: f }) => {
                  const active = filterKind === f.value;
                  return (
                    <AnimatedPressable pressScale={0.95} onPress={() => setFilterKind(f.value)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: active ? colors.indigo : colors.surface, borderWidth: active ? 0 : 1, borderColor: colors.border }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: active ? colors.white : colors.ink }}>{f.label}</Text>
                    </AnimatedPressable>
                  );
                }}
              />

              <Text style={{ ...type.caption, color: colors.inkMuted, marginBottom: spacing.sm }}>Showing {filtered.length} of {students.length} students</Text>
            </View>
          </View>
        }
        renderItem={({ item: student, index }) => {
          const [gradFrom, gradTo] = gradientForName(student.name || "?");
          const isNew = isNewThisWeek(student.createdAt);
          return (
            <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 10) * 35)}>
              <AnimatedPressable
                onPress={() => setSelectedStudent(student)}
                pressScale={0.98}
                style={{ marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}
              >
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View>
                    <LinearGradient colors={[gradFrom, gradTo]} style={{ width: 52, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {student.avatar ? (
                        <Image source={{ uri: student.avatar }} style={{ width: "100%", height: "100%" }} />
                      ) : (
                        <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 16 }}>{getInitials(student.name)}</Text>
                      )}
                    </LinearGradient>
                    {student.isActive && (
                      <View style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.mint, borderWidth: 2, borderColor: colors.surface }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }} numberOfLines={1}>{student.name}</Text>
                      {isNew && (
                        <Animated.View entering={ZoomIn.duration(300)} style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.goldTint, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill }}>
                          <Sparkles size={9} color={colors.gold} />
                          <Text style={{ fontSize: 9, fontFamily: fonts.bodySemibold, color: colors.gold }}>New</Text>
                        </Animated.View>
                      )}
                      {student.isActive && <Badge label="Active" tone="success" />}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      <Mail size={11} color={colors.inkFaint} />
                      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted, flex: 1 }} numberOfLines={1}>{student.email}</Text>
                    </View>
                    <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint }}>Joined {formatDate(student.createdAt)}</Text>
                  </View>
                  <View style={{ justifyContent: "center" }}>
                    <View style={{ backgroundColor: colors.indigoTint, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.sm }}>
                      <Text style={{ color: colors.indigo, fontSize: 10.5, fontFamily: fonts.bodySemibold }}>Profile</Text>
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            </Animated.View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 20 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <Users size={32} color={colors.indigo} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>No students found</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 4 }}>
              {searchQuery ? "Try adjusting your search" : "No students have enrolled yet"}
            </Text>
          </View>
        }
      />

      <StudentProfileSheet student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </SafeAreaView>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: "45%", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md }}>
      <Icon size={15} color={colors.indigo} style={{ marginBottom: 6 }} />
      <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkFaint, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink }} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function StudentProfileSheet({ student, onClose }: { student: DirectoryUser | null; onClose: () => void }) {
  if (!student) return null;
  const [gradFrom, gradTo] = gradientForName(student.name || "?");
  const age = calculateAge(student.dateOfBirth);

  return (
    <Modal visible={!!student} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: "rgba(23,25,35,0.6)", justifyContent: "flex-end" }}>
        <Animated.View entering={SlideInDown.duration(280).springify().damping(18)} style={{ backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "85%" }}>
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          <LinearGradient colors={[gradFrom, gradTo]} style={{ margin: spacing.lg, borderRadius: radius.lg, padding: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 60, height: 60, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {student.avatar ? (
                  <Image source={{ uri: student.avatar }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 20 }}>{getInitials(student.name)}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.white }} numberOfLines={1}>{student.name}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.75)" }} numberOfLines={1}>{student.email}</Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={onClose} style={{ width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
                <X size={18} color={colors.white} />
              </AnimatedPressable>
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
              <UserCheck size={16} color={colors.indigo} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }}>Personal Information</Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }}>
              {student.phone && <InfoTile icon={Phone} label="Phone" value={student.phone} />}
              {student.location && <InfoTile icon={MapPin} label="Location" value={student.location} />}
              {student.dateOfBirth && <InfoTile icon={Calendar} label="Date of Birth" value={`${formatDate(student.dateOfBirth)}${age !== null ? ` (${age}y)` : ""}`} />}
              <InfoTile icon={Calendar} label="Member Since" value={formatDate(student.createdAt)} />
            </View>

            {student.bio ? (
              <View>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.inkMuted, marginBottom: 6 }}>Bio</Text>
                <Text style={{ ...type.body, fontSize: 13, color: colors.ink, lineHeight: 19 }}>{student.bio}</Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
