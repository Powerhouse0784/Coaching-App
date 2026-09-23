import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator, Dimensions, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  BookOpen, PartyPopper, Plus, Clock, Trash2, AlertCircle, Sparkles,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { ScheduleSession, CustomHoliday, NationalHoliday } from "@/types";
import SessionFormModal from "@/components/teacher/SessionFormModal";
import HolidayFormModal from "@/components/teacher/HolidayFormModal";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import ProgressRing from "@/components/ui/ProgressRing";
import { MiniStat } from "@/components/ui/StatPrimitives";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

// Placeholder editorial photography — swap for your own planner/classroom photo before launch.
const HERO_PHOTO = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&q=80&auto=format&fit=crop";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 40 - 2) / 7;

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDateLabel(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [nationalHolidays, setNationalHolidays] = useState<NationalHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSession | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const fetchData = useCallback(async (year: number) => {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get(`/api/teacher/schedule?year=${year}`);
      if (data.success) {
        setSessions(data.sessions || []);
        setCustomHolidays(data.customHolidays || []);
        setNationalHolidays(data.nationalHolidays || []);
      } else {
        setLoadError(data.error || "Failed to load schedule");
      }
    } catch (e) {
      console.error("Error fetching schedule:", e);
      setLoadError("Failed to load schedule. Pull to retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(viewYear);
  }, [viewYear, fetchData]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, { title: string; isCustom: boolean; tentative?: boolean; id?: string }>();
    nationalHolidays.forEach((h) => map.set(h.date, { title: h.title, isCustom: false, tentative: h.tentative }));
    customHolidays.forEach((h) => map.set(h.date.slice(0, 10), { title: h.title, isCustom: true, id: h.id }));
    return map;
  }, [nationalHolidays, customHolidays]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ScheduleSession[]>();
    sessions.forEach((s) => {
      const key = s.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    map.forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [sessions]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { day: number | null; dateKey: string | null }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateKey: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, dateKey: toDateKey(viewYear, viewMonth, d) });
    return cells;
  }, [viewYear, viewMonth]);

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  };

  const selectedSessions = selectedDateKey ? sessionsByDate.get(selectedDateKey) || [] : [];
  const selectedHoliday = selectedDateKey ? holidaysByDate.get(selectedDateKey) : null;
  const selectedIsPast = selectedDateKey ? selectedDateKey < todayKey : false;

  const totalSessions = sessions.length;
  const daysInThisMonth = calendarCells.filter((c) => c.day !== null).length;
  const holidaysThisMonth = calendarCells.filter((c) => c.dateKey && holidaysByDate.has(c.dateKey)).length;
  const scheduledDaysThisMonth = calendarCells.filter((c) => c.dateKey && sessionsByDate.has(c.dateKey)).length;
  const subjectCount = new Set(sessions.map((s) => s.subject)).size;
  const coverageRatio = daysInThisMonth > 0 ? scheduledDaysThisMonth / daysInThisMonth : 0;

  const handleSaveSession = async (payload: any): Promise<boolean> => {
    try {
      const { data } = payload.id
        ? await api.put("/api/teacher/schedule", payload)
        : await api.post("/api/teacher/schedule", { ...payload, type: "session" });
      if (data.success) {
        await fetchData(viewYear);
        setShowSessionModal(false);
        setEditingSession(null);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await api.delete(`/api/teacher/schedule?type=session&id=${id}`);
      fetchData(viewYear);
      setShowSessionModal(false);
      setEditingSession(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveHoliday = async (title: string, date: string): Promise<boolean> => {
    try {
      const { data } = await api.post("/api/teacher/schedule", { type: "holiday", title, date });
      if (data.success) {
        await fetchData(viewYear);
        setShowHolidayModal(false);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await api.delete(`/api/teacher/schedule?type=holiday&id=${id}`);
      fetchData(viewYear);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.md }}>Loading schedule…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Cinematic photo hero */}
        <View style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: "hidden" }}>
          <ImageBackground source={{ uri: HERO_PHOTO }} resizeMode="cover">
            <LinearGradient colors={["rgba(27,44,92,0.6)", "rgba(27,44,92,0.8)", "rgba(16,24,49,0.95)"]} style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26 }}>
              <Animated.View entering={FadeIn.duration(400)} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg }}>
                <AnimatedPressable pressScale={0.9} onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                  <ArrowLeft size={18} color={colors.white} />
                </AnimatedPressable>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.14)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginBottom: 6 }}>
                    <Sparkles size={10} color={colors.gold} />
                    <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>Teaching Schedule</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 28, color: colors.white, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(450).delay(100)}>
                <BlurView intensity={45} tint="dark" style={{ borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg, gap: spacing.lg }}>
                    <ProgressRing progress={coverageRatio} color={colors.mint} label="COVERED" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.bodyMedium, fontSize: 10.5, letterSpacing: 0.4, marginBottom: 8 }}>THIS MONTH</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, columnGap: 16 }}>
                        <MiniStat icon={BookOpen} value={totalSessions} label="sessions" />
                        <MiniStat icon={PartyPopper} value={holidaysThisMonth} label="holidays" />
                        <MiniStat icon={CalendarIcon} value={subjectCount} label="subjects" />
                      </View>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: spacing.lg }}>
          {loadError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
              <AlertCircle size={16} color={colors.coral} />
              <Text style={{ fontSize: 13, color: colors.coral, flex: 1, fontFamily: fonts.body }}>{loadError}</Text>
            </View>
          ) : null}

          {/* Calendar */}
          <Animated.View entering={FadeInUp.duration(300)} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <AnimatedPressable pressScale={0.9} onPress={() => changeMonth(-1)} style={{ padding: 8 }}>
                <ChevronLeft size={20} color={colors.ink} />
              </AnimatedPressable>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
                <AnimatedPressable pressScale={0.95} onPress={goToToday}>
                  <Text style={{ fontSize: 11.5, color: colors.indigo, fontFamily: fonts.bodySemibold }}>Jump to Today</Text>
                </AnimatedPressable>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={() => changeMonth(1)} style={{ padding: 8 }}>
                <ChevronRight size={20} color={colors.ink} />
              </AnimatedPressable>
            </View>

            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border }}>
              {DAY_NAMES.map((d) => (
                <View key={d} style={{ width: CELL_SIZE, alignItems: "center", paddingVertical: 8 }}>
                  <Text style={{ fontSize: 10, fontFamily: fonts.bodySemibold, color: colors.inkMuted }}>{d}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {calendarCells.map((cell, idx) => {
                if (!cell.day) return <View key={idx} style={{ width: CELL_SIZE, height: CELL_SIZE, borderBottomWidth: 1, borderRightWidth: 1, borderColor: colors.border }} />;
                const isToday = cell.dateKey === todayKey;
                const isPast = cell.dateKey! < todayKey;
                const isSelected = cell.dateKey === selectedDateKey;
                const holiday = holidaysByDate.get(cell.dateKey!);
                const daySessions = sessionsByDate.get(cell.dateKey!) || [];

                return (
                  <AnimatedPressable
                    key={idx}
                    pressScale={0.94}
                    onPress={() => !isPast && setSelectedDateKey(cell.dateKey)}
                    disabled={isPast}
                    style={{
                      width: CELL_SIZE, height: CELL_SIZE, opacity: isPast ? 0.35 : 1, padding: 4,
                      borderBottomWidth: 1, borderRightWidth: 1, borderColor: colors.border,
                      backgroundColor: isSelected && !isPast ? colors.indigoTint : holiday && !isPast ? colors.coralTint : "transparent",
                    }}
                  >
                    {isToday ? (
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: colors.white, fontSize: 10, fontFamily: fonts.bodySemibold }}>{cell.day}</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 10, fontFamily: fonts.bodySemibold, color: isPast ? colors.inkFaint : holiday ? colors.coral : colors.ink }}>
                        {cell.day}
                      </Text>
                    )}
                    {holiday && (
                      <Text style={{ fontSize: 6.5, fontFamily: fonts.bodyMedium, color: isPast ? colors.inkFaint : colors.coral, marginTop: 1 }} numberOfLines={2}>
                        🎉 {holiday.title}
                      </Text>
                    )}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, position: "absolute", bottom: 4, left: 4 }}>
                      {daySessions.slice(0, 3).map((s) => (
                        <View key={s.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isPast ? colors.inkFaint : s.color }} />
                      ))}
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Selected day panel */}
          <Animated.View entering={FadeInUp.duration(300).delay(80)} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }}>
            {selectedDateKey ? (
              <>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, marginBottom: 4 }}>{formatDateLabel(selectedDateKey)}</Text>

                {selectedIsPast ? (
                  <Text style={{ fontSize: 13, color: colors.inkMuted, paddingVertical: spacing.lg, textAlign: "center", fontFamily: fonts.body }}>
                    This date has passed. Past sessions can't be modified.
                  </Text>
                ) : (
                  <>
                    {selectedHoliday ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.coralTint, borderWidth: 1, borderColor: "rgba(193,68,58,0.25)", borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, marginBottom: spacing.md }}>
                        <PartyPopper size={14} color={colors.coral} />
                        <Text style={{ fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.coral, flex: 1 }}>{selectedHoliday.title}</Text>
                        {selectedHoliday.tentative ? (
                          <View style={{ backgroundColor: "rgba(193,68,58,0.2)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill }}>
                            <Text style={{ fontSize: 9, color: colors.coral, fontFamily: fonts.bodySemibold }}>Tentative</Text>
                          </View>
                        ) : null}
                        {selectedHoliday.isCustom && selectedHoliday.id ? (
                          <AnimatedPressable pressScale={0.9} onPress={() => handleDeleteHoliday(selectedHoliday.id!)}>
                            <Trash2 size={14} color={colors.coral} />
                          </AnimatedPressable>
                        ) : null}
                      </View>
                    ) : (
                      <AnimatedPressable
                        pressScale={0.97}
                        onPress={() => setShowHolidayModal(true)}
                        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, marginTop: spacing.sm, marginBottom: spacing.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(193,68,58,0.35)", borderRadius: radius.md }}
                      >
                        <PartyPopper size={14} color={colors.coral} />
                        <Text style={{ color: colors.coral, fontSize: 12.5, fontFamily: fonts.bodySemibold }}>Mark as Holiday</Text>
                      </AnimatedPressable>
                    )}

                    <View style={{ gap: 8, marginTop: spacing.sm }}>
                      {selectedSessions.length === 0 ? (
                        <Text style={{ fontSize: 13, color: colors.inkMuted, paddingVertical: spacing.lg, textAlign: "center", fontFamily: fonts.body }}>No sessions scheduled for this day.</Text>
                      ) : (
                        selectedSessions.map((s, i) => (
                          <Animated.View key={s.id} entering={FadeInDown.duration(250).delay(i * 40)}>
                            <AnimatedPressable
                              pressScale={0.97}
                              onPress={() => { setEditingSession(s); setShowSessionModal(true); }}
                              style={{ borderRadius: radius.md, padding: spacing.md, borderWidth: 1.5, borderColor: `${s.color}55`, backgroundColor: `${s.color}12` }}
                            >
                              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 4 }}>{s.title}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Clock size={11} color={colors.inkFaint} />
                                <Text style={{ fontSize: 11.5, color: colors.inkMuted, fontFamily: fonts.body }}>{s.startTime} - {s.endTime}</Text>
                              </View>
                              <View style={{ flexDirection: "row", gap: 6, marginTop: 7 }}>
                                <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border }}>
                                  <Text style={{ fontSize: 10, color: colors.inkMuted, fontFamily: fonts.body }}>{s.subject}</Text>
                                </View>
                                <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border }}>
                                  <Text style={{ fontSize: 10, color: colors.inkMuted, fontFamily: fonts.body }}>{s.class}</Text>
                                </View>
                              </View>
                            </AnimatedPressable>
                          </Animated.View>
                        ))
                      )}
                    </View>

                    <AnimatedPressable
                      pressScale={0.97}
                      onPress={() => { setEditingSession(null); setShowSessionModal(true); }}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, marginTop: spacing.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md }}
                    >
                      <Plus size={14} color={colors.inkMuted} />
                      <Text style={{ color: colors.inkMuted, fontSize: 12.5, fontFamily: fonts.bodySemibold }}>Add Session for This Day</Text>
                    </AnimatedPressable>
                  </>
                )}
              </>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
                  <CalendarIcon size={26} color={colors.indigo} />
                </View>
                <Text style={{ fontSize: 13, color: colors.inkMuted, textAlign: "center", fontFamily: fonts.body }}>Tap a date on the calendar to see or add sessions.</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      {selectedDateKey ? (
        <SessionFormModal
          visible={showSessionModal}
          session={editingSession}
          dateKey={selectedDateKey}
          onClose={() => { setShowSessionModal(false); setEditingSession(null); }}
          onSave={handleSaveSession}
          onDelete={editingSession ? () => handleDeleteSession(editingSession.id) : undefined}
        />
      ) : null}
      {selectedDateKey ? (
        <HolidayFormModal
          visible={showHolidayModal}
          dateKey={selectedDateKey}
          onClose={() => setShowHolidayModal(false)}
          onSave={handleSaveHoliday}
        />
      ) : null}
    </SafeAreaView>
  );
}
