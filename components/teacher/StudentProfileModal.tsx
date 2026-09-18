import { View, Text, TouchableOpacity, Modal, ScrollView, Image } from "react-native";
import { X, Phone, MapPin, Cake } from "lucide-react-native";
import type { TeacherStudentProfile } from "@/types";

interface Props {
  student: TeacherStudentProfile | null;
  onClose: () => void;
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

export default function StudentProfileModal({ student, onClose }: Props) {
  return (
    <Modal visible={!!student} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 items-center justify-center px-5">
        <View className="w-full bg-card rounded-3xl overflow-hidden" style={{ maxHeight: "80%" }}>
          {student && (
            <>
              <View className="flex-row items-center justify-between p-5 border-b border-border bg-purple-50">
                <Text className="text-lg font-bold text-foreground">Student Profile</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View className="items-center mb-5">
                  <View className="w-20 h-20 rounded-full bg-purple-500 items-center justify-center overflow-hidden mb-3">
                    {student.avatar ? (
                      <Image source={{ uri: student.avatar }} className="w-full h-full" />
                    ) : (
                      <Text className="text-white font-bold text-2xl">{student.name?.charAt(0).toUpperCase() ?? "?"}</Text>
                    )}
                  </View>
                  <Text className="font-bold text-foreground text-lg">{student.name || "Unknown"}</Text>
                  <Text className="text-sm text-muted-foreground">{student.email}</Text>
                </View>

                <View className="gap-3">
                  {student.phone && (
                    <View className="flex-row items-center gap-3 bg-secondary rounded-xl p-3">
                      <Phone size={18} color="#9ca3af" />
                      <View>
                        <Text className="text-xs text-muted-foreground">Phone</Text>
                        <Text className="font-semibold text-sm text-foreground">{student.phone}</Text>
                      </View>
                    </View>
                  )}
                  {student.location && (
                    <View className="flex-row items-center gap-3 bg-secondary rounded-xl p-3">
                      <MapPin size={18} color="#9ca3af" />
                      <View>
                        <Text className="text-xs text-muted-foreground">Location</Text>
                        <Text className="font-semibold text-sm text-foreground">{student.location}</Text>
                      </View>
                    </View>
                  )}
                  {student.dateOfBirth && (
                    <View className="flex-row items-center gap-3 bg-secondary rounded-xl p-3">
                      <Cake size={18} color="#9ca3af" />
                      <View>
                        <Text className="text-xs text-muted-foreground">Age</Text>
                        <Text className="font-semibold text-sm text-foreground">{calculateAge(student.dateOfBirth)} years old</Text>
                      </View>
                    </View>
                  )}
                  {student.bio && (
                    <View className="bg-secondary rounded-xl p-3">
                      <Text className="text-xs text-muted-foreground mb-1">Bio</Text>
                      <Text className="text-sm text-foreground">{student.bio}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}