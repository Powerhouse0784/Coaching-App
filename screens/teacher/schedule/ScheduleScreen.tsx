import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  BookOpen, PartyPopper, Plus, Clock, Trash2, AlertCircle,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { ScheduleSession, CustomHoliday, NationalHoliday } from "@/types";
import SessionFormModal from "@/components/teacher/SessionFormModal";
import HolidayFormModal from "@/components/teacher/HolidayFormModal";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 40) / 7;

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
  const holidaysThisMonth = calendarCells.filter((c) => c.dateKey && holidaysByDate.has(c.dateKey)).length;

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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#0d9488" />
        <Text className="text-muted-foreground mt-3">Loading schedule…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
            <ArrowLeft size={18} color="#374151" />
          </TouchableOpacity>
          <View className="w-9 h-9 bg-teal-600 rounded-xl items-center justify-center">
            <CalendarIcon size={16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-foreground text-base">Teaching Schedule</Text>
            <Text className="text-xs text-muted-foreground">Tap a date to add sessions or holidays</Text>
          </View>
        </View>

        {loadError ? (
          <View className="flex-row items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
            <AlertCircle size={16} color="#dc2626" />
            <Text className="text-sm text-red-700 flex-1">{loadError}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-2.5 mb-4">
          <View className="flex-1 bg-card rounded-2xl p-3 border border-border">
            <View className="w-8 h-8 bg-blue-100 rounded-xl items-center justify-center mb-2">
              <BookOpen size={14} color="#2563eb" />
            </View>
            <Text className="text-base font-bold text-foreground">{totalSessions}</Text>
            <Text className="text-[10px] text-muted-foreground">Total Sessions</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 border border-border">
            <View className="w-8 h-8 bg-red-100 rounded-xl items-center justify-center mb-2">
              <PartyPopper size={14} color="#dc2626" />
            </View>
            <Text className="text-base font-bold text-foreground">{holidaysThisMonth}</Text>
            <Text className="text-[10px] text-muted-foreground">Holidays This Month</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl p-3 border border-border">
            <View className="w-8 h-8 bg-green-100 rounded-xl items-center justify-center mb-2">
              <CalendarIcon size={14} color="#16a34a" />
            </View>
            <Text className="text-base font-bold text-foreground">{new Set(sessions.map((s) => s.subject)).size}</Text>
            <Text className="text-[10px] text-muted-foreground">Subjects</Text>
          </View>
        </View>

        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="font-bold text-foreground text-base">{MONTH_NAMES[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={goToToday}>
                <Text className="text-xs text-teal-600 font-semibold">Jump to Today</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
              <ChevronRight size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View className="flex-row border-b border-border">
            {DAY_NAMES.map((d) => (
              <View key={d} style={{ width: CELL_SIZE }} className="items-center py-2">
                <Text className="text-[10px] font-semibold text-muted-foreground">{d}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarCells.map((cell, idx) => {
              if (!cell.day) return <View key={idx} style={{ width: CELL_SIZE, height: CELL_SIZE }} className="border-b border-r border-border" />;
              const isToday = cell.dateKey === todayKey;
              const isPast = cell.dateKey! < todayKey;
              const isSelected = cell.dateKey === selectedDateKey;
              const holiday = holidaysByDate.get(cell.dateKey!);
              const daySessions = sessionsByDate.get(cell.dateKey!) || [];

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => !isPast && setSelectedDateKey(cell.dateKey)}
                  disabled={isPast}
                  style={{ width: CELL_SIZE, height: CELL_SIZE, opacity: isPast ? 0.35 : 1 }}
                  className={`border-b border-r border-border p-1 ${isSelected && !isPast ? "bg-teal-50" : ""} ${holiday && !isPast ? "bg-red-50" : ""}`}
                >
                  {isToday ? (
                    <View className="w-5 h-5 bg-teal-600 rounded-full items-center justify-center">
                      <Text className="text-white text-[10px] font-bold">{cell.day}</Text>
                    </View>
                  ) : (
                    <Text
                      className={`text-[10px] font-semibold ${
                        isPast ? "text-gray-400" : holiday ? "text-red-600" : "text-foreground"
                      }`}
                      style={holiday && !isPast ? { fontWeight: "800" } : undefined}
                    >
                      {cell.day}
                    </Text>
                  )}
                  {holiday && (
                    <Text
                      className={`text-[7px] font-medium mt-0.5 ${isPast ? "text-gray-400" : "text-red-600"}`}
                      numberOfLines={2}
                    >
                      🎉 {holiday.title}
                    </Text>
                  )}
                  <View className="flex-row flex-wrap gap-0.5 absolute bottom-1 left-1">
                    {daySessions.slice(0, 3).map((s) => (
                      <View key={s.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isPast ? "#9ca3af" : s.color }} />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="bg-card rounded-2xl border border-border p-4">
          {selectedDateKey ? (
            <>
              <Text className="font-bold text-foreground text-sm mb-1">{formatDateLabel(selectedDateKey)}</Text>

              {selectedIsPast ? (
                <Text className="text-sm text-muted-foreground py-4 text-center">
                  This date has passed. Past sessions can't be modified.
                </Text>
              ) : (
                <>
                  {selectedHoliday ? (
                    <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3 mt-2">
                      <PartyPopper size={14} color="#dc2626" />
                      <Text className="text-sm font-medium text-red-700 flex-1">{selectedHoliday.title}</Text>
                      {selectedHoliday.tentative ? (
                        <View className="bg-red-200 px-1.5 py-0.5 rounded-full">
                          <Text className="text-[9px] text-red-800">Tentative</Text>
                        </View>
                      ) : null}
                      {selectedHoliday.isCustom && selectedHoliday.id ? (
                        <TouchableOpacity onPress={() => handleDeleteHoliday(selectedHoliday.id!)}>
                          <Trash2 size={14} color="#dc2626" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowHolidayModal(true)}
                      className="flex-row items-center justify-center gap-1.5 py-2.5 mt-2 mb-3 border-2 border-dashed border-red-300 rounded-xl"
                    >
                      <PartyPopper size={14} color="#dc2626" />
                      <Text className="text-red-600 text-xs font-semibold">Mark as Holiday</Text>
                    </TouchableOpacity>
                  )}

                  <View className="gap-2 mt-2">
                    {selectedSessions.length === 0 ? (
                      <Text className="text-sm text-muted-foreground py-4 text-center">No sessions scheduled for this day.</Text>
                    ) : (
                      selectedSessions.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => { setEditingSession(s); setShowSessionModal(true); }}
                          className="rounded-xl p-3 border-2"
                          style={{ borderColor: s.color + "55", backgroundColor: s.color + "10" }}
                        >
                          <Text className="font-semibold text-sm text-foreground mb-1">{s.title}</Text>
                          <View className="flex-row items-center gap-1.5">
                            <Clock size={11} color="#9ca3af" />
                            <Text className="text-xs text-muted-foreground">{s.startTime} - {s.endTime}</Text>
                          </View>
                          <View className="flex-row gap-1.5 mt-1.5">
                            <View className="bg-white px-2 py-0.5 rounded-full border border-border">
                              <Text className="text-[10px] text-muted-foreground">{s.subject}</Text>
                            </View>
                            <View className="bg-white px-2 py-0.5 rounded-full border border-border">
                              <Text className="text-[10px] text-muted-foreground">{s.class}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => { setEditingSession(null); setShowSessionModal(true); }}
                    className="flex-row items-center justify-center gap-1.5 py-2.5 mt-3 border-2 border-dashed border-border rounded-xl"
                  >
                    <Plus size={14} color="#6b7280" />
                    <Text className="text-muted-foreground text-xs font-semibold">Add Session for This Day</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <View className="items-center py-8">
              <CalendarIcon size={40} color="#9ca3af" />
              <Text className="text-muted-foreground text-sm mt-2 text-center">Tap a date on the calendar to see or add sessions.</Text>
            </View>
          )}
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