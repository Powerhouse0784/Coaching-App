import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import AuthNavigator from "./AuthNavigator";
import StudentRootNavigator from "./StudentRootNavigator";
import TeacherNavigator from "./TeacherNavigator";
import AdminNavigator from "./AdminNavigator";
import TeacherRootNavigator from "./TeacherRootNavigator";


export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const viewMode = useUIStore((s) => s.viewMode);

  let content;
  if (!user) {
    content = <AuthNavigator />;
  } else if (user.role === "ADMIN") {
    content = <AdminNavigator />;
  } else if (user.role === "TEACHER") {
    content = viewMode === "teacher" ? <TeacherRootNavigator /> : <StudentRootNavigator />;
  } else {
    content = <StudentRootNavigator />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
}