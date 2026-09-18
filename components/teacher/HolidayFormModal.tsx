import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { X } from "lucide-react-native";

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
      Alert.alert("Missing title", "Please enter a title for this holiday");
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
      <View className="flex-1 bg-black/70 items-center justify-center px-5">
        <View className="w-full bg-background rounded-3xl overflow-hidden">
          <View className="flex-row items-center justify-between p-5 border-b border-border">
            <View>
              <Text className="text-lg font-bold text-foreground">Add Custom Holiday</Text>
              <Text className="text-xs text-muted-foreground">{formatDateLabel(dateKey)}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={submitting}>
              <X size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="p-5">
            <Text className="text-sm font-semibold text-foreground mb-1.5">Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Institute Anniversary"
              className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
              autoFocus
            />
          </View>

          <View className="flex-row gap-3 p-5 border-t border-border">
            <TouchableOpacity
              onPress={handleClose}
              disabled={submitting}
              className="flex-1 border-2 border-border rounded-xl py-3 items-center"
              style={{ opacity: submitting ? 0.5 : 1 }}
            >
              <Text className="font-semibold text-foreground text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-red-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">Add Holiday</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}