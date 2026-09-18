import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Camera, Save, Info } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import { pickAndUploadImage } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import type { ProfileData } from "@/types";

type Tab = "basic" | "professional" | "social";

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
      const { data } = await api.put("/api/user/profile", {
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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "basic", label: "Basic Info" },
    { id: "professional", label: "Professional" },
    { id: "social", label: "Social Profiles" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="flex-row items-center gap-3 px-5 pt-2 pb-3 border-b border-border">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
            <ArrowLeft size={18} color="#374151" />
          </TouchableOpacity>
          <Text className="font-bold text-foreground text-base">Edit Profile</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Avatar */}
          <View className="items-center mb-5">
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} className="relative">
              <View className="w-24 h-24 rounded-full bg-indigo-500 items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                ) : (
                  <Text className="text-white font-bold text-3xl">{name?.charAt(0).toUpperCase() || "?"}</Text>
                )}
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full items-center justify-center border-2 border-background">
                {uploadingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-muted-foreground mt-2">Tap to change photo</Text>
          </View>

          {/* Tabs */}
          <View className="flex-row bg-secondary rounded-xl p-1 mb-5">
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTab(t.id)}
                className="flex-1 items-center py-2.5 rounded-lg"
                style={{ backgroundColor: tab === t.id ? "#6366f1" : "transparent" }}
              >
                <Text className={`text-xs font-semibold ${tab === t.id ? "text-white" : "text-muted-foreground"}`}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === "basic" && (
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Full Name</Text>
                <TextInput value={name} onChangeText={setName} className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Email</Text>
                <TextInput value={profile?.email} editable={false} className="border-2 border-border rounded-xl px-3 py-2.5 text-muted-foreground text-sm bg-secondary" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Phone</Text>
                <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Location</Text>
                <TextInput value={location} onChangeText={setLocation} placeholder="City, State" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Date of Birth</Text>
                <TextInput value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Bio</Text>
                <TextInput
                  value={bio} onChangeText={setBio} multiline numberOfLines={4}
                  placeholder="Tell us a bit about yourself…"
                  className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  style={{ textAlignVertical: "top", minHeight: 90 }}
                />
              </View>
            </View>
          )}

          {tab === "professional" && (
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Qualification</Text>
                <TextInput value={qualification} onChangeText={setQualification} placeholder="e.g., M.Sc Physics" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Experience</Text>
                <TextInput value={experience} onChangeText={setExperience} placeholder="e.g., 5 years" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Subjects</Text>
                <TextInput value={subjects} onChangeText={setSubjects} placeholder="e.g., Physics, Mathematics" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Specialization</Text>
                <TextInput value={specialization} onChangeText={setSpecialization} className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Teaching Style</Text>
                <TextInput
                  value={teachingStyle} onChangeText={setTeachingStyle} multiline numberOfLines={3}
                  className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                  style={{ textAlignVertical: "top", minHeight: 70 }}
                />
              </View>
            </View>
          )}

          {tab === "social" && (
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Website</Text>
                <TextInput value={website} onChangeText={setWebsite} autoCapitalize="none" placeholder="https://…" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">LinkedIn</Text>
                <TextInput value={linkedin} onChangeText={setLinkedin} autoCapitalize="none" placeholder="https://linkedin.com/in/…" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Twitter / X</Text>
                <TextInput value={twitter} onChangeText={setTwitter} autoCapitalize="none" placeholder="https://x.com/…" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-foreground mb-1.5">Instagram</Text>
                <TextInput value={instagram} onChangeText={setInstagram} autoCapitalize="none" placeholder="https://instagram.com/…" className="border-2 border-border rounded-xl px-3 py-2.5 text-foreground text-sm" />
              </View>

              <View className="flex-row gap-2.5 bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3.5 mt-2">
                <Info size={16} color="#6366f1" style={{ marginTop: 2 }} />
                <Text className="text-xs text-indigo-700 flex-1">
                  {isTeacher
                    ? "Adding your social profiles helps students and parents learn more about your teaching approach and credentials."
                    : "Connect your social profiles to showcase your personality and interests!"}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="flex-row gap-3 p-5 border-t border-border">
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving} className="flex-1 border-2 border-border rounded-xl py-3 items-center">
            <Text className="font-semibold text-foreground text-sm">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="flex-1 bg-indigo-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Save size={15} color="#fff" />
                <Text className="text-white font-semibold text-sm">Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}