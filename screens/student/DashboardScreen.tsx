import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, Alert, Linking, RefreshControl, Dimensions, ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeInDown, FadeIn, ZoomIn, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing,
} from "react-native-reanimated";
import {
  BookOpen, ClipboardCheck, Sparkles, GraduationCap, Trophy, Video,
  MessageCircleQuestion, Wallet, Star, Clock, ChevronRight, Mail, ArrowRight,
} from "lucide-react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "@/store/authStore";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { StudentTabParamList } from "@/navigation/types";
import api from "@/lib/api";
import DashboardHeader from "@/components/DashboardHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import Avatar from "@/components/ui/Avatar";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = BottomTabNavigationProp<StudentTabParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 12;
const TILE_WIDTH = (SCREEN_WIDTH - 20 * 2 - GRID_GAP) / 2;
const STATS_CACHE_KEY = "dashboard:student:stats:v1";
const DAILY_GOAL_MINUTES = 120;

// Placeholder editorial photography — swap for your own institute/student photos before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1741699427799-3fbb70fce948?w=1200&q=80&auto=format&fit=crop";

const secondaryFeatures = [
  { id: "notes", icon: BookOpen, title: "Study Notes", description: "Materials from expert teachers", tag: "Popular", tone: "brand" as const, tab: "Notes" as const },
  { id: "assignments", icon: ClipboardCheck, title: "Assignments", description: "AI-graded, instant feedback", tag: "Top Rated", tone: "gold" as const, tab: "Assignments" as const },
  { id: "teacher", icon: GraduationCap, title: "Teachers", description: "Browse teacher profiles", tag: "Professional", tone: "brand" as const, special: "teachers" as const },
  { id: "quizzes", icon: Trophy, title: "Mock Tests", description: "Unlimited practice quizzes", tag: "Exam Ready", tone: "success" as const, special: "quiz" as const },
  { id: "videos", icon: Video, title: "Video Library", description: "Recorded lectures, 24/7", tag: "On Demand", tone: "brand" as const, tab: "Videos" as const },
  { id: "doubts", icon: MessageCircleQuestion, title: "Doubt Solving", description: "Ask teachers directly", tag: "Active", tone: "success" as const, special: "doubts" as const },
  { id: "payments", icon: Wallet, title: "Payments", description: "Fees & order tracking", tag: "Protected", tone: "brand" as const, special: "payments" as const },
];

const testimonials = [
  { name: "Tanzeel", role: "JEE Aspirant", text: "It is not just an ordinary coaching centre. Every teacher is fully dedicated to teach the students.", rating: 5, course: "JEE Mains 2025" },
  { name: "Amit Sharma", role: "Student", text: "Best institute for all subjects", rating: 5, course: "NEET 2024" },
  { name: "Yash", role: "Student", text: "The faculty is highly knowledgeable and always willing to go the extra mile. Highly recommended!", rating: 5, course: "JEE Mains 2024" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface Stats {
  watchHours: number;
  watchMinutes: number;
  pendingAssignments: number;
  notesCount: number;
  doubtsAsked: number;
}

const emptyStats: Stats = { watchHours: 0, watchMinutes: 0, pendingAssignments: 0, notesCount: 0, doubtsAsked: 0 };

// Circular progress ring for the day's watch-time goal — the hero metric on the glass panel.
function ProgressRing({ progress, size = 72, strokeWidth = 7 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radiusPx = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const offset = circumference * (1 - Math.min(progress, 1));
  const glow = useSharedValue(0.6);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size + 14, height: size + 14, borderRadius: 999, backgroundColor: `${colors.gold}30` }, glowStyle]} />
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radiusPx} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radiusPx}
          stroke={colors.gold} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          rotation={-90} origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 15 }}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
}

