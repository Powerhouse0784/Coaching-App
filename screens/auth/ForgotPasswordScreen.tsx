import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyRound, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react-native";
import api from "@/lib/api";
import type { AuthStackParamList } from "@/navigation/types";

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
    <View className="flex-1 bg-background justify-center px-5 py-8">
      <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2 mb-6">
        <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
          <ArrowLeft size={20} color="#374151" />
        </View>
        <Text className="text-foreground font-semibold">Back to Sign In</Text>
      </TouchableOpacity>

      <View className="bg-card rounded-2xl p-6 border border-border shadow-lg">
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-2xl mb-4 items-center justify-center bg-indigo-100">
            <KeyRound size={28} color="#4f46e5" />
          </View>
          <Text className="text-xl font-bold text-foreground">
            {step === "email" ? "Forgot Password?" : "Check Your Email"}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1 text-center">
            {step === "email"
              ? "No worries! Enter your email and we'll send you reset instructions."
              : `We've sent a password reset link to ${email}`}
          </Text>
        </View>

        {step === "email" ? (
          <>
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <AlertCircle size={18} color="#dc2626" />
                <Text className="text-red-600 text-sm flex-1">{error}</Text>
              </View>
            ) : null}
            <Text className="text-sm font-medium text-foreground mb-1.5">Email Address</Text>
            <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-5">
              <Mail size={18} color="#9ca3af" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 py-3 px-2 text-foreground"
              />
            </View>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="bg-indigo-600 rounded-xl py-3.5 items-center"
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Send Reset Link</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
              <CheckCircle size={32} color="#16a34a" />
            </View>
            <Text className="text-sm text-muted-foreground text-center mb-4">
              Click the link in the email to reset your password. Check your spam folder if you don't see it.
            </Text>
            <TouchableOpacity onPress={() => setStep("email")}>
              <Text className="text-indigo-600 font-semibold text-sm">Didn't receive it? Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row justify-center mt-5">
          <Text className="text-muted-foreground text-sm">Remembered your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text className="text-indigo-600 font-semibold text-sm">Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}