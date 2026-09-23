import { useState, useEffect, useCallback, type ReactNode } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import {
  Settings, Camera, Clock, FileWarning, MessageCircleQuestion,
  UserCog, CalendarDays, Wallet, Users, HelpCircle, LogOut, ChevronRight,
  Mail, Phone, MapPin,
} from "lucide-react-native";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { ProfileData } from "@/types";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

interface Stats {
  watchHours: number;
  watchMinutes: number;
  pendingAssignments: number;
  doubtsAsked: number;
}
const emptyStats: Stats = { watchHours: 0, watchMinutes: 0, pendingAssignments: 0, doubtsAsked: 0 };

export default function StudentProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const next: Stats = { ...emptyStats };
    await Promise.allSettled([
      api.get("/api/user/profile").then(({ data }) => setProfile(data.user || data)),
      api.get("/api/student/watch-stats").then(({ data }) => {
        next.watchHours = data?.watchTime?.hours ?? 0;
        next.watchMinutes = data?.watchTime?.minutes ?? 0;
      }),
      api.get("/api/student/assignments").then(({ data }) => {
        if (data?.success) next.pendingAssignments = data.assignments.filter((a: any) => !a.mySubmission).length;
      }),
      api.get("/api/doubts").then(({ data }) => {
        if (data?.success) next.doubtsAsked = data.doubts.filter((d: any) => d.isMyDoubt).length;
      }),
    ]);
    setStats(next);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll need to sign in again to access your account.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  const goTo = (route: string) => (navigation as any).getParent()?.navigate(route);

  const displayName = profile?.name || user?.name || "Student";
  const avatarUrl = profile?.avatar || user?.avatar;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Minimal top bar */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
          <Text style={{ ...type.caption, fontFamily: fonts.bodySemibold, color: colors.inkMuted, letterSpacing: 1.2, textTransform: "uppercase", fontSize: 11 }}>
            Profile
          </Text>
          <AnimatedPressable
            pressScale={0.9}
            onPress={() => goTo("Settings")}
            style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
          >
            <Settings size={16} color={colors.inkMuted} />
          </AnimatedPressable>
        </View>

        {/* Centered avatar card — distinct composition from every other screen */}
        <Animated.View entering={FadeIn.duration(350)} style={{ alignItems: "center", paddingTop: spacing.md, paddingBottom: spacing.lg }}>
          <AnimatedPressable pressScale={0.95} onPress={() => goTo("EditProfile")} style={{ position: "relative" }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 3, borderColor: colors.surface }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 32 }}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: colors.paper }}>
              <Camera size={13} color={colors.white} />
            </View>
          </AnimatedPressable>

          <Text style={{ ...type.h2, fontSize: 20, color: colors.ink, marginTop: spacing.md }}>{displayName}</Text>
          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 2 }}>{profile?.email || user?.email}</Text>

          {(profile?.phone || profile?.location) && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8 }}>
              {profile?.phone && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Phone size={11} color={colors.inkFaint} />
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>{profile.phone}</Text>
                </View>
              )}
              {profile?.location && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} color={colors.inkFaint} />
                  <Text style={{ ...type.caption, color: colors.inkMuted }}>{profile.location}</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Centered stat trio with dividers — a third distinct stat treatment */}
        <Animated.View entering={FadeInUp.duration(350).delay(80)} style={{ flexDirection: "row", marginHorizontal: 20, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg }}>
          <StatCol icon={Clock} value={loading ? "—" : `${stats.watchHours}h ${stats.watchMinutes}m`} label="Watch Time" />
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <StatCol icon={FileWarning} value={loading ? "—" : String(stats.pendingAssignments)} label="Pending" />
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <StatCol icon={MessageCircleQuestion} value={loading ? "—" : String(stats.doubtsAsked)} label="Doubts Asked" />
        </Animated.View>

        {profile?.bio ? (
          <Animated.View entering={FadeInUp.duration(350).delay(120)} style={{ marginHorizontal: 20, marginTop: spacing.lg }}>
            <Text style={{ ...type.body, fontSize: 13, color: colors.inkMuted, lineHeight: 19, fontStyle: "italic" }}>"{profile.bio}"</Text>
          </Animated.View>
        ) : null}

        {/* Grouped menu sections — iOS-settings style, unlike anything used so far */}
        <MenuSection title="Account" delay={160}>
          <MenuRow icon={UserCog} label="Edit Profile" onPress={() => goTo("EditProfile")} />
          <MenuRow icon={Settings} label="Settings" onPress={() => goTo("Settings")} />
        </MenuSection>

        <MenuSection title="Academics" delay={200}>
          <MenuRow icon={CalendarDays} label="Study Planner" onPress={() => goTo("StudyPlanner")} />
          <MenuRow icon={Wallet} label="Payments & Fees" onPress={() => goTo("Payments")} />
          <MenuRow icon={Users} label="Find Teachers" onPress={() => goTo("Teachers")} />
        </MenuSection>

        <MenuSection title="Support" delay={240}>
          <MenuRow icon={HelpCircle} label="Contact & Help" onPress={() => goTo("Contact")} last />
        </MenuSection>

        <Animated.View entering={FadeInUp.duration(350).delay(280)} style={{ marginHorizontal: 20, marginTop: spacing.lg }}>
          <AnimatedPressable
            pressScale={0.97}
            onPress={handleLogout}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.md, paddingVertical: 13 }}
          >
            <LogOut size={16} color={colors.coral} />
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.coral }}>Log Out</Text>
          </AnimatedPressable>
        </Animated.View>

        <Text style={{ textAlign: "center", ...type.caption, color: colors.inkFaint, marginTop: spacing.lg, fontSize: 10.5 }}>
          {user?.role === "STUDENT" ? "Student" : user?.role} Account
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCol({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Icon size={16} color={colors.indigo} />
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink, marginTop: 6 }} numberOfLines={1}>{value}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function MenuSection({ title, delay, children }: { title: string; delay: number; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInUp.duration(350).delay(delay)} style={{ marginHorizontal: 20, marginTop: spacing.lg }}>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.inkFaint, letterSpacing: 1, textTransform: "uppercase", marginBottom: spacing.sm, marginLeft: 2 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
        {children}
      </View>
    </Animated.View>
  );
}

function MenuRow({ icon: Icon, label, onPress, last }: { icon: typeof UserCog; label: string; onPress: () => void; last?: boolean }) {
  return (
    <AnimatedPressable
      pressScale={0.98}
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.lg, paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={colors.indigo} />
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.ink }}>{label}</Text>
      <ChevronRight size={16} color={colors.inkFaint} />
    </AnimatedPressable>
  );
}