export default function StudentDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<Nav>();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [hasAnyData, setHasAnyData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveTestimonial((p) => (p + 1) % testimonials.length);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const fetchStats = useCallback(async () => {
    const next: Stats = { ...emptyStats };
    await Promise.allSettled([
      api.get("/api/student/watch-stats").then(({ data }) => {
        next.watchHours = data?.watchTime?.hours ?? 0;
        next.watchMinutes = data?.watchTime?.minutes ?? 0;
      }),
      api.get("/api/student/assignments").then(({ data }) => {
        if (data?.success) next.pendingAssignments = data.assignments.filter((a: any) => !a.mySubmission).length;
      }),
      api.get("/api/student/notes").then(({ data }) => {
        if (data?.success) next.notesCount = data.notes.length;
      }),
      api.get("/api/doubts").then(({ data }) => {
        if (data?.success) next.doubtsAsked = data.doubts.filter((d: any) => d.isMyDoubt).length;
      }),
    ]);
    setStats(next);
    setHasAnyData(true);
    AsyncStorage.setItem(STATS_CACHE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STATS_CACHE_KEY);
        if (cached && !cancelled) {
          setStats(JSON.parse(cached));
          setHasAnyData(true);
        }
      } catch {}
      fetchStats();
    })();
    return () => { cancelled = true; };
  }, [fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const openFeature = (feature: { tab?: any; special?: string; title: string }) => {
    if (feature.tab) {
      navigation.navigate(feature.tab);
    } else if (feature.special) {
      const specialRoutes: Record<string, string> = {
        quiz: "Quiz", doubts: "Doubts", payments: "Payments", "study-planner": "StudyPlanner", teachers: "Teachers",
      };
      const route = specialRoutes[feature.special];
      if (route) (navigation as any).getParent()?.navigate(route);
    } else {
      Alert.alert(feature.title, "This section is coming soon in the app.");
    }
  };

  const t = testimonials[activeTestimonial];
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const todayMinutes = stats.watchHours * 60 + stats.watchMinutes;
  const goalProgress = todayMinutes / DAILY_GOAL_MINUTES;

  const miniStats = [
    { icon: ClipboardCheck, value: stats.pendingAssignments, label: "Pending" },
    { icon: BookOpen, value: stats.notesCount, label: "Notes" },
    { icon: MessageCircleQuestion, value: stats.doubtsAsked, label: "Doubts" },
  ];

  const toneIconColor: Record<string, string> = { brand: colors.indigo, gold: colors.gold, success: colors.mint };
  const toneTileBg: Record<string, string> = { brand: colors.indigoTint, gold: colors.goldTint, success: colors.mintTint };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} colors={[colors.indigo]} />}
      >
        {/* Hero — real photography, branded color wash, glass panel */}
        <View style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: "hidden" }}>
          <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
            <LinearGradient
              colors={["rgba(27,44,92,0.55)", "rgba(27,44,92,0.75)", "rgba(16,24,49,0.95)"]}
              style={{ paddingHorizontal: 20, paddingBottom: 28 }}
            >
              <DashboardHeader title="Intense Learners" subtitle="Learn with intensity" />

              <Animated.View entering={FadeIn.duration(450)} style={{ marginTop: 10, marginBottom: 22 }}>
                <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 0.8, marginBottom: 4 }}>
                  {getGreeting().toUpperCase()}
                </Text>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }} numberOfLines={1}>
                  {firstName}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(450).delay(100)}>
                <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.lg }}>
                    <ProgressRing progress={hasAnyData ? goalProgress : 0} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.4, marginBottom: 2 }}>TODAY'S GOAL</Text>
                      <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 14, marginBottom: 10 }}>
                        {hasAnyData ? `${stats.watchHours}h ${stats.watchMinutes}m` : "—"} <Text style={{ color: "rgba(255,255,255,0.55)", fontFamily: fonts.body, fontSize: 12 }}>/ 2h watched</Text>
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 6, columnGap: 12 }}>
                        {miniStats.map((s, i) => (
                          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                            <s.icon size={12} color="rgba(255,255,255,0.7)" />
                            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12.5 }}>{hasAnyData ? s.value : "–"}</Text>
                            <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: fonts.body, fontSize: 10 }} numberOfLines={1}>{s.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Featured card — full width, the flagship feature gets real weight */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <AnimatedPressable pressScale={0.98} onPress={() => openFeature({ special: "study-planner", title: "AI Study Planner" })}>
              <LinearGradient colors={[colors.indigoDark, colors.indigo]} style={{ borderRadius: radius.lg, padding: spacing.lg, overflow: "hidden" }}>
                <View pointerEvents="none" style={{ position: "absolute", top: -30, right: -20, width: 130, height: 130, borderRadius: 999, backgroundColor: "rgba(201,154,46,0.18)" }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, marginBottom: 12 }}>
                  <Sparkles size={11} color={colors.gold} />
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10.5 }}>AI POWERED</Text>
                </View>
                <Text style={{ ...type.h2, color: colors.white, marginBottom: 6 }}>Your AI Study Planner</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 19, marginBottom: 18, maxWidth: "85%" }}>
                  A personalized, adaptive schedule built around your goals — generated in seconds.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Generate my plan</Text>
                  <ArrowRight size={15} color={colors.white} />
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>
        </View>

        {/* Secondary feature grid */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ ...type.h3, color: colors.ink, marginBottom: 14 }}>More for You</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP }}>
            {secondaryFeatures.map((feature, idx) => (
              <Animated.View key={feature.id} entering={FadeInDown.duration(380).delay(idx * 50)} style={{ width: TILE_WIDTH }}>
                <Card onPress={() => openFeature(feature)} padding="md" style={{ height: 168, borderTopWidth: 3, borderTopColor: toneIconColor[feature.tone] }}>
                  <View style={{ flex: 1, justifyContent: "space-between" }}>
                    <View>
                      <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: toneTileBg[feature.tone], alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }}>
                        <feature.icon size={21} color={toneIconColor[feature.tone]} />
                      </View>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink, marginBottom: 3 }}>{feature.title}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted, lineHeight: 15 }} numberOfLines={2}>{feature.description}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Badge label={feature.tag} tone={feature.tone} />
                      <ChevronRight size={15} color={colors.inkFaint} />
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View style={{ backgroundColor: colors.indigoDark, marginTop: 4, paddingHorizontal: 20, paddingVertical: 40, overflow: "hidden" }}>
          <Text style={{ position: "absolute", top: 10, left: 16, fontFamily: fonts.displayBold, fontSize: 90, color: "rgba(255,255,255,0.04)" }}>"</Text>
          <Text style={{ ...type.h2, color: colors.white, textAlign: "center", marginBottom: 4 }}>Real Success Stories</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 24 }}>
            From students who trusted Intense Learners
          </Text>

          <Animated.View
            key={activeTestimonial}
            entering={FadeIn.duration(350)}
            style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.xl, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", padding: 24 }}
          >
            <View style={{ flexDirection: "row", gap: 2, marginBottom: 16 }}>
              {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={16} color={colors.gold} fill={colors.gold} />)}
            </View>
            <Text style={{ color: colors.white, fontFamily: fonts.body, fontSize: 15, lineHeight: 23, marginBottom: 20, fontStyle: "italic" }}>"{t.text}"</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Avatar name={t.name} size="md" />
              <View>
                <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 14 }}>{t.name}</Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.body, fontSize: 12 }}>{t.role}</Text>
                <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: fonts.body, fontSize: 10.5 }}>{t.course}</Text>
              </View>
            </View>
          </Animated.View>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 20 }}>
            {testimonials.map((_, idx) => (
              <AnimatedPressable
                key={idx}
                pressScale={0.85}
                onPress={() => setActiveTestimonial(idx)}
                style={{ height: 8, width: idx === activeTestimonial ? 28 : 8, borderRadius: radius.pill, backgroundColor: idx === activeTestimonial ? colors.white : "rgba(255,255,255,0.3)" }}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={{ backgroundColor: colors.ink, paddingHorizontal: 20, paddingVertical: 40 }}>
          <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 16, marginBottom: 2 }}>Intense Learners</Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: fonts.body, fontSize: 12, marginBottom: 20 }}>Learn with intensity</Text>

          <AnimatedPressable
            onPress={() => (navigation as any).getParent()?.navigate("Contact")}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: radius.lg, padding: spacing.md, marginBottom: 24 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 36, height: 36, backgroundColor: colors.indigo, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" }}>
                <Mail size={16} color={colors.white} />
              </View>
              <View>
                <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Need help?</Text>
                <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: fonts.body, fontSize: 11.5 }}>Contact our support team</Text>
              </View>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.35)" />
          </AnimatedPressable>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 32 }}>
            {[
              { name: "logo-facebook" as const, url: "https://www.facebook.com/share/1E77DTHG5w/" },
              { name: "logo-instagram" as const, url: "https://www.instagram.com/intense_learners?igsh=MTVtNTV2Znd6cGVrZQ==" },
              { name: "logo-youtube" as const, url: "https://youtube.com/@intense_learners?si=PKpm1w_PnuAImiYG" },
            ].map((social) => (
              <AnimatedPressable key={social.name} pressScale={0.9} onPress={() => Linking.openURL(social.url)} style={{ width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: radius.md, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={social.name} size={19} color="rgba(255,255,255,0.55)" />
              </AnimatedPressable>
            ))}
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 20 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: fonts.body, fontSize: 11.5, textAlign: "center" }}>© 2026 Intense Learners. All rights reserved.</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: fonts.body, fontSize: 11.5, textAlign: "center", marginTop: 6 }}>Made with care in India</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
