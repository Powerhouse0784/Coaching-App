import { View, Text, TouchableOpacity } from "react-native";
import { LogOut } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
export default function StudentProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-5">
        <Text className="text-xl font-bold text-foreground">{user?.name}</Text>
        <Text className="text-muted-foreground">{user?.email}</Text>

        <TouchableOpacity
          onPress={logout}
          className="flex-row items-center gap-2 mt-8 bg-red-50 border border-red-200 rounded-xl p-3 self-start"
        >
          <LogOut size={18} color="#dc2626" />
          <Text className="text-red-600 font-medium">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}