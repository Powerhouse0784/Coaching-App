import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, BookOpen, FileText, Video, Mail } from "lucide-react-native";
import type { TeacherTabParamList } from "./types";
import TeacherDashboardScreen from "@/screens/teacher/DashboardScreen";
import { View, Text } from "react-native";
import NotesManagerScreen from "@/screens/teacher/NotesManagerScreen";
import AssignmentsManagerScreen from "@/screens/teacher/AssignmentsManagerScreen";
import TeacherVideosStackNavigator from "@/navigation/TeacherVideosStackNavigator";
import ContactScreen from "@/screens/shared/ContactScreen";

const Placeholder = ({ label }: { label: string }) => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-foreground">{label} — coming soon</Text>
  </View>
);

const Tab = createBottomTabNavigator<TeacherTabParamList>();

export default function TeacherNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#a855f7",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TeacherDashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesManagerScreen}
        options={{ tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Assignments"
        component={AssignmentsManagerScreen}
        options={{ tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }}
      />
      <Tab.Screen
        name="VideoLibrary"
        component={TeacherVideosStackNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Video color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{ tabBarIcon: ({ color, size }) => <Mail color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}