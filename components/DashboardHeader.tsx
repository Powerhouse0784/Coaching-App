import { useState } from "react";
import { View, Text, Image } from "react-native";
import { User as UserIcon } from "lucide-react-native";
import AnimatedPressable from "./ui/AnimatedPressable";
import UserMenuModal from "./UserMenuModal";
import { colors, fonts, radius } from "@/constants/theme";

interface Props {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 38, height: 38, borderRadius: radius.sm }}
            resizeMode="contain"
          />
          <View>
            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 15 }}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.body, fontSize: 12 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <AnimatedPressable
          pressScale={0.9}
          onPress={() => setMenuOpen(true)}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: radius.md,
          }}
        >
          <UserIcon size={18} color={colors.white} />
        </AnimatedPressable>
      </View>

      <UserMenuModal visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
