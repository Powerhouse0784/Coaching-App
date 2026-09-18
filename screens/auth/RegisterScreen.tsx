import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Mail, Lock, Eye, EyeOff, GraduationCap, UserCheck,
  AlertCircle, CheckCircle2, ArrowLeft, User as UserIcon,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import type { AuthStackParamList } from "@/navigation/types";

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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="px-5 py-8">
        <TouchableOpacity onPress={() => navigation.goBack()} className="flex-row items-center gap-2 mb-6">
          <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
            <ArrowLeft size={20} color="#374151" />
          </View>
          <Text className="text-foreground font-semibold">Back</Text>
        </TouchableOpacity>

        <View className="bg-card rounded-2xl p-6 border border-border shadow-lg">
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-foreground">Create Account</Text>
            <Text className="text-sm text-muted-foreground mt-1">Start your journey today</Text>
          </View>

          {error ? (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <AlertCircle size={18} color="#dc2626" />
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View className="flex-row items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <CheckCircle2 size={18} color="#16a34a" />
              <Text className="text-green-600 text-sm flex-1">{success}</Text>
            </View>
          ) : null}

          <Text className="text-sm font-medium text-foreground mb-2">I want to register as:</Text>
          <View className="flex-row gap-3 mb-4">
            {[
              { val: "STUDENT" as const, icon: GraduationCap, label: "Student" },
              { val: "TEACHER" as const, icon: UserCheck, label: "Teacher" },
            ].map(({ val, icon: Icon, label }) => (
              <TouchableOpacity
                key={val}
                onPress={() => { setRole(val); setTeacherCode(""); setError(""); }}
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  role === val ? "border-purple-500 bg-purple-50" : "border-border"
                }`}
              >
                <Icon size={24} color={role === val ? "#a855f7" : "#9ca3af"} />
                <Text className="font-semibold text-sm mt-1.5">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === "TEACHER" && (
            <View className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 mb-4">
              <Text className="text-sm font-medium text-purple-900 mb-2">Teacher Registration Code *</Text>
              <TextInput
                value={teacherCode}
                onChangeText={(t) => { setTeacherCode(t.toUpperCase()); setError(""); }}
                placeholder="Enter teacher code"
                autoCapitalize="characters"
                className="bg-white border-2 border-purple-300 rounded-xl px-3 py-2.5 text-foreground"
              />
            </View>
          )}

          <Text className="text-sm font-medium text-foreground mb-1.5">Full Name</Text>
          <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4">
            <UserIcon size={18} color="#9ca3af" />
            <TextInput value={name} onChangeText={setName} placeholder="Vivek Kumar Jha" className="flex-1 py-3 px-2 text-foreground" />
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
          <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4">
            <Lock size={18} color="#9ca3af" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              secureTextEntry={!showPassword}
              className="flex-1 py-3 px-2 text-foreground"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-medium text-foreground mb-1.5">Confirm Password</Text>
          <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-5">
            <Lock size={18} color="#9ca3af" />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
              className="flex-1 py-3 px-2 text-foreground"
            />
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={["#9333ea", "#2563eb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl py-3.5 items-center"
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Create Account</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-5">
            <Text className="text-muted-foreground text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text className="text-purple-600 font-semibold text-sm">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}