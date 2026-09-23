import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { KeyRound, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react-native";
import api from "@/lib/api";
import type { AuthStackParamList } from "@/navigation/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setStep("sent");
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.paper }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Brand hero */}
        <LinearGradient
          colors={[colors.indigoDark, colors.indigo]}
          style={{ paddingTop: 56, paddingBottom: 52, paddingHorizontal: 20, alignItems: "center", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <AnimatedPressable pressScale={0.92} onPress={() => navigation.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 24 }}>
            <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={18} color={colors.white} />
            </View>
            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 14 }}>Back to Sign In</Text>
          </AnimatedPressable>

          <Animated.View entering={FadeIn.duration(450)} style={{ alignItems: "center" }}>
            <View style={{ width: 60, height: 60, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <KeyRound size={28} color={colors.white} />
            </View>
            <Text style={{ ...type.h2, color: colors.white, marginBottom: 4, textAlign: "center" }}>
              {step === "email" ? "Forgot Password?" : "Check Your Email"}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center", paddingHorizontal: 16, lineHeight: 19 }}>
              {step === "email"
                ? "No worries! Enter your email and we'll send you reset instructions."
                : `We've sent a password reset link to ${email}`}
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Form card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={{ paddingHorizontal: 20, marginTop: -28, paddingBottom: 32 }}>
          <Card padding="xl">
            {step === "email" ? (
              <>
                {error ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.coralTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }}>
                    <AlertCircle size={17} color={colors.coral} />
                    <Text style={{ color: colors.coral, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 }}>{error}</Text>
                  </View>
                ) : null}

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
                <View style={{ height: spacing.lg }} />

                <Button label="Send Reset Link" onPress={handleSubmit} loading={loading} fullWidth size="lg" />
              </>
            ) : (
              <View style={{ alignItems: "center" }}>
                <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: colors.mintTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
                  <CheckCircle size={30} color={colors.mint} />
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginBottom: spacing.lg, lineHeight: 19 }}>
                  Click the link in the email to reset your password. Check your spam folder if you don't see it.
                </Text>
                <AnimatedPressable pressScale={0.95} onPress={() => setStep("email")}>
                  <Text style={{ color: colors.indigo, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Didn't receive it? Try again</Text>
                </AnimatedPressable>
              </View>
            )}

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.lg }}>
              <Text style={{ color: colors.inkMuted, fontFamily: fonts.body, fontSize: 13 }}>Remembered your password? </Text>
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
