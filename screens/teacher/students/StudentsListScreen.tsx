import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Search, Users, Activity, TrendingUp, Trophy,
  Mail, MapPin, Calendar, X, Phone,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { DirectoryUser } from "@/types";

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
}

function formatDate(d: string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function calculateAge(dob: string | null) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function StudentsListScreen() {
  const navigation = useNavigation();
  const [students, setStudents] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<DirectoryUser | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get("/api/user/students?role=STUDENT");
      setStudents(data.users || []);
    } catch (e) {
      console.error("Error fetching students:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    );
  });

  const stats = [
    { icon: Users, value: students.length, label: "Total Students", color: "#3b82f6" },
    { icon: Activity, value: Math.floor(students.length * 0.8), label: "Active Today", color: "#22c55e" },
    { icon: TrendingUp, value: Math.floor(students.length * 0.15), label: "This Month", color: "#a855f7" },
    { icon: Trophy, value: students.length, label: "All Time", color: "#f59e0b" },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-muted-foreground mt-3">Loading students…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="px-5 pt-2">
            <View className="flex-row items-center gap-3 mb-4">
              <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
                <ArrowLeft size={18} color="#374151" />
              </TouchableOpacity>
              <View>
                <Text className="text-lg font-bold text-foreground">Students</Text>
                <Text className="text-xs text-muted-foreground">Monitor progress, attendance, and performance</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-3 mb-4">
              {stats.map((s, idx) => (
                <View key={idx} className="bg-card rounded-2xl p-3 border border-border" style={{ minWidth: "45%" }}>
                  <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: `${s.color}20` }}>
                    <s.icon size={16} color={s.color} />
                  </View>
                  <Text className="text-lg font-bold text-foreground">{s.value}</Text>
                  <Text className="text-xs text-muted-foreground">{s.label}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4 bg-card">
              <Search size={16} color="#9ca3af" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name, email, phone, location…"
                className="flex-1 py-2.5 px-2 text-foreground text-sm"
              />
            </View>

            <Text className="text-xs text-muted-foreground mb-3">Showing {filtered.length} students</Text>
          </View>
        }
        renderItem={({ item: student }) => (
          <TouchableOpacity
            onPress={() => setSelectedStudent(student)}
            activeOpacity={0.85}
            className="mx-5 mb-3 bg-card rounded-2xl border-2 border-border p-4"
          >
            <View className="flex-row gap-3">
              <View className="w-14 h-14 rounded-xl bg-indigo-500 items-center justify-center overflow-hidden">
                {student.avatar ? (
                  <Image source={{ uri: student.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-white font-bold text-lg">{getInitials(student.name)}</Text>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center flex-wrap gap-1.5 mb-1.5">
                  <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{student.name}</Text>
                  <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[9px] font-bold text-blue-700">STUDENT</Text>
                  </View>
                  {student.isActive && (
                    <View className="bg-green-100 px-2 py-0.5 rounded-full">
                      <Text className="text-[9px] font-bold text-green-700">Active</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center gap-1 mb-1">
                  <Mail size={11} color="#6366f1" />
                  <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>{student.email}</Text>
                </View>
                <Text className="text-[10px] text-muted-foreground">Joined {formatDate(student.createdAt)}</Text>
              </View>
              <View className="justify-center">
                <View className="bg-indigo-600 px-3 py-2 rounded-xl">
                  <Text className="text-white text-[10px] font-bold">View Profile</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <Users size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No Students Found</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">
              {searchQuery ? "Try adjusting your search" : "No students have enrolled yet"}
            </Text>
          </View>
        }
      />

      <Modal visible={!!selectedStudent} transparent animationType="slide" onRequestClose={() => setSelectedStudent(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: "85%" }}>
            {selectedStudent && (
              <>
                <View className="flex-row items-center gap-3 p-5 border-b border-border">
                  <View className="w-14 h-14 rounded-xl bg-indigo-500 items-center justify-center overflow-hidden">
                    {selectedStudent.avatar ? (
                      <Image source={{ uri: selectedStudent.avatar }} className="w-full h-full" />
                    ) : (
                      <Text className="text-white font-bold text-lg">{getInitials(selectedStudent.name)}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground text-base" numberOfLines={1}>{selectedStudent.name}</Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>{selectedStudent.email}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedStudent(null)}>
                    <X size={22} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <View className="flex-row items-center gap-2 mb-4">
                    <Users size={16} color="#6366f1" />
                    <Text className="font-bold text-foreground text-sm">Personal Information</Text>
                  </View>
                  <View className="gap-3 mb-4">
                    {selectedStudent.phone && (
                      <View className="flex-row items-center gap-3 bg-secondary rounded-xl p-3">
                        <Phone size={16} color="#9ca3af" />
                        <View>
                          <Text className="text-xs text-muted-foreground">Phone</Text>
                          <Text className="text-sm font-semibold text-foreground">{selectedStudent.phone}</Text>
                        </View>
                      </View>
                    )}
                    {selectedStudent.location && (
                      <View className="flex-row items-center gap-3 bg-secondary rounded-xl p-3">
                        <MapPin size={16} color="#9ca3af" />
                        <View>
                          <Text className="text-xs text-muted-foreground">Location</Text>
                          <Text className="text-sm font-semibold text-foreground">{selectedStudent.location}</Text>
                        </View>
                      </View>
                    )}
                    {selectedStudent.dateOfBirth && (
                      <View className="flex-row items-center gap-3 bg-secondary rounded-xl p-3">
                        <Calendar size={16} color="#9ca3af" />
                        <View>
                          <Text className="text-xs text-muted-foreground">Date of Birth</Text>
                          <Text className="text-sm font-semibold text-foreground">
                            {formatDate(selectedStudent.dateOfBirth)} (Age: {calculateAge(selectedStudent.dateOfBirth)})
                          </Text>
                        </View>
                      </View>
                    )}
                    <View className="flex-row items-center gap-3 bg-secondary rounded-xl p-3">
                      <Calendar size={16} color="#9ca3af" />
                      <View>
                        <Text className="text-xs text-muted-foreground">Member Since</Text>
                        <Text className="text-sm font-semibold text-foreground">{formatDate(selectedStudent.createdAt)}</Text>
                      </View>
                    </View>
                  </View>
                  {selectedStudent.bio && (
                    <View>
                      <Text className="text-xs text-muted-foreground mb-1">Bio</Text>
                      <Text className="text-sm text-foreground">{selectedStudent.bio}</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}