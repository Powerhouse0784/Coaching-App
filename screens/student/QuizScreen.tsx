import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator, Alert, BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Brain, BookOpen, Code, Search, X, Clock, Flag, ChevronDown,
  CheckCircle, XCircle, AlertCircle, Trophy, TrendingUp, ArrowLeft,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { QuizData, QuizScore, QuizCategoryItem } from "@/types";

type QuizState = "categories" | "loading" | "taking" | "result";

export default function QuizScreen() {
  const navigation = useNavigation();
  const [quizState, setQuizState] = useState<QuizState>("categories");

  // Categories
  const [categories, setCategories] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");

  // Active quiz
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const startTimeRef = useRef(0);

  // Result
  const [score, setScore] = useState<QuizScore | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/api/quiz/generate");
      if (data.success) setCategories(data.data);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  };

  // Timer
  useEffect(() => {
    if (quizState !== "taking" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  // Prevent accidental exit mid-quiz via hardware back button (Android)
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (quizState === "taking") {
        Alert.alert("Leave quiz?", "Your progress will be lost.", [
          { text: "Stay", style: "cancel" },
          { text: "Leave", style: "destructive", onPress: () => navigation.goBack() },
        ]);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [quizState, navigation]);

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const generateQuiz = async (categoryId: string) => {
    setQuizState("loading");
    try {
      const { data } = await api.post("/api/quiz/generate", { category: categoryId, questionCount: 20 });
      if (!data.success) throw new Error(data.error || "Failed to generate quiz");
      setQuiz(data.data);
      setSelectedAnswers(new Array(data.data.questions.length).fill(null));
      setTimeLeft(data.data.duration * 60);
      startTimeRef.current = Date.now();
      setCurrentQuestion(0);
      setFlaggedQuestions(new Set());
      setShowExplanations(false);
      setQuizState("taking");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || err.message || "Failed to generate quiz. Please try again.");
      setQuizState("categories");
    }
  };

  const selectAnswer = (idx: number) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = idx;
      return next;
    });
  };

  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion)) next.delete(currentQuestion);
      else next.add(currentQuestion);
      return next;
    });
  };

  const handleSubmit = useCallback(() => {
    setQuiz((currentQuiz) => {
      if (!currentQuiz) return currentQuiz;
      setSelectedAnswers((currentAnswers) => {
        let total = 0, correct = 0, incorrect = 0, unattempted = 0;
        currentAnswers.forEach((ans, i) => {
          if (ans === null) unattempted++;
          else if (ans === currentQuiz.questions[i].correctAnswer) { total += 4; correct++; }
          else { total -= 1; incorrect++; }
        });
        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const percentage = Math.round((total / currentQuiz.totalMarks) * 100);
        setScore({ total, correct, incorrect, unattempted, percentage, passed: total >= currentQuiz.passingMarks, timeTaken });
        setQuizState("result");
        return currentAnswers;
      });
      return currentQuiz;
    });
  }, []);

  const resetQuiz = () => {
    setQuizState("categories");
    setScore(null);
    setQuiz(null);
    setSelectedAnswers([]);
    setFlaggedQuestions(new Set());
    setShowExplanations(false);
    setCurrentQuestion(0);
  };

  const getFilteredCategories = (): QuizCategoryItem[] => {
    if (!categories) return [];
    let all: QuizCategoryItem[] = categories.all || [];
    if (filterGroup !== "all" && categories.grouped?.[filterGroup]) {
      all = categories.grouped[filterGroup].categories;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      all = all.filter((c) => c.title.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q));
    }
    return all;
  };

  // ── Loading ──
  if (quizState === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-lg font-bold text-foreground mt-4">Generating Your Quiz…</Text>
        <Text className="text-sm text-muted-foreground mt-1 text-center">AI is creating 20 unique questions for you</Text>
      </SafeAreaView>
    );
  }

  // ── Categories ──
  if (quizState === "categories") {
    const groups: string[] = categories?.grouped ? Object.keys(categories.grouped) : [];
    const filtered = getFilteredCategories();

    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-5 pt-2 pb-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
            <ArrowLeft size={18} color="#374151" />
          </TouchableOpacity>
          <Text className="font-bold text-foreground text-base">Take a Quiz</Text>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListHeaderComponent={
            <View className="mb-4">
              <View className="flex-row items-center gap-2 bg-blue-100 self-start px-3 py-1.5 rounded-full mb-3">
                <Brain size={14} color="#2563eb" />
                <Text className="text-blue-700 text-xs font-semibold">AI-Powered Quiz System</Text>
              </View>
              <Text className="text-xs text-muted-foreground mb-4">
                Choose from 50+ categories • 20 questions • 60 minutes • +4/-1 marking
              </Text>

              <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-3 bg-card">
                <Search size={16} color="#9ca3af" />
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Search categories…"
                  className="flex-1 py-2.5 px-2 text-foreground text-sm"
                />
                {searchTerm ? (
                  <TouchableOpacity onPress={() => setSearchTerm("")}>
                    <X size={14} color="#9ca3af" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={["all", ...groups]}
                keyExtractor={(g) => g}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item: g }) => (
                  <TouchableOpacity
                    onPress={() => setFilterGroup(g)}
                    className={`px-3.5 py-2 rounded-full ${filterGroup === g ? "bg-blue-600" : "bg-card border border-border"}`}
                  >
                    <Text className={`text-xs font-semibold ${filterGroup === g ? "text-white" : "text-foreground"}`}>
                      {g === "all" ? "All Categories" : categories.grouped[g].title}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          }
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              onPress={() => generateQuiz(cat.id)}
              activeOpacity={0.85}
              className="flex-1 bg-card rounded-2xl border border-border p-4"
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${cat.class ? "bg-blue-600" : "bg-emerald-600"}`}>
                {cat.class ? <BookOpen size={18} color="#fff" /> : <Code size={18} color="#fff" />}
              </View>
              <Text className="font-bold text-foreground text-sm mb-2" numberOfLines={2}>{cat.title}</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {cat.class ? (
                  <View className="px-2 py-0.5 rounded-full bg-blue-100">
                    <Text className="text-[10px] font-medium text-blue-700">Class {cat.class}</Text>
                  </View>
                ) : null}
                {cat.difficulty ? (
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        cat.difficulty === "beginner" ? "#dcfce7" : cat.difficulty === "intermediate" ? "#fef9c3" : "#fee2e2",
                    }}
                  >
                    <Text
                      className="text-[10px] font-medium"
                      style={{
                        color: cat.difficulty === "beginner" ? "#15803d" : cat.difficulty === "intermediate" ? "#a16207" : "#b91c1c",
                      }}
                    >
                      {cat.difficulty}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            categories ? (
              <View className="items-center py-16">
                <AlertCircle size={40} color="#9ca3af" />
                <Text className="text-muted-foreground text-sm mt-3">No categories found matching your search.</Text>
              </View>
            ) : (
              <ActivityIndicator className="mt-10" color="#3b82f6" />
            )
          }
        />
      </SafeAreaView>
    );
  }

  // ── Taking ──
  if (quizState === "taking" && quiz) {
    const question = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
    const answeredCount = selectedAnswers.filter((a) => a !== null).length;
    const difficultyColor =
      question.difficulty === "easy" ? "#16a34a" : question.difficulty === "medium" ? "#ca8a04" : "#dc2626";
    const difficultyBg =
      question.difficulty === "easy" ? "#dcfce7" : question.difficulty === "medium" ? "#fef9c3" : "#fee2e2";

    return (
      <SafeAreaView className="flex-1 bg-background">
        {/* Sticky header */}
        <View className="px-5 pt-3 pb-3 border-b border-border">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 pr-3">
              <Text className="font-semibold text-sm text-foreground" numberOfLines={1}>{quiz.title}</Text>
              <Text className="text-[10px] text-muted-foreground">{answeredCount}/{quiz.questions.length} answered</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${timeLeft < 300 ? "bg-red-100" : "bg-blue-100"}`}>
                <Clock size={14} color={timeLeft < 300 ? "#dc2626" : "#2563eb"} />
                <Text className={`font-bold text-xs ${timeLeft < 300 ? "text-red-700" : "text-blue-700"}`}>{formatTime(timeLeft)}</Text>
              </View>
              <TouchableOpacity onPress={handleSubmit} className="bg-green-600 px-3 py-1.5 rounded-lg">
                <Text className="text-white font-semibold text-xs">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <View className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Question card */}
          <View className="bg-card rounded-2xl border border-border p-4 mb-4">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-row items-start gap-2.5 flex-1">
                <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center">
                  <Text className="font-bold text-blue-600 text-sm">{currentQuestion + 1}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-1.5 mb-2">
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: difficultyBg }}>
                      <Text className="text-[10px] font-medium" style={{ color: difficultyColor }}>{question.difficulty}</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full bg-secondary">
                      <Text className="text-[10px] font-medium text-muted-foreground">{question.topic}</Text>
                    </View>
                    <Text className="text-[10px] text-muted-foreground">• 4 marks</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground leading-snug">{question.question}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={toggleFlag}
                className={`p-2 rounded-lg ${flaggedQuestions.has(currentQuestion) ? "bg-orange-100" : "bg-secondary"}`}
              >
                <Flag size={16} color={flaggedQuestions.has(currentQuestion) ? "#ea580c" : "#9ca3af"} fill={flaggedQuestions.has(currentQuestion) ? "#ea580c" : "none"} />
              </TouchableOpacity>
            </View>

            <View className="gap-2.5">
              {question.options.map((opt, i) => {
                const selected = selectedAnswers[currentQuestion] === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => selectAnswer(i)}
                    className={`p-3.5 rounded-xl border-2 ${selected ? "border-blue-500 bg-blue-50" : "border-border"}`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selected ? "border-blue-500 bg-blue-500" : "border-border"}`}>
                        {selected && <View className="w-2 h-2 bg-white rounded-full" />}
                      </View>
                      <Text className={`flex-1 text-sm font-medium ${selected ? "text-blue-700" : "text-foreground"}`}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Nav */}
          <View className="bg-card rounded-2xl border border-border p-4">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 border-2 border-border rounded-xl"
                style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
              >
                <Text className="text-xs font-semibold text-foreground">Previous</Text>
              </TouchableOpacity>
              <Text className="text-xs text-muted-foreground">{currentQuestion + 1} of {quiz.questions.length}</Text>
              <TouchableOpacity
                onPress={() => setCurrentQuestion((q) => Math.min(quiz.questions.length - 1, q + 1))}
                disabled={currentQuestion === quiz.questions.length - 1}
                className="px-4 py-2 bg-blue-600 rounded-xl"
                style={{ opacity: currentQuestion === quiz.questions.length - 1 ? 0.5 : 1 }}
              >
                <Text className="text-xs font-semibold text-white">Next</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-1.5 mb-3">
              <Text className="text-xs text-muted-foreground">Quick Navigation:</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {quiz.questions.map((_, i) => {
                const isFlagged = flaggedQuestions.has(i);
                const isAnswered = selectedAnswers[i] !== null;
                const isCurrent = currentQuestion === i;
                let bg = "#f3f4f6", color = "#4b5563";
                if (isFlagged) { bg = "#ffedd5"; color = "#c2410c"; }
                else if (isAnswered) { bg = "#dcfce7"; color = "#15803d"; }
                if (isCurrent) { bg = "#3b82f6"; color = "#fff"; }
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCurrentQuestion(i)}
                    style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{i + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Result ──
  if (quizState === "result" && score && quiz) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="items-center mb-6">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${score.passed ? "bg-green-100" : "bg-red-100"}`}>
              {score.passed ? <Trophy size={36} color="#16a34a" /> : <XCircle size={36} color="#dc2626" />}
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">
              {score.passed ? "Congratulations! 🎉" : "Keep Practicing! 💪"}
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              {score.passed
                ? "You've successfully passed the quiz!"
                : `You need ${quiz.passingMarks} marks to pass. You got ${score.total} marks.`}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              {quiz.title} • Completed in {formatTime(score.timeTaken)}
            </Text>
          </View>

          <View className="bg-blue-600 rounded-2xl p-6 items-center mb-5">
            <Text className="text-blue-100 text-sm mb-1">Your Score</Text>
            <Text className="text-white text-5xl font-bold mb-1">{score.percentage}%</Text>
            <Text className="text-blue-100 text-base">{score.total} / {quiz.totalMarks} marks</Text>
          </View>

          <View className="flex-row gap-2.5 mb-5">
            {[
              { icon: CheckCircle, label: "Correct", value: score.correct, sub: `+${score.correct * 4}`, bg: "#f0fdf4", color: "#16a34a" },
              { icon: XCircle, label: "Incorrect", value: score.incorrect, sub: `-${score.incorrect}`, bg: "#fef2f2", color: "#dc2626" },
              { icon: AlertCircle, label: "Skipped", value: score.unattempted, sub: "0", bg: "#f9fafb", color: "#6b7280" },
            ].map(({ icon: Icon, label, value, sub, bg, color }) => (
              <View key={label} className="flex-1 rounded-xl p-3 items-center" style={{ backgroundColor: bg }}>
                <Icon size={20} color={color} />
                <Text className="text-xs text-muted-foreground mt-1">{label}</Text>
                <Text className="text-xl font-bold" style={{ color }}>{value}</Text>
                <Text className="text-[10px] text-muted-foreground">{sub}</Text>
              </View>
            ))}
          </View>

          <View className="bg-blue-50 rounded-xl p-4 mb-5">
            <View className="flex-row items-center gap-2 mb-3">
              <TrendingUp size={16} color="#2563eb" />
              <Text className="font-bold text-foreground text-sm">Performance Analysis</Text>
            </View>
            {[
              { label: "Accuracy", pct: Math.round((score.correct / (score.correct + score.incorrect || 1)) * 100), color: "#22c55e" },
              { label: "Attempt Rate", pct: Math.round(((score.correct + score.incorrect) / quiz.questions.length) * 100), color: "#3b82f6" },
            ].map(({ label, pct, color }) => (
              <View key={label} className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-muted-foreground">{label}</Text>
                  <Text className="text-xs font-semibold text-foreground">{pct}%</Text>
                </View>
                <View className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setShowExplanations(!showExplanations)}
            className="bg-purple-600 rounded-xl py-3 items-center flex-row justify-center gap-2 mb-5"
          >
            <Text className="text-white font-semibold text-sm">{showExplanations ? "Hide" : "Show"} Detailed Solutions</Text>
            <ChevronDown size={16} color="#fff" style={{ transform: [{ rotate: showExplanations ? "180deg" : "0deg" }] }} />
          </TouchableOpacity>

          {showExplanations && (
            <View className="gap-3 mb-5">
              <Text className="font-bold text-foreground text-base">Question-wise Review</Text>
              {quiz.questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctAnswer;
                const isUnattempted = userAns === null;
                const borderColor = isUnattempted ? "#e5e7eb" : isCorrect ? "#bbf7d0" : "#fecaca";
                const bgColor = isUnattempted ? "#f9fafb" : isCorrect ? "#f0fdf4" : "#fef2f2";
                return (
                  <View key={idx} className="rounded-xl p-3.5 border-2" style={{ borderColor, backgroundColor: bgColor }}>
                    <View className="flex-row items-start gap-2.5 mb-2">
                      <View className="w-7 h-7 bg-white rounded-lg items-center justify-center">
                        <Text className="font-bold text-xs text-foreground">{idx + 1}</Text>
                      </View>
                      <Text className="flex-1 font-semibold text-sm text-foreground">{q.question}</Text>
                      <View className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: isUnattempted ? "#e5e7eb" : isCorrect ? "#bbf7d0" : "#fecaca" }}>
                        <Text className="text-xs font-semibold">{isUnattempted ? "0" : isCorrect ? "+4" : "-1"}</Text>
                      </View>
                    </View>
                    {q.options.map((opt, oi) => (
                      <View key={oi} className="flex-row items-start gap-1.5 mb-0.5 ml-9">
                        {oi === q.correctAnswer ? (
                          <CheckCircle size={13} color="#16a34a" style={{ marginTop: 2 }} />
                        ) : oi === userAns && !isCorrect ? (
                          <XCircle size={13} color="#dc2626" style={{ marginTop: 2 }} />
                        ) : (
                          <View style={{ width: 13 }} />
                        )}
                        <Text
                          className="text-xs flex-1"
                          style={{
                            color: oi === q.correctAnswer ? "#15803d" : oi === userAns && !isCorrect ? "#b91c1c" : "#6b7280",
                            fontWeight: oi === q.correctAnswer ? "700" : "400",
                          }}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </Text>
                      </View>
                    ))}
                    <View className="bg-white rounded-lg p-2.5 mt-2 ml-9 border border-border">
                      <Text className="text-[10px] font-semibold text-muted-foreground mb-0.5">Explanation:</Text>
                      <Text className="text-xs text-muted-foreground">{q.explanation}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity onPress={resetQuiz} className="bg-blue-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2">
            <Trophy size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">Take Another Quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}