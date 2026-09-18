import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Brain, Calendar, Clock, Target, Trophy, Sparkles,
  ChevronDown, CheckCircle, Check, BookOpen, Lightbulb, Share2,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { StudyPlanData, StudyFormData } from "@/types";

const LEVELS: { value: StudyFormData["level"]; label: string; emoji: string }[] = [
  { value: "beginner", label: "Beginner", emoji: "🌱" },
  { value: "intermediate", label: "Intermediate", emoji: "⚡" },
  { value: "advanced", label: "Advanced", emoji: "🚀" },
];

const DAY_OPTIONS = [3, 7, 14, 21, 30, 60, 90];
const HOUR_OPTIONS = [1, 2, 3, 4, 6, 8];

const TASK_COLORS: Record<string, { bg: string; text: string }> = {
  theory: { bg: "#dbeafe", text: "#1d4ed8" },
  practice: { bg: "#dcfce7", text: "#15803d" },
  project: { bg: "#f3e8ff", text: "#7c3aed" },
  review: { bg: "#ffedd5", text: "#c2410c" },
  break: { bg: "#f1f5f9", text: "#475569" },
};

export default function StudyPlannerScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState<StudyFormData>({
    topics: "", days: 7, hoursPerDay: 2, level: "intermediate", goal: "",
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  const generatePlan = async () => {
    if (!form.topics.trim()) {
      setError("Please enter topics to learn");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const { data } = await api.post("/api/ai/study-plan", form);
      if (!data.success || !data.plan) throw new Error(data.error || "Failed to generate plan");
      setPlan(data.plan);
      setExpandedDays(new Set([0]));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleDay = (idx: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleTask = (dayIndex: number, taskIndex: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      schedule: plan.schedule.map((day, dIdx) =>
        dIdx !== dayIndex
          ? day
          : { ...day, tasks: day.tasks.map((t, tIdx) => (tIdx === taskIndex ? { ...t, completed: !t.completed } : t)) }
      ),
    });
  };

  const handleShare = async () => {
    if (!plan) return;
    let text = `${plan.title}\n${plan.description}\n\n`;
    plan.schedule.forEach((day) => {
      text += `Day ${day.day}: ${day.title}\nFocus: ${day.focus}\n`;
      day.tasks.forEach((t) => { text += `  • ${t.time} — ${t.task} (${t.type}, ${t.duration})\n`; });
      text += `Milestone: ${day.milestone}\n\n`;
    });
    text += `Tips:\n${plan.tips.map((t) => `• ${t}`).join("\n")}`;
    try {
      await Share.share({ title: plan.title, message: text });
    } catch (e) {
      console.error(e);
    }
  };

  const totalTasks = plan ? plan.schedule.reduce((s, d) => s + d.tasks.length, 0) : 0;
  const completedTasks = plan ? plan.schedule.reduce((s, d) => s + d.tasks.filter((t) => t.completed).length, 0) : 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const completedDays = plan ? plan.schedule.filter((d) => d.tasks.every((t) => t.completed)).length : 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-3 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <Text className="font-bold text-foreground text-base">AI Study Planner</Text>
      </View>

      {!plan ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="items-center mb-6">
            <View className="flex-row items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-full mb-3">
              <Sparkles size={13} color="#7c3aed" />
              <Text className="text-purple-700 text-xs font-semibold">Powered by Advanced AI</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground text-center">AI Study Planner</Text>
            <Text className="text-sm text-muted-foreground text-center mt-1.5">
              Get a personalized, adaptive study schedule
            </Text>
          </View>

          {error ? (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          ) : null}

          <Text className="text-sm font-semibold text-foreground mb-1.5">What do you want to learn?</Text>
          <TextInput
            value={form.topics}
            onChangeText={(v) => setForm((f) => ({ ...f, topics: v }))}
            placeholder="E.g., React Hooks, TypeScript, State Management"
            multiline
            numberOfLines={3}
            className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
            style={{ textAlignVertical: "top", minHeight: 80 }}
          />

          <Text className="text-sm font-semibold text-foreground mb-2">Study Duration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {DAY_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setForm((f) => ({ ...f, days: d }))}
                className={`px-4 py-2.5 rounded-xl ${form.days === d ? "bg-purple-600" : "bg-card border-2 border-border"}`}
              >
                <Text className={`text-xs font-bold ${form.days === d ? "text-white" : "text-foreground"}`}>{d} Days</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-sm font-semibold text-foreground mb-2">Daily Study Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {HOUR_OPTIONS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setForm((f) => ({ ...f, hoursPerDay: h }))}
                className={`px-4 py-2.5 rounded-xl ${form.hoursPerDay === h ? "bg-purple-600" : "bg-card border-2 border-border"}`}
              >
                <Text className={`text-xs font-bold ${form.hoursPerDay === h ? "text-white" : "text-foreground"}`}>{h}h/day</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="text-sm font-semibold text-foreground mb-2">Your Current Level</Text>
          <View className="flex-row gap-2.5 mb-4">
            {LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl.value}
                onPress={() => setForm((f) => ({ ...f, level: lvl.value }))}
                className="flex-1 items-center py-3.5 rounded-xl"
                style={{ backgroundColor: form.level === lvl.value ? "#7c3aed" : "#f3f4f6" }}
              >
                <Text className="text-xl mb-1">{lvl.emoji}</Text>
                <Text className={`text-xs font-bold ${form.level === lvl.value ? "text-white" : "text-foreground"}`}>{lvl.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-semibold text-foreground mb-1.5">Your Learning Goal (Optional)</Text>
          <TextInput
            value={form.goal}
            onChangeText={(v) => setForm((f) => ({ ...f, goal: v }))}
            placeholder="E.g., Build a full-stack e-commerce app"
            className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
          />

          <View className="flex-row gap-2.5 bg-purple-50 border-2 border-purple-200 rounded-xl p-3.5 mb-5">
            <Lightbulb size={16} color="#7c3aed" style={{ marginTop: 2 }} />
            <Text className="text-xs text-purple-700 flex-1 leading-relaxed">
              Your plan will include a day-by-day schedule, theory + practice + projects, breaks, curated resources, and progress tracking.
            </Text>
          </View>

          <TouchableOpacity
            onPress={generatePlan}
            disabled={generating || !form.topics.trim()}
            className="bg-purple-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
            style={{ opacity: generating || !form.topics.trim() ? 0.5 : 1 }}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Brain size={18} color="#fff" />
                <Text className="text-white font-bold text-sm">Generate AI Study Plan</Text>
              </>
            )}
          </TouchableOpacity>
          <Text className="text-center text-xs text-muted-foreground mt-3">
            Powered by Groq Llama 3.3 70B · Free
          </Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="bg-purple-700 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center gap-2 bg-white/20 self-start px-2.5 py-1 rounded-full mb-2.5">
              <Sparkles size={11} color="#fff" />
              <Text className="text-white text-[10px] font-semibold">AI Generated</Text>
            </View>
            <Text className="text-white text-xl font-bold mb-1">{plan.title}</Text>
            <Text className="text-purple-100 text-sm mb-4">{plan.description}</Text>

            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity onPress={handleShare} className="flex-1 bg-white/20 rounded-lg py-2 flex-row items-center justify-center gap-1.5">
                <Share2 size={13} color="#fff" />
                <Text className="text-white text-xs font-semibold">Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPlan(null)} className="flex-1 bg-white/20 rounded-lg py-2 items-center">
                <Text className="text-white text-xs font-semibold">New Plan</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-2.5">
              {[
                { icon: Calendar, label: "Days", value: form.days },
                { icon: Clock, label: "Hours", value: `${plan.totalHours}h` },
                { icon: Trophy, label: "Done", value: `${completedDays}/${form.days}` },
                { icon: Target, label: "Progress", value: `${Math.round(progress)}%` },
              ].map((s, i) => (
                <View key={i} className="bg-white/10 rounded-xl p-2.5" style={{ minWidth: "22%" }}>
                  <s.icon size={16} color="#fff" />
                  <Text className="text-white font-bold text-base mt-1">{s.value}</Text>
                  <Text className="text-purple-200 text-[10px]">{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="bg-card rounded-xl border-2 border-border p-4 mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="font-bold text-sm text-foreground">Overall Progress</Text>
              <Text className="text-xs text-muted-foreground">{completedTasks}/{totalTasks} tasks</Text>
            </View>
            <View className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <View className="h-full bg-purple-600 rounded-full" style={{ width: `${progress}%` }} />
            </View>
          </View>

          <Text className="font-bold text-foreground text-lg mb-3">Daily Schedule</Text>
          {plan.schedule.map((day, dayIndex) => {
            const dayCompleted = day.tasks.every((t) => t.completed);
            const dayProgress = (day.tasks.filter((t) => t.completed).length / day.tasks.length) * 100;
            const isExpanded = expandedDays.has(dayIndex);
            return (
              <View key={dayIndex} className="bg-card rounded-xl border-2 overflow-hidden mb-3" style={{ borderColor: dayCompleted ? "#bbf7d0" : "#e5e7eb" }}>
                <TouchableOpacity onPress={() => toggleDay(dayIndex)} className="p-4 bg-purple-50">
                  <View className="flex-row items-center gap-3">
                    {dayCompleted ? (
                      <View className="w-9 h-9 bg-green-600 rounded-full items-center justify-center">
                        <CheckCircle size={18} color="#fff" />
                      </View>
                    ) : (
                      <View className="w-9 h-9 bg-white border-2 border-purple-400 rounded-full items-center justify-center">
                        <Text className="font-bold text-purple-600 text-xs">{day.day}</Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-foreground text-sm" numberOfLines={1}>Day {day.day}: {day.title}</Text>
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>{day.focus}</Text>
                    </View>
                    <ChevronDown size={18} color="#9ca3af" style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }} />
                  </View>
                  <View className="h-1.5 bg-purple-200 rounded-full overflow-hidden mt-3">
                    <View className="h-full bg-purple-600 rounded-full" style={{ width: `${dayProgress}%` }} />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View className="p-4 gap-4">
                    <View className="bg-blue-50 border-2 border-blue-100 rounded-lg p-3.5">
                      <View className="flex-row items-center gap-1.5 mb-2">
                        <Target size={14} color="#2563eb" />
                        <Text className="font-semibold text-sm text-foreground">Learning Objectives</Text>
                      </View>
                      {day.objectives.map((obj, i) => (
                        <Text key={i} className="text-xs text-muted-foreground mb-1">• {obj}</Text>
                      ))}
                    </View>

                    {day.tasks.map((task, taskIndex) => {
                      const color = TASK_COLORS[task.type] || TASK_COLORS.theory;
                      return (
                        <View
                          key={taskIndex}
                          className="rounded-lg p-3.5 border-2"
                          style={{
                            backgroundColor: task.completed ? "#f0fdf4" : "#f9fafb",
                            borderColor: task.completed ? "#bbf7d0" : "#e5e7eb",
                          }}
                        >
                          <View className="flex-row items-center flex-wrap gap-1.5 mb-2">
                            <Clock size={11} color="#9ca3af" />
                            <Text className="text-xs font-medium text-muted-foreground">{task.time}</Text>
                            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: color.bg }}>
                              <Text className="text-[10px] font-medium" style={{ color: color.text }}>{task.type}</Text>
                            </View>
                            <Text className="text-[10px] text-muted-foreground">({task.duration})</Text>
                          </View>
                          <Text
                            className="text-sm font-medium mb-2"
                            style={{
                              color: task.completed ? "#9ca3af" : "#111827",
                              textDecorationLine: task.completed ? "line-through" : "none",
                            }}
                          >
                            {task.task}
                          </Text>
                          {task.resources?.length > 0 && (
                            <View className="flex-row flex-wrap gap-1.5 mb-2">
                              {task.resources.map((r, i) => (
                                <View key={i} className="bg-white border border-border px-2 py-1 rounded">
                                  <Text className="text-[10px] text-muted-foreground">{r}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => toggleTask(dayIndex, taskIndex)}
                            className="self-start px-3 py-1.5 rounded-lg flex-row items-center gap-1"
                            style={{ backgroundColor: task.completed ? "#e5e7eb" : "#16a34a" }}
                          >
                            <Check size={12} color={task.completed ? "#374151" : "#fff"} />
                            <Text className="text-xs font-semibold" style={{ color: task.completed ? "#374151" : "#fff" }}>
                              {task.completed ? "Undo" : "Complete"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                    <View className="bg-purple-50 border-2 border-purple-100 rounded-lg p-3.5">
                      <View className="flex-row items-center gap-1.5 mb-1.5">
                        <Trophy size={14} color="#7c3aed" />
                        <Text className="font-semibold text-sm text-foreground">Day {day.day} Milestone</Text>
                      </View>
                      <Text className="text-xs text-muted-foreground">{day.milestone}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          <View className="bg-card rounded-xl border-2 border-border p-4 mb-4 mt-2">
            <View className="flex-row items-center gap-2 mb-3">
              <Lightbulb size={16} color="#eab308" />
              <Text className="font-bold text-foreground text-sm">Study Tips</Text>
            </View>
            {plan.tips.map((tip, i) => (
              <Text key={i} className="text-sm text-muted-foreground mb-1.5">• {tip}</Text>
            ))}
          </View>

          <View className="bg-card rounded-xl border-2 border-border p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <BookOpen size={16} color="#2563eb" />
              <Text className="font-bold text-foreground text-sm">Recommended Resources</Text>
            </View>
            {Object.entries(plan.resources).map(([category, items]) => (
              <View key={category} className="mb-3">
                <Text className="text-xs font-semibold text-foreground mb-1.5 capitalize">{category}</Text>
                {items.map((item, i) => (
                  <Text key={i} className="text-xs text-muted-foreground mb-1">→ {item}</Text>
                ))}
              </View>
            ))}
          </View>

          {plan.weeklyGoals?.length > 0 && (
            <View className="bg-purple-700 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Target size={16} color="#fff" />
                <Text className="text-white font-bold text-sm">Weekly Goals</Text>
              </View>
              {plan.weeklyGoals.map((goal, i) => (
                <View key={i} className="bg-white/10 rounded-lg p-3 mb-2">
                  <Text className="text-white text-xs">{goal}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}