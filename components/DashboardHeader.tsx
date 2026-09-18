import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { User as UserIcon } from "lucide-react-native";
import UserMenuModal from "./UserMenuModal";

interface Props {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View className="flex-row items-center justify-between px-5 pt-1 pb-4">
        <View className="flex-row items-center gap-3 flex-1">
          <Image
            source={require("@/assets/images/logo.png")}
            className="w-10 h-10 rounded-lg"
            resizeMode="contain"
          />
          <View>
            <Text className="text-white font-bold text-base leading-tight">{title}</Text>
            {subtitle ? <Text className="text-purple-200 text-xs leading-tight">{subtitle}</Text> : null}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          className="w-10 h-10 items-center justify-center bg-white/15 rounded-xl"
        >
          <UserIcon size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <UserMenuModal visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}