import { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing, fonts } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  style,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderProgress.value
      ? error
        ? colors.coral
        : colors.indigo
      : error
      ? colors.coral
      : colors.border,
  }));

  return (
    <View style={{ gap: spacing.xs }}>
      {label && (
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted }}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
          },
          animatedStyle,
        ]}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={colors.inkFaint}
          onFocus={(e) => {
            setFocused(true);
            borderProgress.value = withTiming(1, { duration: 150 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            borderProgress.value = withTiming(0, { duration: 150 });
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              paddingVertical: 13,
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.ink,
            },
            style,
          ]}
          {...rest}
        />
        {rightIcon}
      </Animated.View>
      {error && (
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.coral }}>
          {error}
        </Text>
      )}
    </View>
  );
}
