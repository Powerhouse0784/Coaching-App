import { useEffect } from "react";
import { ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, radius } from "@/constants/theme";

interface Props {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Skeleton({ width = "100%", height = 16, borderRadius: br = radius.sm, style }: Props) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: br, backgroundColor: colors.surfaceMuted },
        animatedStyle,
        style,
      ]}
    />
  );
}
