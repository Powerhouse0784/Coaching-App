import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  ActivityIndicator, Alert, Share, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Bell, Shield, Database, Download, Trash2,
  HelpCircle, LogOut, Info,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Tab = "notifications" | "privacy" | "advanced";

interface SettingsState {
  pushNotifications: boolean;
  emailNotifications: boolean;
  assignmentReminders: boolean;
  allowMessaging: boolean;
  profileVisible: boolean;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // These preferences are local-only, matching web's current behavior
  // (no backend persistence exists for them yet).
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
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          location: userData.location,
          dateOfBirth: userData.dateOfBirth,
          bio: userData.bio,
        },
        professionalInformation: {
          role: userData.role,
          qualification: userData.qualification,
          experience: userData.experience,
          subjects: userData.subjects,
          specialization: userData.specialization,
          teachingStyle: userData.teachingStyle,
        },
        socialProfiles: {
          website: userData.website,
          linkedin: userData.linkedin,
          twitter: userData.twitter,
          instagram: userData.instagram,
        },
      };
      await Share.share({
        title: "My Intense Learners Data",
        message: JSON.stringify(exportData, null, 2),
      });
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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-3 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <Text className="font-bold text-foreground text-base">Settings</Text>
      </View>

      <View className="flex-row border-b border-border px-2">
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            className="flex-1 items-center py-3 flex-row justify-center gap-1.5"
            style={{ borderBottomWidth: 2, borderBottomColor: tab === t.id ? "#6366f1" : "transparent" }}
          >
            <t.icon size={14} color={tab === t.id ? "#6366f1" : "#9ca3af"} />
            <Text className="text-xs font-bold" style={{ color: tab === t.id ? "#6366f1" : "#9ca3af" }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {tab === "notifications" && (
          <View className="gap-3">
            {[
              { key: "pushNotifications" as const, label: "Push Notifications", desc: "Get notified on your device" },
              { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive updates via email" },
              { key: "assignmentReminders" as const, label: "Assignment Reminders", desc: "Reminders before due dates" },
            ].map(({ key, label, desc }) => (
              <View key={key} className="flex-row items-center justify-between bg-card border border-border rounded-xl p-3.5">
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-sm text-foreground">{label}</Text>
                  <Text className="text-xs text-muted-foreground">{desc}</Text>
                </View>
                <Switch value={settings[key]} onValueChange={() => handleToggle(key)} trackColor={{ true: "#6366f1" }} />
              </View>
            ))}
          </View>
        )}

        {tab === "privacy" && (
          <View className="gap-3">
            {[
              { key: "allowMessaging" as const, label: "Direct Messaging", desc: "Allow others to message you" },
              { key: "profileVisible" as const, label: "Profile Visibility", desc: "Show your profile to others" },
            ].map(({ key, label, desc }) => (
              <View key={key} className="flex-row items-center justify-between bg-card border border-border rounded-xl p-3.5">
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-sm text-foreground">{label}</Text>
                  <Text className="text-xs text-muted-foreground">{desc}</Text>
                </View>
                <Switch value={settings[key]} onValueChange={() => handleToggle(key)} trackColor={{ true: "#6366f1" }} />
              </View>
            ))}

            <View className="flex-row gap-2.5 bg-blue-50 border-2 border-blue-200 rounded-xl p-3.5 mt-2">
              <Info size={16} color="#2563eb" style={{ marginTop: 2 }} />
              <Text className="text-xs text-blue-800 flex-1">
                Your data is encrypted and secure. We never share it without your consent.
              </Text>
            </View>
          </View>
        )}

        {tab === "advanced" && (
          <View className="gap-4">
            <TouchableOpacity
              onPress={handleDownloadData}
              disabled={downloading}
              className="flex-row items-center gap-3 bg-card border border-border rounded-xl p-3.5"
            >
              {downloading ? <ActivityIndicator size="small" color="#6366f1" /> : <Download size={18} color="#6366f1" />}
              <View className="flex-1">
                <Text className="font-semibold text-sm text-foreground">Download Your Data</Text>
                <Text className="text-xs text-muted-foreground">Export your profile information</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              className="flex-row items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-3.5"
            >
              <Trash2 size={18} color="#dc2626" />
              <View className="flex-1">
                <Text className="font-semibold text-sm text-red-700">Delete Account</Text>
                <Text className="text-xs text-red-600">Permanently delete your account and data</Text>
              </View>
            </TouchableOpacity>

            <View className="bg-secondary rounded-xl p-3.5">
              <View className="flex-row items-start gap-2.5">
                <HelpCircle size={18} color="#6b7280" style={{ marginTop: 1 }} />
                <View className="flex-1">
                  <Text className="font-semibold text-sm text-foreground mb-1">Need Help?</Text>
                  <Text className="text-xs text-muted-foreground mb-2">Contact support for assistance.</Text>
                  <TouchableOpacity onPress={() => (navigation as any).getParent()?.navigate("Contact")}>
                    <Text className="text-indigo-600 text-xs font-semibold">Contact Support →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl py-3 mt-6"
        >
          <LogOut size={16} color="#dc2626" />
          <Text className="text-red-600 font-semibold text-sm">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}