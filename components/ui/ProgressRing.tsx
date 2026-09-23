import { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from "react-native-reanimated";
import { colors, fonts } from "@/constants/theme";

interface Props {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

export default function ProgressRing({
  progress, size = 72, strokeWidth = 7, color = colors.gold, trackColor = "rgba(255,255,255,0.2)", label,
}: Props) {
  const radiusPx = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusPx;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));
  const glow = useSharedValue(0.55);

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size + 10, height: size + 10, borderRadius: 999, backgroundColor: `${color}30` }, glowStyle]} />
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radiusPx} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radiusPx}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          rotation={-90} origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: size < 60 ? 12 : 15 }}>{Math.round(progress * 100)}%</Text>
        {label ? <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: fonts.body, fontSize: 8 }}>{label}</Text> : null}
      </View>
    </View>
  );
}
