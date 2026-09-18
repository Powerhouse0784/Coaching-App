import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StudentNavigator from "./StudentNavigator";
import QuizScreen from "@/screens/student/QuizScreen";
import DoubtsListScreen from "@/screens/student/doubts/DoubtsListScreen";
import DoubtDetailScreen from "@/screens/student/doubts/DoubtDetailScreen";
import PaymentsScreen from "@/screens/student/payments/PaymentsScreen";
import StudyPlannerScreen from "@/screens/student/study-planner/StudyPlannerScreen";
import TeachersDirectoryScreen from "@/screens/student/teachers/TeachersDirectoryScreen";
import type { Doubt } from "@/types";
import EditProfileScreen from "@/screens/shared/EditProfileScreen";
import SettingsScreen from "@/screens/shared/SettingsScreen";
import ContactScreen from "@/screens/shared/ContactScreen";

export type StudentRootStackParamList = {
  Tabs: undefined;
  Quiz: undefined;
  Doubts: undefined;
  DoubtDetail: { doubt: Doubt };
  Payments: undefined;
  StudyPlanner: undefined;
  Teachers: undefined;
  EditProfile: undefined;
  Settings: undefined;  
  Contact: undefined;
};

const Stack = createNativeStackNavigator<StudentRootStackParamList>();

export default function StudentRootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={StudentNavigator} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="Doubts" component={DoubtsListScreen} />
      <Stack.Screen name="DoubtDetail" component={DoubtDetailScreen} />
      <Stack.Screen name="Payments" component={PaymentsScreen} />
      <Stack.Screen name="StudyPlanner" component={StudyPlannerScreen} />
      <Stack.Screen name="Teachers" component={TeachersDirectoryScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  );
}