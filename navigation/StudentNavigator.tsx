import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, BookOpen, FileText, Play, Mail } from "lucide-react-native";
import type { StudentTabParamList } from "./types";
import StudentDashboardScreen from "@/screens/student/DashboardScreen";
import StudentProfileScreen from "@/screens/student/ProfileScreen";
import NotesScreen from "@/screens/student/NotesScreen";
import { View, Text } from "react-native";
import AssignmentsScreen from "@/screens/student/AssignmentsScreen";
import VideosStackNavigator from "@/navigation/VideosStackNavigator";
import ContactScreen from "@/screens/shared/ContactScreen";

const Placeholder = ({ label }: { label: string }) => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-foreground">{label} — coming soon</Text>
  </View>
);

const Tab = createBottomTabNavigator<StudentTabParamList>();

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={StudentDashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{ tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosStackNavigator}
        options={{ tabBarIcon: ({ color, size }) => <Play color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{ tabBarIcon: ({ color, size }) => <Mail color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}