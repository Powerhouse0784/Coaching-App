import { useState } from "react";
import {
  View, Text, TextInput, Modal, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { X, Trash2, Save } from "lucide-react-native";
import type { ScheduleSession } from "@/types";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

interface Props {
  visible: boolean;
  session: ScheduleSession | null;
  dateKey: string;
  onClose: () => void;
  onSave: (payload: any) => Promise<boolean>;
  onDelete?: () => void;
}

const COLORS = ["#5A72C4", "#A855F7", "#2F8F5B", "#C99A2E", "#EC4899", "#14B8A6", "#C1443A"];

const fieldStyle = {
  borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
  paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
  fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface,
};

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: "rgba(23,25,35,0.6)", justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={submitting ? undefined : onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View
            entering={SlideInDown.duration(280).springify().damping(18)}
            style={{ backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "88%" }}
          >
            <View style={{ alignItems: "center", paddingTop: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View>
                <Text style={{ ...type.h3, fontSize: 17, color: colors.ink }}>{isEdit ? "Edit Session" : "New Session"}</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 1 }}>{formatDateLabel(dateKey)}</Text>
              </View>
              <AnimatedPressable pressScale={0.9} onPress={onClose} disabled={submitting} style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
                <X size={18} color={colors.inkMuted} />
              </AnimatedPressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Title *</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="e.g., Physics Live Class" placeholderTextColor={colors.inkFaint} style={[fieldStyle, { marginBottom: spacing.lg }]} />

              <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Subject *</Text>
                  <TextInput value={subject} onChangeText={setSubject} placeholder="Physics" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Class *</Text>
                  <TextInput value={className} onChangeText={setClassName} placeholder="Class 12" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Start Time *</Text>
                  <TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>End Time *</Text>
                  <TextInput value={endTime} onChangeText={setEndTime} placeholder="10:00" placeholderTextColor={colors.inkFaint} style={fieldStyle} />
                </View>
              </View>
              <Text style={{ ...type.caption, color: colors.inkFaint, marginBottom: spacing.lg }}>24-hour format, e.g. 14:30</Text>

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: spacing.sm }}>Color Tag</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: spacing.lg }}>
                {COLORS.map((c) => (
                  <AnimatedPressable
                    key={c}
                    pressScale={0.85}
                    onPress={() => setColor(c)}
                    style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.ink }}
                  />
                ))}
              </View>

              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Notes (Optional)</Text>
              <TextInput
                value={notes} onChangeText={setNotes} placeholder="Optional notes about this session…" placeholderTextColor={colors.inkFaint}
                multiline numberOfLines={3} style={[fieldStyle, { textAlignVertical: "top", minHeight: 70 }]}
              />
            </ScrollView>

            <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
              {isEdit && onDelete && (
                <AnimatedPressable
                  pressScale={0.9}
                  onPress={onDelete}
                  disabled={submitting}
                  style={{ width: 48, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(193,68,58,0.3)", borderRadius: radius.md, opacity: submitting ? 0.5 : 1 }}
                >
                  <Trash2 size={16} color={colors.coral} />
                </AnimatedPressable>
              )}
              <Button label="Cancel" variant="ghost" onPress={onClose} disabled={submitting} style={{ flex: 1 }} />
              <Button label={isEdit ? "Save Changes" : "Add Session"} icon={Save} onPress={handleSubmit} disabled={submitting} loading={submitting} style={{ flex: 1 }} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
