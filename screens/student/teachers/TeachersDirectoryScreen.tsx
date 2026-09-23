import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, Image, Modal, Linking, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";
import {
  ArrowLeft, Search, Users, Activity, TrendingUp, Trophy,
  Mail, MapPin, X, Briefcase, Globe,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { DirectoryUser } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import Skeleton from "@/components/ui/Skeleton";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

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
    { icon: Users, value: teachers.length, label: "Total Teachers", accent: colors.indigo },
    { icon: Activity, value: Math.floor(teachers.length * 0.8), label: "Active Today", accent: colors.mint },
    { icon: TrendingUp, value: Math.floor(teachers.length * 0.15), label: "This Month", accent: colors.gold },
    { icon: Trophy, value: teachers.length, label: "All Time", accent: colors.coral },
  ];

  const listHeader = (
    <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <AnimatedPressable pressScale={0.9} onPress={() => navigation.goBack()} style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={18} color={colors.ink} />
        </AnimatedPressable>
        <View>
          <Text style={{ ...type.h3, color: colors.ink }}>Teacher Directory</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>View all registered teachers</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ minWidth: "45%", flex: 1 }}>
              <Card padding="sm"><Skeleton height={44} /></Card>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: 20 }}>
          {stats.map((s, idx) => (
            <View key={idx} style={{ minWidth: "45%", flex: 1 }}>
              <Card padding="sm">
                <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: `${s.accent}1F`, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm }}>
                  <s.icon size={16} color={s.accent} />
                </View>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink }}>{s.value}</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }}>{s.label}</Text>
              </Card>
            </View>
          ))}
        </View>
      )}

      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, email, location, subject…"
        leftIcon={<Search size={17} color={colors.inkFaint} />}
      />
      <View style={{ height: spacing.sm }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      {loading ? (
        <View>
          {listHeader}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <Card key={i} padding="md"><Skeleton height={72} /></Card>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          renderItem={({ item: teacher, index }) => (
            <Animated.View entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 50)} style={{ marginHorizontal: 20, marginBottom: 12 }}>
              <Card onPress={() => setSelectedTeacher(teacher)} padding="md">
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Avatar name={teacher.name ?? "Teacher"} uri={teacher.avatar} size="lg" />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }} numberOfLines={1}>{teacher.name}</Text>
                      <Badge label="Teacher" tone="brand" />
                      {teacher.isActive && <Badge label="Active" tone="success" />}
                    </View>
                    {teacher.bio ? (
                      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginBottom: 6 }} numberOfLines={2}>{teacher.bio}</Text>
                    ) : null}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                      {teacher.email && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Mail size={11} color={colors.indigo} />
                          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted }} numberOfLines={1}>{teacher.email}</Text>
                        </View>
                      )}
                      {teacher.location && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} color={colors.coral} />
                          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted }}>{teacher.location}</Text>
                        </View>
                      )}
                    </View>
                    {(teacher.qualification || teacher.experience) && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {teacher.qualification && (
                          <View style={{ backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                            <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted }}>{teacher.qualification}</Text>
                          </View>
                        )}
                        {teacher.experience && (
                          <View style={{ backgroundColor: colors.surfaceMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                            <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted }}>{teacher.experience}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: 20 }}>
              <Users size={44} color={colors.inkFaint} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, marginTop: 12 }}>No Teachers Found</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, textAlign: "center", marginTop: 4 }}>
                {searchQuery ? "Try adjusting your search" : "No teachers have registered yet"}
              </Text>
            </View>
          }
        />
      )}

      {/* Teacher detail sheet */}
      <Modal visible={!!selectedTeacher} transparent animationType="fade" onRequestClose={() => setSelectedTeacher(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(15,17,25,0.6)", justifyContent: "flex-end" }}>
          <Animated.View entering={SlideInDown.duration(280)} style={{ backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "85%" }}>
            {selectedTeacher && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Avatar name={selectedTeacher.name ?? "Teacher"} uri={selectedTeacher.avatar} size="lg" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }} numberOfLines={1}>{selectedTeacher.name}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }} numberOfLines={1}>{selectedTeacher.email}</Text>
                  </View>
                  <AnimatedPressable pressScale={0.9} onPress={() => setSelectedTeacher(null)} style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
                    <X size={17} color={colors.inkMuted} />
                  </AnimatedPressable>
                </View>

                <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
                  <SectionHeading icon={Users} label="Personal Information" />
                  <View style={{ gap: 10, marginBottom: spacing.lg }}>
                    {selectedTeacher.location && <InfoRow label="Location" value={selectedTeacher.location} />}
                    {selectedTeacher.dateOfBirth && (
                      <InfoRow label="Date of Birth" value={`${formatDate(selectedTeacher.dateOfBirth)} (Age: ${calculateAge(selectedTeacher.dateOfBirth)})`} />
                    )}
                    <InfoRow label="Member Since" value={formatDate(selectedTeacher.createdAt)} />
                  </View>

                  {selectedTeacher.bio && (
                    <View style={{ marginBottom: spacing.lg }}>
                      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, marginBottom: 3 }}>Bio</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 }}>{selectedTeacher.bio}</Text>
                    </View>
                  )}

                  {(selectedTeacher.qualification || selectedTeacher.experience || selectedTeacher.subjects || selectedTeacher.specialization) && (
                    <>
                      <SectionHeading icon={Briefcase} label="Professional Information" />
                      <View style={{ gap: 10, marginBottom: spacing.lg }}>
                        {selectedTeacher.qualification && <InfoRow label="Qualification" value={selectedTeacher.qualification} />}
                        {selectedTeacher.experience && <InfoRow label="Experience" value={selectedTeacher.experience} />}
                        {selectedTeacher.subjects && <InfoRow label="Subjects" value={selectedTeacher.subjects} />}
                        {selectedTeacher.specialization && <InfoRow label="Specialization" value={selectedTeacher.specialization} />}
                      </View>
                      {selectedTeacher.teachingStyle && (
                        <View style={{ marginBottom: spacing.lg }}>
                          <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, marginBottom: 3 }}>Teaching Style</Text>
                          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 }}>{selectedTeacher.teachingStyle}</Text>
                        </View>
                      )}
                    </>
                  )}

                  {(selectedTeacher.website || selectedTeacher.linkedin || selectedTeacher.twitter || selectedTeacher.instagram) && (
                    <>
                      <SectionHeading icon={Globe} label="Social Profiles" />
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {selectedTeacher.website && (
                          <SocialPill icon={<Globe size={14} color={colors.ink} />} label="Website" onPress={() => Linking.openURL(selectedTeacher.website!)} />
                        )}
                        {selectedTeacher.linkedin && (
                          <SocialPill icon={<FontAwesome name="linkedin" size={15} color="#0A66C2" />} label="LinkedIn" onPress={() => Linking.openURL(selectedTeacher.linkedin!)} />
                        )}
                        {selectedTeacher.twitter && (
                          <SocialPill icon={<FontAwesome name="twitter" size={15} color="#1D9BF0" />} label="Twitter" onPress={() => Linking.openURL(selectedTeacher.twitter!)} />
                        )}
                        {selectedTeacher.instagram && (
                          <SocialPill icon={<FontAwesome name="instagram" size={15} color="#D6249F" />} label="Instagram" onPress={() => Linking.openURL(selectedTeacher.instagram!)} />
                        )}
                      </View>
                    </>
                  )}
                </ScrollView>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionHeading({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
      <Icon size={15} color={colors.indigo} />
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint }}>{label}</Text>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginTop: 1 }}>{value}</Text>
    </View>
  );
}

function SocialPill({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <AnimatedPressable pressScale={0.94} onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.surfaceMuted, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.md }}>
      {icon}
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink }}>{label}</Text>
    </AnimatedPressable>
  );
}
