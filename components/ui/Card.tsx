import { ReactNode } from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import AnimatedPressable from "./AnimatedPressable";
import { colors, radius, spacing, shadow } from "@/constants/theme";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** "flat" = hairline border, no shadow (default, use for grids/lists). "raised" = soft shadow, no border (use for the one or two elevated things per screen, e.g. a modal-like card). */
  elevation?: "flat" | "raised";
  padding?: keyof typeof spacing | number;
}

export default function Card({
  children,
  onPress,
  style,
  elevation = "flat",
  padding = "lg",
}: CardProps) {
  const pad = typeof padding === "number" ? padding : spacing[padding];

  const baseStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: pad,
    ...(elevation === "flat"
      ? { borderWidth: 1, borderColor: colors.border }
      : shadow.raised),
  };

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} style={[baseStyle, style]}>
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
