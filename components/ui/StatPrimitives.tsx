import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from "react-native-reanimated";
import { colors, fonts } from "@/constants/theme";

// Animates a number counting up from 0 to `target` with ease-out — used anywhere
// a stat appears so numbers feel alive rather than snapping in.
export function useCountUp(target: number, duration = 700) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

export function MiniStat({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  const count = useCountUp(value);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Icon size={12} color="rgba(255,255,255,0.7)" />
      <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{count}</Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: fonts.body, fontSize: 10.5 }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Pulsing dot — draws the eye to things needing attention (overdue, unanswered, urgent).
export function AttentionDot({ color = colors.coral, size = 7 }: { color?: string; size?: number }) {
  const glow = useSharedValue(0.4);
  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: glow.value }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}
