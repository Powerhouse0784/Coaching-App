import { View, Text, ScrollView, TouchableOpacity,  Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BookOpen, FileText, Users, Brain, Play, MessageSquare,
  Calendar, Sparkles, Star, DollarSign, Trophy, ArrowRight, Plus,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { TeacherTabParamList } from "@/navigation/types";
import DashboardHeader from "@/components/DashboardHeader";

type Nav = BottomTabNavigationProp<TeacherTabParamList>;

const platformFeatures = [
  { id: "notes", icon: BookOpen, title: "Study Notes", description: "Upload and manage study materials and notes for your students", colors: ["#3b82f6", "#06b6d4"], tag: "Popular", tab: "Notes" as const },
  { id: "assignments", icon: FileText, title: "Assignments", description: "Create and grade assignments with AI-powered assistance", colors: ["#a855f7", "#ec4899"], tag: "Active", tab: "Assignments" as const },
  { id: "students", icon: Users, title: "Students", description: "Monitor progress, attendance, and performance analytics", colors: ["#22c55e", "#10b981"], tag: "Dashboard", special: "students" as const },
  { id: "ai-assistant", icon: Brain, title: "AI Assistant", description: "Get instant help with lesson plans, content creation, and strategies", colors: ["#6366f1", "#a855f7"], tag: "AI Powered", special: "ai-assistant" as const },
  { id: "library", icon: Play, title: "Video Library", description: "Upload and organize your recorded lecture videos", colors: ["#f43f5e", "#ec4899"], tag: "On Demand", tab: "VideoLibrary" as const },
  { id: "doubts", icon: MessageSquare, title: "Student Doubts", description: "Answer questions and provide guidance 24/7", colors: ["#eab308", "#f97316"], tag: "Active", special: "doubts" as const },
  { id: "chat", icon: MessageSquare, title: "Teacher Chat", description: "Connect and collaborate with fellow teachers", colors: ["#06b6d4", "#3b82f6"], tag: "New", special: "chat" as const },
  { id: "schedule", icon: Calendar, title: "Schedule", description: "Manage your teaching calendar and sessions", colors: ["#14b8a6", "#06b6d4"], tag: "Planner", special: "schedule" as const },
];

const stats = [
  { value: "150", label: "Total Students", icon: Users },
  { value: "4.9", label: "Avg Rating", icon: Star },
  { value: "Free", label: "This Month", icon: DollarSign },
  { value: "98%", label: "Success Rate", icon: Trophy },
];

export default function TeacherDashboardScreen() {
    const user = useAuthStore((s) => s.user);
    const navigation = useNavigation<Nav>();

    const openFeature = (feature: (typeof platformFeatures)[number]) => {
  if (feature.tab) {
    navigation.navigate(feature.tab);
  } else if ((feature as any).special === "doubts") {
    (navigation as any).getParent()?.navigate("Doubts");
  } else if ((feature as any).special === "chat") {
    (navigation as any).getParent()?.navigate("Chat");
  } else if ((feature as any).special === "ai-assistant") {
    (navigation as any).getParent()?.navigate("AIAssistant"); 
  } else if ((feature as any).special === "schedule") {
  (navigation as any).getParent()?.navigate("Schedule");
  }else if ((feature as any).special === "students") {
    (navigation as any).getParent()?.navigate("Students");
  } else {
    Alert.alert(feature.title, "This section is coming soon in the app.");
  }
};

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <LinearGradient colors={["#1e1b4b", "#581c87", "#831843"]} className="px-5 pt-6 pb-8 rounded-b-3xl">
          <DashboardHeader title="Intense Learners" subtitle="Teacher Portal" />

          <View className="flex-row items-center gap-2 bg-white/10 self-start px-3 py-1.5 rounded-full mb-4 border border-white/20">
            <Sparkles size={12} color="#facc15" />
            <Text className="text-white text-xs font-semibold">Professional Teaching Dashboard</Text>
          </View>

          <Text className="text-2xl font-bold leading-tight mb-4">
            <Text className="text-white">Welcome back, </Text>
            <Text className="text-orange-300">{user?.name?.split(" ")[0]}! 👋</Text>
          </Text>

          <Text className="text-purple-100 text-sm leading-relaxed mb-5">
            You have notes uploaded and new questions to answer. Keep inspiring minds!
          </Text>

          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity onPress={() => openFeature(platformFeatures[0])} activeOpacity={0.85} className="flex-1">
              <LinearGradient colors={["#facc15", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="rounded-xl py-3 items-center flex-row justify-center gap-2">
                <BookOpen size={16} color="#1f2937" />
                <Text className="text-gray-900 font-bold text-sm">Manage Notes</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openFeature(platformFeatures[1])} activeOpacity={0.85} className="flex-1 bg-white/10 border-2 border-white/20 rounded-xl py-3 items-center flex-row justify-center gap-2">
              <Plus size={16} color="#fff" />
              <Text className="text-white font-bold text-sm">Add Assignment</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat, idx) => (
              <View key={idx} className="bg-white/10 rounded-2xl px-4 py-3 border border-white/20" style={{ minWidth: "45%" }}>
                <View className="flex-row items-center gap-2 mb-1">
                  <stat.icon size={16} color="#fff" />
                  <Text className="text-white text-lg font-bold">{stat.value}</Text>
                </View>
                <Text className="text-purple-200 text-xs">{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Feature grid ── */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-lg font-bold text-foreground mb-1">Everything You Need</Text>
          <Text className="text-sm text-muted-foreground mb-5">Powerful tools to teach, track, and inspire</Text>

          <View className="gap-4">
            {platformFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                onPress={() => openFeature(feature)}
                activeOpacity={0.85}
                className="bg-card rounded-2xl p-4 border border-border shadow-sm flex-row items-center gap-4"
              >
                <LinearGradient
                  colors={feature.colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                >
                  <feature.icon size={24} color="#fff" />
                </LinearGradient>

                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                    <Text className="font-bold text-foreground text-sm">{feature.title}</Text>
                    {feature.tag && (
                      <View className="bg-orange-100 px-2 py-0.5 rounded-full">
                        <Text className="text-orange-700 text-[10px] font-bold">{feature.tag}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-muted-foreground text-xs leading-relaxed">{feature.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Footer ── */}
        <View className="bg-gray-900 px-5 py-10 mt-4">
          <Text className="text-white text-lg font-bold text-center mb-1">Intense Learners</Text>
          <Text className="text-gray-400 text-xs text-center mb-4">Teacher Portal</Text>
          <Text className="text-gray-400 text-xs leading-relaxed text-center mb-5">
            Empowering educators with AI-powered tools to inspire and educate the next generation.
          </Text>
          <View className="border-t border-gray-800 pt-5">
            <Text className="text-gray-400 text-xs text-center">© 2026 Intense Learners. All rights reserved.</Text>
            <Text className="text-gray-400 text-xs text-center mt-2">Made with ❤️ for Teachers</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}