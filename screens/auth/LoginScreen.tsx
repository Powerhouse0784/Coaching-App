import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Mail, Lock, Eye, EyeOff, GraduationCap, UserCheck,
  AlertCircle, ArrowLeft,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import type { AuthStackParamList } from "@/navigation/types";

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-5 py-8">
        <View className="bg-card rounded-2xl p-6 border border-border shadow-lg">
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl mb-4 items-center justify-center bg-primary/10">
              <GraduationCap size={32} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-foreground">Welcome Back</Text>
            <Text className="text-sm text-muted-foreground mt-1">Sign in to continue learning</Text>
          </View>

          {error ? (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <AlertCircle size={18} color="#dc2626" />
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          ) : null}

          <Text className="text-sm font-medium text-foreground mb-2">I am a:</Text>
          <View className="flex-row gap-3 mb-4">
            {[
              { val: "STUDENT" as const, icon: GraduationCap, label: "Student" },
              { val: "TEACHER" as const, icon: UserCheck, label: "Teacher" },
            ].map(({ val, icon: Icon, label }) => (
              <TouchableOpacity
                key={val}
                onPress={() => setRole(val)}
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  role === val ? "border-blue-500 bg-blue-50" : "border-border"
                }`}
              >
                <Icon size={24} color={role === val ? "#3b82f6" : "#9ca3af"} />
                <Text className="font-semibold text-sm mt-1.5">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-medium text-foreground mb-1.5">Email Address</Text>
          <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4">
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

          <Text className="text-sm font-medium text-foreground mb-1.5">Password</Text>
          <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-2">
            <Lock size={18} color="#9ca3af" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              className="flex-1 py-3 px-2 text-foreground"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} className="self-end mb-5">
            <Text className="text-blue-600 text-sm font-medium">Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={["#2563eb", "#9333ea"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl py-3.5 items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-5">
            <Text className="text-muted-foreground text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text className="text-blue-600 font-semibold text-sm">Sign up for free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}