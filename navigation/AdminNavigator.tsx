import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AdminStackParamList } from "./types";
import { View, Text } from "react-native";

const Placeholder = ({ label }: { label: string }) => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-foreground">{label} — coming soon</Text>
  </View>
);

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Dashboard" children={() => <Placeholder label="Admin Dashboard" />} />
      <Stack.Screen name="Users" children={() => <Placeholder label="Users" />} />
      <Stack.Screen name="Payments" children={() => <Placeholder label="Payments" />} />
      <Stack.Screen name="Videos" children={() => <Placeholder label="Videos" />} />
      <Stack.Screen name="Notes" children={() => <Placeholder label="Notes" />} />
      <Stack.Screen name="DoubtsAdmin" children={() => <Placeholder label="Doubts" />} />
      <Stack.Screen name="AssignmentsAdmin" children={() => <Placeholder label="Assignments" />} />
    </Stack.Navigator>
  );
}