import { useState, useEffect } from "react";
import {
  View, Text, TextInput, ScrollView, ActivityIndicator, Alert,
  Image, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Camera, Save, Info } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { pickAndUploadImage } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import type { ProfileData } from "@/types";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Tab = "basic" | "professional" | "social";

const fieldStyle = {
  borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
  paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.ink,
  fontFamily: fonts.body, fontSize: 14, backgroundColor: colors.surface,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const currentUser = useAuthStore((s) => s.user);
  const isTeacher = currentUser?.role === "TEACHER";

  const [tab, setTab] = useState<Tab>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [subjects, setSubjects] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [teachingStyle, setTeachingStyle] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/user/profile`);
        const p: ProfileData = data.user || data;
        setProfile(p);
        setAvatarUrl(p.avatar);
        setName(p.name || "");
        setPhone(p.phone || "");
        setBio(p.bio || "");
        setLocation(p.location || "");
        setDateOfBirth(p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "");
        setQualification(p.qualification || "");
        setExperience(p.experience || "");
        setSubjects(p.subjects || "");
        setSpecialization(p.specialization || "");
        setTeachingStyle(p.teachingStyle || "");
        setWebsite(p.website || "");
        setLinkedin(p.linkedin || "");
        setTwitter(p.twitter || "");
        setInstagram(p.instagram || "");
      } catch (e) {
        console.error("Error fetching profile:", e);
        Alert.alert("Error", "Failed to load your profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePickAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const result = await pickAndUploadImage();
      if (result) setAvatarUrl(result.url);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/user/profile", {
        name, phone, bio, location, dateOfBirth: dateOfBirth || null,
        qualification, experience, subjects, specialization, teachingStyle,
        website, linkedin, twitter, instagram,
        avatar: avatarUrl,
      });
      Alert.alert("Saved", "Your profile has been updated", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.indigo} />
      </SafeAreaView>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "basic", label: "Basic Info" },
    { id: "professional", label: "Professional" },
    { id: "social", label: "Social" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <AnimatedPressable
            pressScale={0.9}
            onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={18} color={colors.ink} />
          </AnimatedPressable>
          <Text style={{ ...type.h3, fontSize: 16, color: colors.ink }}>Edit Profile</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
            <AnimatedPressable pressScale={0.95} onPress={handlePickAvatar} disabled={uploadingAvatar} style={{ position: "relative" }}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={{ color: colors.white, fontFamily: fonts.displayBold, fontSize: 34 }}>{name?.charAt(0).toUpperCase() || "?"}</Text>
                )}
              </View>
              <View style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: colors.paper }}>
                {uploadingAvatar ? <ActivityIndicator size="small" color={colors.white} /> : <Camera size={14} color={colors.white} />}
              </View>
            </AnimatedPressable>
            <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: spacing.sm }}>Tap to change photo</Text>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3, marginBottom: spacing.xl }}>
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <AnimatedPressable
                  key={t.id}
                  pressScale={0.97}
                  onPress={() => setTab(t.id)}
                  style={{ flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radius.sm, backgroundColor: active ? colors.indigo : "transparent" }}
                >
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: active ? colors.white : colors.inkMuted }}>{t.label}</Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {tab === "basic" && (
            <View>
              <Field label="Full Name">
                <TextInput value={name} onChangeText={setName} style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Email">
                <TextInput value={profile?.email} editable={false} style={[fieldStyle, { color: colors.inkMuted, backgroundColor: colors.surfaceMuted }]} />
              </Field>
              <Field label="Phone">
                <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Location">
                <TextInput value={location} onChangeText={setLocation} placeholder="City, State" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Date of Birth">
                <TextInput value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Bio">
                <TextInput
                  value={bio} onChangeText={setBio} multiline numberOfLines={4}
                  placeholder="Tell us a bit about yourself…"
                  style={[fieldStyle, { textAlignVertical: "top", minHeight: 90 }]}
                  placeholderTextColor={colors.inkFaint}
                />
              </Field>
            </View>
          )}

          {tab === "professional" && (
            <View>
              <Field label="Qualification">
                <TextInput value={qualification} onChangeText={setQualification} placeholder="e.g., M.Sc Physics" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Experience">
                <TextInput value={experience} onChangeText={setExperience} placeholder="e.g., 5 years" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Subjects">
                <TextInput value={subjects} onChangeText={setSubjects} placeholder="e.g., Physics, Mathematics" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Specialization">
                <TextInput value={specialization} onChangeText={setSpecialization} style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Teaching Style">
                <TextInput
                  value={teachingStyle} onChangeText={setTeachingStyle} multiline numberOfLines={3}
                  style={[fieldStyle, { textAlignVertical: "top", minHeight: 70 }]}
                  placeholderTextColor={colors.inkFaint}
                />
              </Field>
            </View>
          )}

          {tab === "social" && (
            <View>
              <Field label="Website">
                <TextInput value={website} onChangeText={setWebsite} autoCapitalize="none" placeholder="https://…" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="LinkedIn">
                <TextInput value={linkedin} onChangeText={setLinkedin} autoCapitalize="none" placeholder="https://linkedin.com/in/…" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Twitter / X">
                <TextInput value={twitter} onChangeText={setTwitter} autoCapitalize="none" placeholder="https://x.com/…" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>
              <Field label="Instagram">
                <TextInput value={instagram} onChangeText={setInstagram} autoCapitalize="none" placeholder="https://instagram.com/…" style={fieldStyle} placeholderTextColor={colors.inkFaint} />
              </Field>

              <View style={{ flexDirection: "row", gap: 10, backgroundColor: colors.indigoTint, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm }}>
                <Info size={16} color={colors.indigo} style={{ marginTop: 2 }} />
                <Text style={{ ...type.caption, color: colors.indigoDark, flex: 1, lineHeight: 17 }}>
                  {isTeacher
                    ? "Adding your social profiles helps students and parents learn more about your teaching approach and credentials."
                    : "Connect your social profiles to showcase your personality and interests!"}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} disabled={saving} style={{ flex: 1 }} />
          <Button label="Save Changes" icon={Save} onPress={handleSave} disabled={saving} loading={saving} style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
