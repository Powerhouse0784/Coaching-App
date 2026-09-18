import { View, Text, TouchableOpacity, Modal, Pressable, Alert } from "react-native";
import { Edit, Settings, Moon, Eye, LogOut } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useNavigation } from "@react-navigation/native";
interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function UserMenuModal({ visible, onClose }: Props) {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);

  const initials = user?.name?.[0]?.toUpperCase() || "?";

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable className="absolute top-24 right-4 w-64 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Profile header */}
          <View className="px-4 py-3 border-b border-border flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-indigo-500 items-center justify-center">
              <Text className="text-white font-bold text-base">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>{user?.name}</Text>
              <Text className="text-muted-foreground text-xs" numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleAction(() => (navigation as any).getParent()?.navigate("EditProfile"))}
            className="flex-row items-center gap-3 px-4 py-3"
          >
            <Edit size={16} color="#6b7280" />
            <Text className="text-foreground text-sm">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAction(() => (navigation as any).getParent()?.navigate("Settings"))}
            className="flex-row items-center gap-3 px-4 py-3"
          >
            <Settings size={16} color="#6b7280" />
            <Text className="text-foreground text-sm">Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAction(() => Alert.alert("Dark Mode", "Dark mode is coming soon in the app."))}
            className="flex-row items-center gap-3 px-4 py-3"
          >
            <Moon size={16} color="#6b7280" />
            <Text className="text-foreground text-sm">Dark Mode</Text>
          </TouchableOpacity>

          {/* Switch view — only for teacher accounts, matching web's role gate */}
          {user?.role === "TEACHER" && (
            <>
              <View className="border-t border-border" />
              <TouchableOpacity
                onPress={() =>
                  handleAction(() => setViewMode(viewMode === "teacher" ? "student" : "teacher"))
                }
                className="flex-row items-center gap-3 px-4 py-3"
              >
                <Eye size={16} color="#6b7280" />
                <Text className="text-foreground text-sm">
                  Switch to {viewMode === "teacher" ? "Student" : "Teacher"} View
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View className="border-t border-border" />
          <TouchableOpacity
            onPress={() => handleAction(logout)}
            className="flex-row items-center gap-3 px-4 py-3"
          >
            <LogOut size={16} color="#dc2626" />
            <Text className="text-red-600 text-sm font-medium">Logout</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}