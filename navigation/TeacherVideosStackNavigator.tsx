import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VideoLibraryScreen from "@/screens/teacher/Videos/VideoLibraryScreen";
import FolderVideosScreen from "@/screens/teacher/Videos/FolderVideosScreen";
import TeacherVideoPlayerScreen from "@/screens/teacher/Videos/TeacherVideoPlayerScreen";
import type { TeacherVideoFolder, TeacherVideoItem } from "@/types";

export type TeacherVideosStackParamList = {
  FolderList: undefined;
  FolderVideos: { folder: TeacherVideoFolder };
  Player: { video: TeacherVideoItem; queue: TeacherVideoItem[]; folderName: string };
};

const Stack = createNativeStackNavigator<TeacherVideosStackParamList>();

export default function TeacherVideosStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FolderList" component={VideoLibraryScreen} />
      <Stack.Screen name="FolderVideos" component={FolderVideosScreen} />
      <Stack.Screen name="Player" component={TeacherVideoPlayerScreen} />
    </Stack.Navigator>
  );
}