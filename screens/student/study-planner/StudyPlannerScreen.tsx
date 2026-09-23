import { useState } from "react";
import { View, Text, TextInput, ScrollView, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  ArrowLeft, Brain, Calendar, Clock, Target, Trophy, Sparkles,
  ChevronDown, CheckCircle, Check, BookOpen, Lightbulb, Share2, AlertCircle,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { StudyPlanData, StudyFormData } from "@/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

const LEVELS: { value: StudyFormData["level"]; label: string; emoji: string }[] = [
  { value: "beginner", label: "Beginner", emoji: "🌱" },
  { value: "intermediate", label: "Intermediate", emoji: "⚡" },
  { value: "advanced", label: "Advanced", emoji: "🚀" },
];

const DAY_OPTIONS = [3, 7, 14, 21, 30, 60, 90];
const HOUR_OPTIONS = [1, 2, 3, 4, 6, 8];

// Each task type gets a meaningful accent from the theme instead of arbitrary hex pairs.
const TASK_ACCENTS: Record<string, string> = {
  theory: colors.indigo,
  practice: colors.mint,
  project: colors.gold,
  review: colors.coral,
  break: colors.inkMuted,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <AnimatedPressable pressScale={0.9} onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={18} color={colors.ink} />
        </AnimatedPressable>
        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>AI Study Planner</Text>
      </View>

      {!plan ? (
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.goldTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginBottom: 12 }}>
              <Sparkles size={13} color={colors.gold} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: "#8A6816" }}>Powered by Advanced AI</Text>
            </View>
            <Text style={{ ...type.h1, color: colors.ink, textAlign: "center" }}>AI Study Planner</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 6 }}>
              Get a personalized, adaptive study schedule
            </Text>
          </Animated.View>

          {error ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
              <AlertCircle size={16} color={colors.coral} />
              <Text style={{ color: colors.coral, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 8 }}>What do you want to learn?</Text>
          <View style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, marginBottom: spacing.lg }}>
            <TextInput
              value={form.topics}
              onChangeText={(v) => setForm((f) => ({ ...f, topics: v }))}
              placeholder="E.g., React Hooks, TypeScript, State Management"
              placeholderTextColor={colors.inkFaint}
              multiline
              numberOfLines={3}
              style={{ padding: spacing.md, fontFamily: fonts.body, fontSize: 14, color: colors.ink, minHeight: 80, textAlignVertical: "top" }}
            />
          </View>

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 10 }}>Study Duration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: spacing.lg }}>
            {DAY_OPTIONS.map((d) => {
              const active = form.days === d;
              return (
                <AnimatedPressable key={d} pressScale={0.94} onPress={() => setForm((f) => ({ ...f, days: d }))} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, backgroundColor: active ? colors.indigo : colors.surface, borderWidth: active ? 0 : 1.5, borderColor: colors.border }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: active ? colors.white : colors.ink }}>{d} Days</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 10 }}>Daily Study Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: spacing.lg }}>
            {HOUR_OPTIONS.map((h) => {
              const active = form.hoursPerDay === h;
              return (
                <AnimatedPressable key={h} pressScale={0.94} onPress={() => setForm((f) => ({ ...f, hoursPerDay: h }))} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, backgroundColor: active ? colors.indigo : colors.surface, borderWidth: active ? 0 : 1.5, borderColor: colors.border }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: active ? colors.white : colors.ink }}>{h}h/day</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 10 }}>Your Current Level</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: spacing.lg }}>
            {LEVELS.map((lvl) => {
              const active = form.level === lvl.value;
              return (
                <AnimatedPressable
                  key={lvl.value}
                  pressScale={0.96}
                  onPress={() => setForm((f) => ({ ...f, level: lvl.value }))}
                  style={{ flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: radius.md, backgroundColor: active ? colors.indigo : colors.surfaceMuted }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{lvl.emoji}</Text>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: active ? colors.white : colors.ink }}>{lvl.label}</Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Input
            label="Your Learning Goal (Optional)"
            value={form.goal}
            onChangeText={(v) => setForm((f) => ({ ...f, goal: v }))}
            placeholder="E.g., Build a full-stack e-commerce app"
            style={{ marginBottom: 0 }}
          />
          <View style={{ height: spacing.lg }} />

          <View style={{ flexDirection: "row", gap: 10, backgroundColor: colors.goldTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: `${colors.gold}40` }}>
            <Lightbulb size={16} color={colors.gold} style={{ marginTop: 2 }} />
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: "#8A6816", flex: 1, lineHeight: 18 }}>
              Your plan will include a day-by-day schedule, theory + practice + projects, breaks, curated resources, and progress tracking.
            </Text>
          </View>

          <Button
            label="Generate AI Study Plan"
            icon={Brain}
            onPress={generatePlan}
            loading={generating}
            disabled={!form.topics.trim()}
            fullWidth
            size="lg"
          />
          <Text style={{ textAlign: "center", fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, marginTop: spacing.md }}>
            Powered by Groq Llama 3.3 70B · Free
          </Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(350)}>
            <LinearGradient colors={[colors.indigoDark, colors.indigo]} style={{ borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, marginBottom: 10 }}>
                <Sparkles size={11} color={colors.white} />
                <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>AI Generated</Text>
              </View>
              <Text style={{ ...type.h2, color: colors.white, marginBottom: 4 }}>{plan.title}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: spacing.lg }}>{plan.description}</Text>

              <View style={{ flexDirection: "row", gap: 8, marginBottom: spacing.lg }}>
                <AnimatedPressable pressScale={0.95} onPress={handleShare} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.sm, paddingVertical: 10 }}>
                  <Share2 size={13} color={colors.white} />
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>Share</Text>
                </AnimatedPressable>
                <AnimatedPressable pressScale={0.95} onPress={() => setPlan(null)} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: radius.sm, paddingVertical: 10 }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>New Plan</Text>
                </AnimatedPressable>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  { icon: Calendar, label: "Days", value: form.days },
                  { icon: Clock, label: "Hours", value: `${plan.totalHours}h` },
                  { icon: Trophy, label: "Done", value: `${completedDays}/${form.days}` },
                  { icon: Target, label: "Progress", value: `${Math.round(progress)}%` },
                ].map((s, i) => (
                  <View key={i} style={{ minWidth: "22%", flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.sm, padding: 10 }}>
                    <s.icon size={15} color={colors.white} />
                    <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 15, marginTop: 4 }}>{s.value}</Text>
                    <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.body, fontSize: 9.5 }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          <Card padding="md" style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink }}>Overall Progress</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }}>{completedTasks}/{totalTasks} tasks</Text>
            </View>
            <View style={{ height: 10, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${progress}%`, backgroundColor: colors.indigo, borderRadius: radius.pill }} />
            </View>
          </Card>

          <Text style={{ ...type.h3, color: colors.ink, marginBottom: spacing.md }}>Daily Schedule</Text>
          {plan.schedule.map((day, dayIndex) => {
            const dayCompleted = day.tasks.every((t) => t.completed);
            const dayProgress = (day.tasks.filter((t) => t.completed).length / day.tasks.length) * 100;
            const isExpanded = expandedDays.has(dayIndex);
            return (
              <Animated.View key={dayIndex} entering={FadeInDown.duration(300).delay(Math.min(dayIndex, 6) * 40)}>
                <Card padding={0} style={{ marginBottom: spacing.md, overflow: "hidden" }}>
                  <AnimatedPressable pressScale={0.99} onPress={() => toggleDay(dayIndex)} style={{ padding: spacing.lg, backgroundColor: dayCompleted ? colors.mintTint : colors.indigoTint }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      {dayCompleted ? (
                        <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle size={18} color={colors.white} />
                        </View>
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.indigo, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.indigo }}>{day.day}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }} numberOfLines={1}>Day {day.day}: {day.title}</Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }} numberOfLines={1}>{day.focus}</Text>
                      </View>
                      <ChevronDown size={18} color={colors.inkFaint} style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }} />
                    </View>
                    <View style={{ height: 6, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: radius.pill, overflow: "hidden", marginTop: spacing.md }}>
                      <View style={{ height: "100%", width: `${dayProgress}%`, backgroundColor: dayCompleted ? colors.mint : colors.indigo, borderRadius: radius.pill }} />
                    </View>
                  </AnimatedPressable>

                  {isExpanded && (
                    <View style={{ padding: spacing.lg, gap: spacing.md }}>
                      <View style={{ backgroundColor: colors.indigoTint, borderRadius: radius.md, padding: spacing.md }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <Target size={14} color={colors.indigo} />
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink }}>Learning Objectives</Text>
                        </View>
                        {day.objectives.map((obj, i) => (
                          <Text key={i} style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginBottom: 3 }}>• {obj}</Text>
                        ))}
                      </View>

                      {day.tasks.map((task, taskIndex) => {
                        const accent = TASK_ACCENTS[task.type] || TASK_ACCENTS.theory;
                        return (
                          <View
                            key={taskIndex}
                            style={{
                              borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
                              backgroundColor: task.completed ? colors.mintTint : colors.surfaceMuted,
                              borderColor: task.completed ? `${colors.mint}40` : colors.border,
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                              <Clock size={11} color={colors.inkFaint} />
                              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkMuted }}>{task.time}</Text>
                              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: `${accent}1F` }}>
                                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 10, color: accent }}>{task.type}</Text>
                              </View>
                              <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkFaint }}>({task.duration})</Text>
                            </View>
                            <Text
                              style={{
                                fontFamily: fonts.bodyMedium, fontSize: 13, marginBottom: 8,
                                color: task.completed ? colors.inkFaint : colors.ink,
                                textDecorationLine: task.completed ? "line-through" : "none",
                              }}
                            >
                              {task.task}
                            </Text>
                            {task.resources?.length > 0 && (
                              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                                {task.resources.map((r, i) => (
                                  <View key={i} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                                    <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted }}>{r}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            <AnimatedPressable
                              pressScale={0.94}
                              onPress={() => toggleTask(dayIndex, taskIndex)}
                              style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: task.completed ? colors.surfaceMuted : colors.mint }}
                            >
                              <Check size={12} color={task.completed ? colors.inkMuted : colors.white} />
                              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: task.completed ? colors.inkMuted : colors.white }}>
                                {task.completed ? "Undo" : "Complete"}
                              </Text>
                            </AnimatedPressable>
                          </View>
                        );
                      })}

                      <View style={{ backgroundColor: colors.goldTint, borderRadius: radius.md, padding: spacing.md }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <Trophy size={14} color={colors.gold} />
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink }}>Day {day.day} Milestone</Text>
                        </View>
                        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>{day.milestone}</Text>
                      </View>
                    </View>
                  )}
                </Card>
              </Animated.View>
            );
          })}

          <Card padding="md" style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
              <Lightbulb size={16} color={colors.gold} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }}>Study Tips</Text>
            </View>
            {plan.tips.map((tip, i) => (
              <Text key={i} style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginBottom: 6, lineHeight: 19 }}>• {tip}</Text>
            ))}
          </Card>

          <Card padding="md" style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
              <BookOpen size={16} color={colors.indigo} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink }}>Recommended Resources</Text>
            </View>
            {Object.entries(plan.resources).map(([category, items]) => (
              <View key={category} style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, marginBottom: 4, textTransform: "capitalize" }}>{category}</Text>
                {items.map((item, i) => (
                  <Text key={i} style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginBottom: 3 }}>→ {item}</Text>
                ))}
              </View>
            ))}
          </Card>

          {plan.weeklyGoals?.length > 0 && (
            <LinearGradient colors={[colors.indigoDark, colors.indigo]} style={{ borderRadius: radius.lg, padding: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                <Target size={16} color={colors.white} />
                <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13.5 }}>Weekly Goals</Text>
              </View>
              {plan.weeklyGoals.map((goal, i) => (
                <View key={i} style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.body, fontSize: 12 }}>{goal}</Text>
                </View>
              ))}
            </LinearGradient>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
