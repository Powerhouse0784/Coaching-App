import { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen, FileText, Brain, UserCheck, Target, Play,
  MessageSquare, CreditCard, Star, Clock,
  ChevronRight, Mail,
} from "lucide-react-native";
import Ionicons from "@expo/vector-icons/Ionicons"; // or "react-native-vector-icons/Ionicons"
import { useAuthStore } from "@/store/authStore";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { StudentTabParamList } from "@/navigation/types";
import api from "@/lib/api";
import DashboardHeader from "@/components/DashboardHeader";


type Nav = BottomTabNavigationProp<StudentTabParamList>;


const platformFeatures = [
  { id: "notes", icon: BookOpen, title: "Study Notes Library", description: "Comprehensive study materials from expert teachers", colors: ["#3b82f6", "#06b6d4"], tag: "Popular", tab: "Notes" as const },
  { id: "assignments", icon: FileText, title: "Smart Assignments", description: "AI-graded assignments with instant feedback", colors: ["#a855f7", "#ec4899"], tag: "Top Rated", tab: "Assignments" as const },
  { id: "study-planner", icon: Brain, title: "AI Study Planner", description: "Personalized schedules built around your goals", colors: ["#6366f1", "#a855f7"], tag: "AI Powered", special: "study-planner" as const },
  { id: "teacher", icon: UserCheck, title: "Teacher Directory", description: "Browse profiles of all your teachers", colors: ["#f97316", "#ef4444"], tag: "Professional", special: "teachers" as const },
  { id: "quizzes", icon: Target, title: "Practice & Mock Tests", description: "Unlimited quizzes with instant AI evaluation", colors: ["#22c55e", "#14b8a6"], tag: "Exam Ready", special: "quiz" as const },
  { id: "videos", icon: Play, title: "Video Library", description: "High-quality recorded lectures, 24/7 access", colors: ["#f43f5e", "#ec4899"], tag: "On Demand", tab: "Videos" as const },
  { id: "doubts", icon: MessageSquare, title: "Instant Doubt Solving", description: "Get answers from teachers in the discussion forum", colors: ["#eab308", "#f97316"], tag: "Active", special: "doubts" as const },
  { id: "payments", icon: CreditCard, title: "Secure Payments", description: "Fees, hardcopy notes, and order tracking", colors: ["#10b981", "#22c55e"], tag: "Protected", special: "payments" as const },
];


