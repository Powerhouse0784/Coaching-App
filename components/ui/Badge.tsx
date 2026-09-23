import { View, Text } from "react-native";
import { colors, radius, fonts } from "@/constants/theme";

type Tone = "neutral" | "brand" | "gold" | "success" | "danger";

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.inkMuted },
  brand: { bg: colors.indigoTint, fg: colors.indigo },
  gold: { bg: colors.goldTint, fg: colors.gold },
  success: { bg: colors.mintTint, fg: colors.mint },
  danger: { bg: colors.coralTint, fg: colors.coral },
};

export default function Badge({ label, tone = "neutral" }: BadgeProps) {
  const t = toneStyles[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderRadius: radius.pill,
        paddingVertical: 4,
        paddingHorizontal: 10,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: t.fg, fontFamily: fonts.bodySemibold, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}
