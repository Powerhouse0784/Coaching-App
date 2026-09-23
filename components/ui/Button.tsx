import { ReactNode } from "react";
import { Text, ActivityIndicator, View, ViewStyle, StyleProp } from "react-native";
import { LucideIcon } from "lucide-react-native";
import AnimatedPressable from "./AnimatedPressable";
import { colors, radius, spacing, fonts } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeMap: Record<Size, { paddingV: number; paddingH: number; fontSize: number; iconSize: number }> = {
  sm: { paddingV: 8, paddingH: 14, fontSize: 13, iconSize: 16 },
  md: { paddingV: 13, paddingH: 20, fontSize: 15, iconSize: 18 },
  lg: { paddingV: 16, paddingH: 24, fontSize: 16, iconSize: 20 },
};

const variantStyles: Record<Variant, { bg: string; border?: string; fg: string; pressedFg?: string }> = {
  primary: { bg: colors.indigo, fg: colors.white },
  secondary: { bg: colors.indigoTint, fg: colors.indigo },
  ghost: { bg: "transparent", border: colors.border, fg: colors.ink },
  destructive: { bg: colors.coralTint, fg: colors.coral },
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const s = sizeMap[size];
  const v = variantStyles[variant];

  return (
    <AnimatedPressable
      pressScale={0.95}
      disabled={disabled || loading}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        {
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          borderRadius: radius.md,
          paddingVertical: s.paddingV,
          paddingHorizontal: s.paddingH,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={s.iconSize} color={v.fg} />}
          <Text
            style={{
              color: v.fg,
              fontFamily: fonts.bodySemibold,
              fontSize: s.fontSize,
            }}
          >
            {label}
          </Text>
          {Icon && iconPosition === "right" && <Icon size={s.iconSize} color={v.fg} />}
        </>
      )}
    </AnimatedPressable>
  );
}