const testimonials = [
  { name: "Tanzeel", role: "JEE Aspirant", initials: "T", text: "It is not just an ordinary coaching centre. Every teacher is fully dedicated to teach the students.", rating: 5, course: "JEE Mains 2025" },
  { name: "Amit Sharma", role: "Student", initials: "AS", text: "Best institute for all subjects 👌", rating: 5, course: "NEET 2024" },
  { name: "Yash", role: "Student", initials: "Y", text: "The faculty is highly knowledgeable and always willing to go the extra mile. Highly recommended!", rating: 5, course: "JEE Mains 2024" },
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


export default function StudentDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<Nav>();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [stats, setStats] = useState<Stats>({ watchHours: 0, watchMinutes: 0, pendingAssignments: 0, notesCount: 0, doubtsAsked: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveTestimonial((p) => (p + 1) % testimonials.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);


  useEffect(() => {
    let cancelled = false;


    const fetchStats = async () => {
      const next: Stats = { watchHours: 0, watchMinutes: 0, pendingAssignments: 0, notesCount: 0, doubtsAsked: 0 };


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


      if (!cancelled) {
        setStats(next);
        setStatsLoading(false);
      }
    };


    fetchStats();
    return () => { cancelled = true; };
  }, []);


  const openFeature = (feature: (typeof platformFeatures)[number]) => {
    if (feature.tab) {
      navigation.navigate(feature.tab);
    } else if ((feature as any).special) {
      const specialRoutes: Record<string, string> = {
        quiz: "Quiz",
        doubts: "Doubts",
        payments: "Payments",
        "study-planner": "StudyPlanner",
        teachers: "Teachers",
      };
      const route = specialRoutes[(feature as any).special];
      if (route) (navigation as any).getParent()?.navigate(route);
    } else {
      Alert.alert(feature.title, "This section is coming soon in the app.");
    }
  };


  const t = testimonials[activeTestimonial];
  const firstName = user?.name?.split(" ")[0] ?? "there";


  const statCards = [
    { icon: Clock, label: "Watch Time", value: statsLoading ? "…" : `${stats.watchHours}h ${stats.watchMinutes}m`, color: "#f43f5e" },
    { icon: FileText, label: "Pending Work", value: statsLoading ? "…" : String(stats.pendingAssignments), color: "#a855f7" },
    { icon: BookOpen, label: "Notes Available", value: statsLoading ? "…" : String(stats.notesCount), color: "#3b82f6" },
    { icon: MessageSquare, label: "Doubts Asked", value: statsLoading ? "…" : String(stats.doubtsAsked), color: "#eab308" },
  ];


  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#1e1b4b", "#581c87", "#831843"]} className="px-5 pt-1 pb-8 rounded-b-[32px]">
          <DashboardHeader title="Intense Learners" subtitle="Learn with intensity" />


          <Text className="text-purple-200 text-xs font-semibold mb-1 mt-2">{getGreeting().toUpperCase()}</Text>
          <Text className="text-white text-[26px] font-extrabold leading-tight mb-4" style={{ letterSpacing: -0.5 }}>
            {getGreeting()}, {firstName} 👋
          </Text>


          <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-4">
            <Text className="text-white/90 text-xs font-semibold mb-3">YOUR PROGRESS TODAY</Text>
            <View className="flex-row flex-wrap gap-3">
              {statCards.map((s, idx) => (
                <View key={idx} className="rounded-xl p-3" style={{ minWidth: "45%", flex: 1, backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <View className="w-8 h-8 rounded-lg items-center justify-center mb-2" style={{ backgroundColor: `${s.color}30` }}>
                    <s.icon size={15} color={s.color} />
                  </View>
                  <Text className="text-white text-base font-bold">{s.value}</Text>
                  <Text className="text-purple-200 text-[10px]">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>


        <View className="px-5 pt-6 pb-4">
          <Text className="text-lg font-bold text-foreground mb-1">Your Learning Platform</Text>
          <Text className="text-sm text-muted-foreground mb-5">Everything you need, in one place</Text>


          <View className="gap-3.5">
            {platformFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                onPress={() => openFeature(feature)}
                activeOpacity={0.85}
                className="bg-card rounded-3xl p-4 border border-border flex-row items-center gap-4"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
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


                <ChevronRight size={18} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>
        </View>


        <LinearGradient colors={["#1e1b4b", "#581c87", "#831843"]} className="mt-4 px-5 py-10">
          <Text className="text-xl font-bold text-white text-center mb-1">Real Success Stories</Text>
          <Text className="text-purple-200 text-sm text-center mb-6">From students who trusted Intense Learners</Text>


          <View className="bg-white/10 rounded-3xl p-6 border border-white/15">
            <View className="flex-row gap-1 mb-4">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={16} color="#facc15" fill="#facc15" />
              ))}
            </View>
            <Text className="text-white text-base leading-relaxed mb-6 italic">"{t.text}"</Text>
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: "#6366f1" }}>
                <Text className="text-white font-bold text-base">{t.initials}</Text>
              </View>
              <View>
                <Text className="text-white font-bold text-sm">{t.name}</Text>
                <Text className="text-purple-200 text-xs">{t.role}</Text>
                <Text className="text-purple-300 text-[10px]">{t.course}</Text>
              </View>
            </View>
          </View>


          <View className="flex-row justify-center gap-2 mt-5">
            {testimonials.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveTestimonial(idx)}
                className={`h-2 rounded-full ${idx === activeTestimonial ? "bg-white w-8" : "bg-white/30 w-2"}`}
              />
            ))}
          </View>
        </LinearGradient>


        <View className="bg-gray-900 px-5 py-10">
          <Text className="text-white text-lg font-bold mb-1">Intense Learners</Text>
          <Text className="text-gray-400 text-xs mb-5">Learn with intensity</Text>


          <TouchableOpacity
            onPress={() => (navigation as any).getParent()?.navigate("Contact")}
            className="flex-row items-center justify-between bg-gray-800 rounded-2xl p-4 mb-6"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-indigo-600 rounded-xl items-center justify-center">
                <Mail size={16} color="#fff" />
              </View>
              <View>
                <Text className="text-white font-semibold text-sm">Need help?</Text>
                <Text className="text-gray-400 text-xs">Contact our support team</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#6b7280" />
          </TouchableOpacity>


          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              onPress={() => Linking.openURL("https://www.facebook.com/share/1E77DTHG5w/")}
              className="w-10 h-10 bg-gray-800 rounded-lg items-center justify-center"
            >
              <Ionicons name="logo-facebook" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://www.instagram.com/intense_learners?igsh=MTVtNTV2Znd6cGVrZQ==")}
              className="w-10 h-10 bg-gray-800 rounded-lg items-center justify-center"
            >
              <Ionicons name="logo-instagram" size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://youtube.com/@intense_learners?si=PKpm1w_PnuAImiYG")}
              className="w-10 h-10 bg-gray-800 rounded-lg items-center justify-center"
            >
              <Ionicons name="logo-youtube" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>


          <View className="border-t border-gray-800 pt-5">
            <Text className="text-gray-400 text-xs text-center">© 2026 Intense Learners. All rights reserved.</Text>
            <Text className="text-gray-400 text-xs text-center mt-2">Made with ❤️ in India</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}