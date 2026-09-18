import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TeacherNavigator from "./TeacherNavigator";
import TeacherDoubtsListScreen from "@/screens/teacher/doubts/TeacherDoubtsListScreen";
import TeacherDoubtDetailScreen from "@/screens/teacher/doubts/TeacherDoubtDetailScreen";
import TeacherChatScreen from "@/screens/teacher/chat/TeacherChatScreen";
import TeacherAIAssistantScreen from "@/screens/teacher/ai/TeacherAIAssistantScreen";
import StudentsListScreen from "@/screens/teacher/students/StudentsListScreen";
import ScheduleScreen from "@/screens/teacher/schedule/ScheduleScreen";
import type { Doubt } from "@/types";
import EditProfileScreen from "@/screens/shared/EditProfileScreen";
import SettingsScreen from "@/screens/shared/SettingsScreen";
import ContactScreen from "@/screens/shared/ContactScreen";

export type TeacherRootStackParamList = {
  Tabs: undefined;
  Doubts: undefined;
  DoubtDetail: { doubt: Doubt };
  Chat: undefined;
  AIAssistant: undefined;
  Students: undefined;
  Schedule: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Contact: undefined;
};

const Stack = createNativeStackNavigator<TeacherRootStackParamList>();

export default function TeacherRootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TeacherNavigator} />
      <Stack.Screen name="Doubts" component={TeacherDoubtsListScreen} />
      <Stack.Screen name="DoubtDetail" component={TeacherDoubtDetailScreen} />
      <Stack.Screen name="Chat" component={TeacherChatScreen} />
      <Stack.Screen name="AIAssistant" component={TeacherAIAssistantScreen} />
      <Stack.Screen name="Students" component={StudentsListScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  );
}