import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { X, Trash2 } from "lucide-react-native";
import type { ScheduleSession } from "@/types";

interface Props {
  visible: boolean;
  session: ScheduleSession | null;
  dateKey: string;
  onClose: () => void;
  onSave: (payload: any) => Promise<boolean>;
  onDelete?: () => void;
}

const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#f97316", "#ec4899", "#14b8a6", "#eab308"];

function isValidTime(t: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

function formatDateLabel(dateKey: string) {
  const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date(dateKey + "T00:00:00");
  return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export default function SessionFormModal({ visible, session, dateKey, onClose, onSave, onDelete }: Props) {
  const isEdit = !!session;
  const [title, setTitle] = useState(session?.title ?? "");
  const [subject, setSubject] = useState(session?.subject ?? "");
  const [className, setClassName] = useState(session?.class ?? "");
  const [startTime, setStartTime] = useState(session?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(session?.endTime ?? "10:00");
  const [color, setColor] = useState(session?.color ?? COLORS[0]);
  const [notes, setNotes] = useState(session?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!title.trim() || !subject.trim() || !className.trim()) {
      Alert.alert("Missing info", "Please fill in title, subject, and class");
      return;
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      Alert.alert("Invalid time", "Please enter times as HH:MM (24-hour), e.g. 09:00");
      return;
    }
    if (startTime >= endTime) {
      Alert.alert("Invalid time", "End time must be after start time");
      return;
    }
    setSubmitting(true);
    const ok = await onSave({
      id: session?.id,
      title, subject, class: className,
      date: dateKey, startTime, endTime, color,
      notes: notes || null,
    });
    if (!ok) setSubmitting(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: "88%" }}>
            <View className="flex-row items-center justify-between p-5 border-b border-border">
              <View>
                <Text className="text-lg font-bold text-foreground">{isEdit ? "Edit Session" : "New Session"}</Text>
                <Text className="text-xs text-muted-foreground">{formatDateLabel(dateKey)}</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={submitting}>
                <X size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text className="text-sm font-semibold text-foreground mb-1.5">Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Physics Live Class"
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm mb-4"
              />

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Subject *</Text>
                  <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Physics"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Class *</Text>
                  <TextInput
                    value={className}
                    onChangeText={setClassName}
                    placeholder="Class 12"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
              </View>

              <View className="flex-row gap-3 mb-1">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">Start Time *</Text>
                  <TextInput
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-1.5">End Time *</Text>
                  <TextInput
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="10:00"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  />
                </View>
              </View>
              <Text className="text-xs text-muted-foreground mb-4">24-hour format, e.g. 14:30</Text>

              <Text className="text-sm font-semibold text-foreground mb-2">Color Tag</Text>
              <View className="flex-row gap-2.5 mb-4">
                {COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 32, height: 32, borderRadius: 16, backgroundColor: c,
                      borderWidth: color === c ? 3 : 0, borderColor: "#111827",
                    }}
                  />
                ))}
              </View>

              <Text className="text-sm font-semibold text-foreground mb-1.5">Notes (Optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes about this session…"
                multiline
                numberOfLines={3}
                className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                style={{ textAlignVertical: "top", minHeight: 70 }}
              />
            </ScrollView>

            <View className="flex-row gap-3 p-5 border-t border-border">
              {isEdit && onDelete && (
                <TouchableOpacity
                  onPress={onDelete}
                  disabled={submitting}
                  className="w-12 border-2 border-red-300 rounded-xl items-center justify-center"
                  style={{ opacity: submitting ? 0.5 : 1 }}
                >
                  <Trash2 size={16} color="#dc2626" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                className="flex-1 border-2 border-border rounded-xl py-3 items-center"
                style={{ opacity: submitting ? 0.5 : 1 }}
              >
                <Text className="font-semibold text-foreground text-sm">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-teal-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-semibold text-sm">{isEdit ? "Save Changes" : "Add Session"}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}