import { View, Text, ScrollView, Alert, Dimensions, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  BookOpen, ClipboardCheck, Users, Sparkles, Video, MessageCircle,
  CalendarDays, Star, Wallet, Trophy, ArrowRight, ChevronRight, Plus,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { TeacherTabParamList } from "@/navigation/types";
import DashboardHeader from "@/components/DashboardHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = BottomTabNavigationProp<TeacherTabParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 12;
const TILE_WIDTH = (SCREEN_WIDTH - 20 * 2 - GRID_GAP) / 2;

// Placeholder editorial photography — swap for a real photo of your own classroom/teachers.
const HERO_PHOTO = "https://images.unsplash.com/photo-1758270704925-fa59d93119c1?w=1200&q=80&auto=format&fit=crop";

const secondaryFeatures = [
  { id: "notes", icon: BookOpen, title: "Study Notes", description: "Upload materials for students", tag: "Popular", tone: "brand" as const, tab: "Notes" as const },
  { id: "students", icon: Users, title: "Students", description: "Progress & performance data", tag: "Dashboard", tone: "success" as const, special: "students" as const },
  { id: "library", icon: Video, title: "Video Library", description: "Upload recorded lectures", tag: "On Demand", tone: "brand" as const, tab: "VideoLibrary" as const },
  { id: "doubts", icon: MessageCircle, title: "Student Doubts", description: "Answer questions, 24/7", tag: "Active", tone: "success" as const, special: "doubts" as const },
  { id: "chat", icon: MessageCircle, title: "Teacher Chat", description: "Collaborate with colleagues", tag: "New", tone: "brand" as const, special: "chat" as const },
  { id: "schedule", icon: CalendarDays, title: "Schedule", description: "Manage your teaching calendar", tag: "Planner", tone: "success" as const, special: "schedule" as const },
];

const stats = [
  { value: "150", label: "Students", icon: Users },
  { value: "4.9", label: "Rating", icon: Star },
  { value: "98%", label: "Success", icon: Trophy },
];

const toneIconColor: Record<string, string> = { brand: colors.indigo, gold: colors.gold, success: colors.mint };
const toneTileBg: Record<string, string> = { brand: colors.indigoTint, gold: colors.goldTint, success: colors.mintTint };

export default function TeacherDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<Nav>();

  const openFeature = (feature: (typeof secondaryFeatures)[number]) => {
    if (feature.tab) {
      navigation.navigate(feature.tab);
    } else if ((feature as any).special === "doubts") {
      (navigation as any).getParent()?.navigate("Doubts");
    } else if ((feature as any).special === "chat") {
      (navigation as any).getParent()?.navigate("Chat");
    } else if ((feature as any).special === "schedule") {
      (navigation as any).getParent()?.navigate("Schedule");
    } else if ((feature as any).special === "students") {
      (navigation as any).getParent()?.navigate("Students");
    } else {
      Alert.alert(feature.title, "This section is coming soon in the app.");
    }
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero — real photography, branded color wash, glass stat panel */}
        <View style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: "hidden" }}>
          <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
            <LinearGradient
              colors={["rgba(27,44,92,0.55)", "rgba(27,44,92,0.75)", "rgba(16,24,49,0.95)"]}
              style={{ paddingHorizontal: 20, paddingBottom: 28 }}
            >
              <DashboardHeader title="Intense Learners" subtitle="Teacher Portal" />

              <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: 10, marginBottom: 18 }}>
                <View
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
                    backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", marginBottom: 14,
                  }}
                >
                  <Sparkles size={12} color={colors.gold} />
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 11.5 }}>Professional Teaching Dashboard</Text>
                </View>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 35, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6, marginBottom: 8 }}>
                  Welcome back, {firstName}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 19 }}>
                  You have notes uploaded and new questions to answer. Keep inspiring minds!
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(400).delay(80)} style={{ flexDirection: "row", gap: 10, marginBottom: spacing.lg }}>
                <AnimatedPressable pressScale={0.96} onPress={() => navigation.navigate("Notes")} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 13 }}>
                  <BookOpen size={15} color={colors.ink} />
                  <Text style={{ color: colors.ink, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Manage Notes</Text>
                </AnimatedPressable>
                <AnimatedPressable pressScale={0.96} onPress={() => navigation.navigate("Assignments")} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: radius.md, paddingVertical: 13, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)" }}>
                  <Plus size={15} color={colors.white} />
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Add Assignment</Text>
                </AnimatedPressable>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(400).delay(140)}>
                <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                  <View style={{ flexDirection: "row" }}>
                    {stats.map((s, idx) => (
                      <View key={idx} style={{ flex: 1, alignItems: "center", paddingVertical: spacing.lg, borderRightWidth: idx < stats.length - 1 ? 1 : 0, borderRightColor: "rgba(255,255,255,0.12)" }}>
                        <s.icon size={16} color={colors.gold} style={{ marginBottom: 6 }} />
                        <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 18 }}>{s.value}</Text>
                        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.body, fontSize: 10.5 }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </BlurView>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Featured card — AI Assistant gets the flagship spot */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <AnimatedPressable pressScale={0.98} onPress={() => (navigation as any).getParent()?.navigate("AIAssistant")}>
              <LinearGradient colors={[colors.indigoDark, colors.indigo]} style={{ borderRadius: radius.lg, padding: spacing.lg, overflow: "hidden" }}>
                <View pointerEvents="none" style={{ position: "absolute", top: -30, right: -20, width: 130, height: 130, borderRadius: 999, backgroundColor: "rgba(201,154,46,0.18)" }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, marginBottom: 12 }}>
                  <Sparkles size={11} color={colors.gold} />
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10.5 }}>AI POWERED</Text>
                </View>
                <Text style={{ ...type.h2, color: colors.white, marginBottom: 6 }}>AI Teaching Assistant</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 19, marginBottom: 18, maxWidth: "85%" }}>
                  Generate lesson plans, grading rubrics, and teaching strategies in seconds.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Open assistant</Text>
                  <ArrowRight size={15} color={colors.white} />
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>
        </View>

        {/* Secondary feature grid */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <Text style={{ ...type.h3, color: colors.ink, marginBottom: 14 }}>Everything You Need</Text>
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

        {/* Footer */}
        <View style={{ backgroundColor: colors.ink, paddingHorizontal: 20, paddingVertical: 40, marginTop: 4 }}>
          <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 16, textAlign: "center", marginBottom: 2 }}>Intense Learners</Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: fonts.body, fontSize: 12, textAlign: "center", marginBottom: 16 }}>Teacher Portal</Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: fonts.body, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 20 }}>
            Empowering educators with AI-powered tools to inspire and educate the next generation.
          </Text>
          <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 20 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: fonts.body, fontSize: 11.5, textAlign: "center" }}>© 2026 Intense Learners. All rights reserved.</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: fonts.body, fontSize: 11.5, textAlign: "center", marginTop: 6 }}>Made with care for Teachers</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
