import { useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Mail, Lock, Eye, EyeOff, GraduationCap, UserCheck, AlertCircle,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import type { AuthStackParamList } from "@/navigation/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password, role);
      // RootNavigator watches the auth store and will auto-switch
      // to the correct role navigator once `user` is set — nothing to navigate here.
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { val: "STUDENT" as const, icon: GraduationCap, label: "Student" },
    { val: "TEACHER" as const, icon: UserCheck, label: "Teacher" },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Brand hero */}
        <LinearGradient
          colors={[colors.indigoDark, colors.indigo]}
          style={{ paddingTop: 72, paddingBottom: 48, paddingHorizontal: 24, alignItems: "center", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <View pointerEvents="none" style={{ position: "absolute", top: -50, left: -40, width: 150, height: 150, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <Animated.View entering={FadeIn.duration(450)} style={{ alignItems: "center" }}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ width: 64, height: 64, borderRadius: radius.lg, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text style={{ ...type.h1, color: colors.white, marginBottom: 4 }}>Welcome Back</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: "rgba(255,255,255,0.7)" }}>
              Sign in to continue learning
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Form card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 20, marginTop: -28, paddingBottom: 32 }}>
          <Card padding="xl">
            {error ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
                <AlertCircle size={17} color={colors.coral} />
                <Text style={{ color: colors.coral, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 10 }}>I am a:</Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: spacing.lg }}>
              {roles.map(({ val, icon: Icon, label }) => {
                const active = role === val;
                return (
                  <AnimatedPressable
                    key={val}
                    pressScale={0.96}
                    onPress={() => setRole(val)}
                    style={{
                      flex: 1, paddingVertical: 16, borderRadius: radius.md, alignItems: "center",
                      borderWidth: 1.5, borderColor: active ? colors.indigo : colors.border,
                      backgroundColor: active ? colors.indigoTint : colors.surface,
                    }}
                  >
                    <Icon size={22} color={active ? colors.indigo : colors.inkFaint} />
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: active ? colors.indigo : colors.inkMuted, marginTop: 6 }}>
                      {label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={17} color={colors.inkFaint} />}
              style={{ marginBottom: 0 }}
            />
            <View style={{ height: spacing.md }} />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={17} color={colors.inkFaint} />}
              rightIcon={
                <AnimatedPressable pressScale={0.85} onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={17} color={colors.inkFaint} /> : <Eye size={17} color={colors.inkFaint} />}
                </AnimatedPressable>
              }
              style={{ marginBottom: 0 }}
            />

            <AnimatedPressable pressScale={0.95} onPress={() => navigation.navigate("ForgotPassword")} style={{ alignSelf: "flex-end", marginTop: spacing.sm, marginBottom: spacing.lg }}>
              <Text style={{ color: colors.indigo, fontFamily: fonts.bodySemibold, fontSize: 12.5 }}>Forgot password?</Text>
            </AnimatedPressable>

            <Button label="Sign In" onPress={handleSubmit} loading={loading} fullWidth size="lg" />

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.lg }}>
              <Text style={{ color: colors.inkMuted, fontFamily: fonts.body, fontSize: 13 }}>Don't have an account? </Text>
              <AnimatedPressable pressScale={0.95} onPress={() => navigation.navigate("Register")}>
                <Text style={{ color: colors.indigo, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Sign up for free</Text>
              </AnimatedPressable>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
