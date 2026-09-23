import { ReactNode } from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, "style"> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How much the element shrinks on press. Default 0.97 (subtle, for cards). Use 0.94 for buttons. */
  pressScale?: number;
  disabled?: boolean;
}

/**
 * The single source of "what a tap feels like" in this app.
 * Wrap Button, Card, list rows, icon buttons — anything tappable —
 * in this instead of a bare Pressable so every interaction is consistent.
 */
export default function AnimatedPressable({
  children,
  style,
  pressScale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(pressScale, { damping: 18, stiffness: 380 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style, disabled && { opacity: 0.5 }]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}
