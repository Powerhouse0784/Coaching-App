import { View, Text, Image } from "react-native";
import { colors, fonts } from "@/constants/theme";

type Size = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: Size;
}

const sizeMap: Record<Size, { box: number; font: number }> = {
  sm: { box: 32, font: 12 },
  md: { box: 44, font: 15 },
  lg: { box: 60, font: 20 },
  xl: { box: 88, font: 28 },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, uri, size = "md" }: AvatarProps) {
  const s = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: s.box, height: s.box, borderRadius: s.box / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.box / 2,
        backgroundColor: colors.indigoTint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.indigo, fontFamily: fonts.bodySemibold, fontSize: s.font }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
