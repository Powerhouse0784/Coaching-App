import { useState } from "react";
import { View, Text, TextInput, Modal, Pressable } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { X, PartyPopper } from "lucide-react-native";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

interface Props {
  visible: boolean;
  dateKey: string;
  onClose: () => void;
  onSave: (title: string, date: string) => Promise<boolean>;
}

function formatDateLabel(dateKey: string) {
  const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date(dateKey + "T00:00:00");
  return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export default function HolidayFormModal({ visible, dateKey, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!title.trim()) {
      return;
    }
    setSubmitting(true);
    const ok = await onSave(title, dateKey);
    if (ok) setTitle("");
    else setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    setTitle("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: "rgba(23,25,35,0.6)", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg }}>
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={handleClose} />
        <Animated.View entering={ZoomIn.duration(250)} style={{ width: "100%", backgroundColor: colors.paper, borderRadius: radius.xl, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.coralTint, alignItems: "center", justifyContent: "center" }}>
                <PartyPopper size={16} color={colors.coral} />
              </View>
              <View>
                <Text style={{ ...type.h3, fontSize: 15.5, color: colors.ink }}>Add Custom Holiday</Text>
                <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 1 }}>{formatDateLabel(dateKey)}</Text>
              </View>
            </View>
            <AnimatedPressable pressScale={0.9} onPress={handleClose} disabled={submitting} style={{ width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
              <X size={16} color={colors.inkMuted} />
            </AnimatedPressable>
          </View>

          <View style={{ padding: spacing.lg }}>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Institute Anniversary"
              placeholderTextColor={colors.inkFaint}
              autoFocus
              style={{
                borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
                fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface,
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Button label="Cancel" variant="ghost" onPress={handleClose} disabled={submitting} style={{ flex: 1 }} />
            <Button
              label="Add Holiday"
              onPress={handleSubmit}
              disabled={submitting || !title.trim()}
              loading={submitting}
              style={{ flex: 1, backgroundColor: colors.coral }}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
