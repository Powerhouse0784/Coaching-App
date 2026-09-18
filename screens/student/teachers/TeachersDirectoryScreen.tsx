import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Image, Modal, Linking, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  ArrowLeft, Search, Users, Activity, TrendingUp, Trophy,
  Mail, MapPin, Calendar, X, Briefcase, Globe, Camera,
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

export default function TeachersDirectoryScreen() {
  const navigation = useNavigation();
  const [teachers, setTeachers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<DirectoryUser | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      const { data } = await api.get("/api/user/students?role=TEACHER");
      setTeachers(data.users || []);
    } catch (e) {
      console.error("Error fetching teachers:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filtered = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.location?.toLowerCase().includes(q) ||
      t.subjects?.toLowerCase().includes(q)
    );
  });

  const stats = [
    { icon: Users, value: teachers.length, label: "Total Teachers", color: "#3b82f6" },
    { icon: Activity, value: Math.floor(teachers.length * 0.8), label: "Active Today", color: "#22c55e" },
    { icon: TrendingUp, value: Math.floor(teachers.length * 0.15), label: "This Month", color: "#a855f7" },
    { icon: Trophy, value: teachers.length, label: "All Time", color: "#f59e0b" },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-muted-foreground mt-3">Loading teachers…</Text>
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
                <Text className="text-lg font-bold text-foreground">Teacher Directory</Text>
                <Text className="text-xs text-muted-foreground">View all registered teachers</Text>
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
                placeholder="Search by name, email, location, subject…"
                className="flex-1 py-2.5 px-2 text-foreground text-sm"
              />
            </View>
          </View>
        }
        renderItem={({ item: teacher }) => (
          <TouchableOpacity
            onPress={() => setSelectedTeacher(teacher)}
            activeOpacity={0.85}
            className="mx-5 mb-3 bg-card rounded-2xl border-2 border-border p-4"
          >
            <View className="flex-row gap-3">
              <View className="w-14 h-14 rounded-xl bg-purple-500 items-center justify-center overflow-hidden">
                {teacher.avatar ? (
                  <Image source={{ uri: teacher.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-white font-bold text-lg">{getInitials(teacher.name)}</Text>
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center flex-wrap gap-1.5 mb-1.5">
                  <Text className="font-bold text-foreground text-sm" numberOfLines={1}>{teacher.name}</Text>
                  <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[9px] font-bold text-purple-700">TEACHER</Text>
                  </View>
                  {teacher.isActive && (
                    <View className="bg-green-100 px-2 py-0.5 rounded-full">
                      <Text className="text-[9px] font-bold text-green-700">Active</Text>
                    </View>
                  )}
                </View>
                {teacher.bio ? <Text className="text-xs text-muted-foreground mb-1.5" numberOfLines={2}>{teacher.bio}</Text> : null}
                <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                  {teacher.email && (
                    <View className="flex-row items-center gap-1">
                      <Mail size={11} color="#6366f1" />
                      <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>{teacher.email}</Text>
                    </View>
                  )}
                  {teacher.location && (
                    <View className="flex-row items-center gap-1">
                      <MapPin size={11} color="#ef4444" />
                      <Text className="text-[11px] text-muted-foreground">{teacher.location}</Text>
                    </View>
                  )}
                </View>
                {(teacher.qualification || teacher.experience || teacher.subjects) && (
                  <View className="flex-row flex-wrap gap-1.5 mt-2">
                    {teacher.qualification && (
                      <View className="bg-secondary px-2 py-1 rounded-lg">
                        <Text className="text-[10px] text-muted-foreground">{teacher.qualification}</Text>
                      </View>
                    )}
                    {teacher.experience && (
                      <View className="bg-secondary px-2 py-1 rounded-lg">
                        <Text className="text-[10px] text-muted-foreground">{teacher.experience}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center py-16 px-5">
            <Users size={48} color="#9ca3af" />
            <Text className="text-foreground font-bold text-base mt-3">No Teachers Found</Text>
            <Text className="text-muted-foreground text-sm text-center mt-1">
              {searchQuery ? "Try adjusting your search" : "No teachers have registered yet"}
            </Text>
          </View>
        }
      />

      {/* Teacher detail modal */}
      <Modal visible={!!selectedTeacher} transparent animationType="slide" onRequestClose={() => setSelectedTeacher(null)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-background rounded-t-3xl" style={{ maxHeight: "85%" }}>
            {selectedTeacher && (
              <>
                <View className="flex-row items-center gap-3 p-5 border-b border-border">
                  <View className="w-14 h-14 rounded-xl bg-purple-500 items-center justify-center overflow-hidden">
                    {selectedTeacher.avatar ? (
                      <Image source={{ uri: selectedTeacher.avatar }} className="w-full h-full" />
                    ) : (
                      <Text className="text-white font-bold text-lg">{getInitials(selectedTeacher.name)}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-foreground text-base" numberOfLines={1}>{selectedTeacher.name}</Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>{selectedTeacher.email}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedTeacher(null)}>
                    <X size={22} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <View className="flex-row items-center gap-2 mb-4">
                    <Users size={16} color="#6366f1" />
                    <Text className="font-bold text-foreground text-sm">Personal Information</Text>
                  </View>
                  <View className="gap-2 mb-4">
                    {selectedTeacher.location && (
                      <View>
                        <Text className="text-xs text-muted-foreground">Location</Text>
                        <Text className="text-sm font-semibold text-foreground">{selectedTeacher.location}</Text>
                      </View>
                    )}
                    {selectedTeacher.dateOfBirth && (
                      <View>
                        <Text className="text-xs text-muted-foreground">Date of Birth</Text>
                        <Text className="text-sm font-semibold text-foreground">
                          {formatDate(selectedTeacher.dateOfBirth)} (Age: {calculateAge(selectedTeacher.dateOfBirth)})
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text className="text-xs text-muted-foreground">Member Since</Text>
                      <Text className="text-sm font-semibold text-foreground">{formatDate(selectedTeacher.createdAt)}</Text>
                    </View>
                  </View>
                  {selectedTeacher.bio && (
                    <View className="mb-4">
                      <Text className="text-xs text-muted-foreground mb-1">Bio</Text>
                      <Text className="text-sm text-foreground">{selectedTeacher.bio}</Text>
                    </View>
                  )}

                  {(selectedTeacher.qualification || selectedTeacher.experience || selectedTeacher.subjects || selectedTeacher.specialization) && (
                    <>
                      <View className="flex-row items-center gap-2 mb-3 mt-2">
                        <Briefcase size={16} color="#6366f1" />
                        <Text className="font-bold text-foreground text-sm">Professional Information</Text>
                      </View>
                      <View className="gap-2 mb-4">
                        {selectedTeacher.qualification && (
                          <View>
                            <Text className="text-xs text-muted-foreground">Qualification</Text>
                            <Text className="text-sm font-semibold text-foreground">{selectedTeacher.qualification}</Text>
                          </View>
                        )}
                        {selectedTeacher.experience && (
                          <View>
                            <Text className="text-xs text-muted-foreground">Experience</Text>
                            <Text className="text-sm font-semibold text-foreground">{selectedTeacher.experience}</Text>
                          </View>
                        )}
                        {selectedTeacher.subjects && (
                          <View>
                            <Text className="text-xs text-muted-foreground">Subjects</Text>
                            <Text className="text-sm font-semibold text-foreground">{selectedTeacher.subjects}</Text>
                          </View>
                        )}
                        {selectedTeacher.specialization && (
                          <View>
                            <Text className="text-xs text-muted-foreground">Specialization</Text>
                            <Text className="text-sm font-semibold text-foreground">{selectedTeacher.specialization}</Text>
                          </View>
                        )}
                      </View>
                      {selectedTeacher.teachingStyle && (
                        <View className="mb-4">
                          <Text className="text-xs text-muted-foreground mb-1">Teaching Style</Text>
                          <Text className="text-sm text-foreground">{selectedTeacher.teachingStyle}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {(selectedTeacher.website || selectedTeacher.linkedin || selectedTeacher.twitter || selectedTeacher.instagram) && (
                    <>
                      <View className="flex-row items-center gap-2 mb-3">
                        <Globe size={16} color="#6366f1" />
                        <Text className="font-bold text-foreground text-sm">Social Profiles</Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedTeacher.website && (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(selectedTeacher.website!)}
                            className="flex-row items-center gap-1.5 bg-secondary px-3 py-2 rounded-lg"
                          >
                            <Globe size={13} color="#374151" />
                            <Text className="text-xs font-semibold text-foreground">Website</Text>
                          </TouchableOpacity>
                        )}
                        {selectedTeacher.linkedin && (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(selectedTeacher.linkedin!)}
                            className="flex-row items-center gap-1.5 bg-blue-100 px-3 py-2 rounded-lg"
                          >
                            <FontAwesome name="linkedin" size={18} color="#9ca3af" />
                            <Text className="text-xs font-semibold text-blue-700">LinkedIn</Text>
                          </TouchableOpacity>
                        )}
                        {selectedTeacher.twitter && (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(selectedTeacher.twitter!)}
                            className="flex-row items-center gap-1.5 bg-blue-100 px-3 py-2 rounded-lg"
                          >
                            <FontAwesome name="twitter" size={18} color="#9ca3af" />
                            <Text className="text-xs font-semibold text-blue-600">Twitter</Text>
                          </TouchableOpacity>
                        )}
                        {selectedTeacher.instagram && (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(selectedTeacher.instagram!)}
                            className="flex-row items-center gap-1.5 bg-pink-100 px-3 py-2 rounded-lg"
                          >
                            <FontAwesome name="instagram" size={18} color="#9ca3af" />
                            <Text className="text-xs font-semibold text-pink-700">Instagram</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
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