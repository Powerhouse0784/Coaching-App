import { useState, type ReactNode } from "react";
import { View, Text, ScrollView, Switch, ActivityIndicator, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Bell, Shield, Database, Download, Trash2,
  HelpCircle, LogOut, Info,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Tab = "notifications" | "privacy" | "advanced";

interface SettingsState {
  pushNotifications: boolean;
  emailNotifications: boolean;
  assignmentReminders: boolean;
  allowMessaging: boolean;
  profileVisible: boolean;
}

function ToggleRow({ label, desc, value, onToggle, last }: { label: string; desc: string; value: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }}>{label}</Text>
        <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 1 }}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: colors.indigo }} thumbColor={colors.white} />
    </View>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const logout = useAuthStore((s) => s.logout);
  const currentUser = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<Tab>("notifications");
  const [settings, setSettings] = useState<SettingsState>({
    pushNotifications: true,
    emailNotifications: true,
    assignmentReminders: true,
    allowMessaging: true,
    profileVisible: true,
  });
  const [downloading, setDownloading] = useState(false);

  const handleToggle = (key: keyof SettingsState) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadData = async () => {
    if (!currentUser?.id) return;
    setDownloading(true);
    try {
      const { data: userData } = await api.get(`/api/user/profile/${currentUser.id}`);
      const exportData = {
        personalInformation: {
          name: userData.name, email: userData.email, phone: userData.phone,
          location: userData.location, dateOfBirth: userData.dateOfBirth, bio: userData.bio,
        },
        professionalInformation: {
          role: userData.role, qualification: userData.qualification, experience: userData.experience,
          subjects: userData.subjects, specialization: userData.specialization, teachingStyle: userData.teachingStyle,
        },
        socialProfiles: {
          website: userData.website, linkedin: userData.linkedin, twitter: userData.twitter, instagram: userData.instagram,
        },
      };
      await Share.share({ title: "My Intense Learners Data", message: JSON.stringify(exportData, null, 2) });
    } catch (err: any) {
      Alert.alert("Error", "Failed to fetch your data. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This cannot be undone. Please contact support to proceed.",
      [{ text: "OK" }]
    );
  };

  const handleLogout = () => {
    Alert.alert("Log out?", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  const tabs: { id: Tab; label: string; icon: typeof Bell }[] = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "advanced", label: "Advanced", icon: Database },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <AnimatedPressable
          pressScale={0.9}
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} color={colors.ink} />
        </AnimatedPressable>
        <Text style={{ ...type.h3, fontSize: 16, color: colors.ink }}>Settings</Text>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <AnimatedPressable
              key={t.id}
              pressScale={0.96}
              onPress={() => setTab(t.id)}
              style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: active ? colors.indigo : "transparent" }}
            >
              <t.icon size={13} color={active ? colors.indigo : colors.inkFaint} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: active ? colors.indigo : colors.inkFaint }}>{t.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {tab === "notifications" && (
          <Card>
            <ToggleRow label="Push Notifications" desc="Get notified on your device" value={settings.pushNotifications} onToggle={() => handleToggle("pushNotifications")} />
            <ToggleRow label="Email Notifications" desc="Receive updates via email" value={settings.emailNotifications} onToggle={() => handleToggle("emailNotifications")} />
            <ToggleRow label="Assignment Reminders" desc="Reminders before due dates" value={settings.assignmentReminders} onToggle={() => handleToggle("assignmentReminders")} last />
          </Card>
        )}

        {tab === "privacy" && (
          <View>
            <Card>
              <ToggleRow label="Direct Messaging" desc="Allow others to message you" value={settings.allowMessaging} onToggle={() => handleToggle("allowMessaging")} />
              <ToggleRow label="Profile Visibility" desc="Show your profile to others" value={settings.profileVisible} onToggle={() => handleToggle("profileVisible")} last />
            </Card>

            <View style={{ flexDirection: "row", gap: 10, backgroundColor: colors.indigoTint, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md }}>
              <Info size={16} color={colors.indigo} style={{ marginTop: 2 }} />
              <Text style={{ ...type.caption, color: colors.indigoDark, flex: 1, lineHeight: 17 }}>
                Your data is encrypted and secure. We never share it without your consent.
              </Text>
            </View>
          </View>
        )}

        {tab === "advanced" && (
          <View style={{ gap: spacing.md }}>
            <AnimatedPressable
              pressScale={0.98}
              onPress={handleDownloadData}
              disabled={downloading}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md }}
            >
              {downloading ? <ActivityIndicator size="small" color={colors.indigo} /> : <Download size={18} color={colors.indigo} />}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }}>Download Your Data</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted }}>Export your profile information</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              pressScale={0.98}
              onPress={handleDeleteAccount}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.coralTint, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(193,68,58,0.25)", padding: spacing.md }}
            >
              <Trash2 size={18} color={colors.coral} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.coral }}>Delete Account</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.coral }}>Permanently delete your account and data</Text>
              </View>
            </AnimatedPressable>

            <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <HelpCircle size={18} color={colors.inkMuted} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink, marginBottom: 3 }}>Need Help?</Text>
                  <Text style={{ ...type.caption, color: colors.inkMuted, marginBottom: spacing.sm }}>Contact support for assistance.</Text>
                  <AnimatedPressable pressScale={0.95} onPress={() => (navigation as any).getParent()?.navigate("Contact")}>
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.indigo }}>Contact Support →</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </View>
          </View>
        )}

        <AnimatedPressable
          pressScale={0.97}
          onPress={handleLogout}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.md, paddingVertical: 13, marginTop: spacing.xl }}
        >
          <LogOut size={16} color={colors.coral} />
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.coral }}>Log Out</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}
