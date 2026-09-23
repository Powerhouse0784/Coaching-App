import { useState } from "react";
import {
  View, Text, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Mail, Lock, Eye, EyeOff, GraduationCap, UserCheck,
  AlertCircle, CheckCircle2, ArrowLeft, User as UserIcon, KeyRound,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import type { AuthStackParamList } from "@/navigation/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const TEACHER_REGISTRATION_CODE = "P8YGJCVR2";

export default function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [teacherCode, setTeacherCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (password !== confirmPassword) return setError("Passwords do not match!");
    if (password.length < 6) return setError("Password must be at least 6 characters long");
    if (role === "TEACHER" && teacherCode.trim() !== TEACHER_REGISTRATION_CODE) {
      return setError("Invalid teacher registration code.");
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      setSuccess("Account created! Redirecting...");
      // RootNavigator auto-switches once `user` is set in the store
    } catch (err: any) {
      const msg = err.response?.data?.error || "Something went wrong";
      setError(msg.includes("already registered") ? "This email is already registered. Please login instead." : msg);
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
          style={{ paddingTop: 56, paddingBottom: 44, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <AnimatedPressable pressScale={0.92} onPress={() => navigation.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={18} color={colors.white} />
            </View>
            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 14 }}>Back</Text>
          </AnimatedPressable>

          <Animated.View entering={FadeIn.duration(450)} style={{ alignItems: "center" }}>
            <Text style={{ ...type.h1, color: colors.white, marginBottom: 4 }}>Create Account</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: "rgba(255,255,255,0.7)" }}>
              Start your journey today
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Form card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 20, marginTop: -24, paddingBottom: 32 }}>
          <Card padding="xl">
            {error ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
                <AlertCircle size={17} color={colors.coral} />
                <Text style={{ color: colors.coral, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}
            {success ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.mintTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
                <CheckCircle2 size={17} color={colors.mint} />
                <Text style={{ color: colors.mint, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 }}>{success}</Text>
              </View>
            ) : null}

            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 10 }}>I want to register as:</Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: spacing.lg }}>
              {roles.map(({ val, icon: Icon, label }) => {
                const active = role === val;
                return (
                  <AnimatedPressable
                    key={val}
                    pressScale={0.96}
                    onPress={() => { setRole(val); setTeacherCode(""); setError(""); }}
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

            {role === "TEACHER" && (
              <Animated.View entering={FadeInDown.duration(300)} style={{ backgroundColor: colors.goldTint, borderRadius: radius.md, borderWidth: 1, borderColor: `${colors.gold}55`, padding: spacing.md, marginBottom: spacing.lg }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <KeyRound size={14} color={colors.gold} />
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: "#8A6816" }}>Teacher Registration Code *</Text>
                </View>
                <Input
                  value={teacherCode}
                  onChangeText={(t) => { setTeacherCode(t.toUpperCase()); setError(""); }}
                  placeholder="Enter teacher code"
                  autoCapitalize="characters"
                  style={{ marginBottom: 0 }}
                />
              </Animated.View>
            )}

            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Vivek Kumar Jha"
              leftIcon={<UserIcon size={17} color={colors.inkFaint} />}
              style={{ marginBottom: 0 }}
            />
            <View style={{ height: spacing.md }} />

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
              placeholder="Create a strong password"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={17} color={colors.inkFaint} />}
              rightIcon={
                <AnimatedPressable pressScale={0.85} onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={17} color={colors.inkFaint} /> : <Eye size={17} color={colors.inkFaint} />}
                </AnimatedPressable>
              }
              style={{ marginBottom: 0 }}
            />
            <View style={{ height: spacing.md }} />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={17} color={colors.inkFaint} />}
              style={{ marginBottom: 0 }}
            />
            <View style={{ height: spacing.lg }} />

            <Button label="Create Account" onPress={handleSubmit} loading={loading} fullWidth size="lg" />

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.lg }}>
              <Text style={{ color: colors.inkMuted, fontFamily: fonts.body, fontSize: 13 }}>Already have an account? </Text>
              <AnimatedPressable pressScale={0.95} onPress={() => navigation.navigate("Login")}>
                <Text style={{ color: colors.indigo, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Sign in</Text>
              </AnimatedPressable>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
