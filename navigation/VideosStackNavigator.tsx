import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FolderListScreen from "@/screens/student/videos/FolderListScreen";
import FolderDetailScreen from "@/screens/student/videos/FolderDetailScreen";
import VideoPlayerScreen from "@/screens/student/videos/VideoPlayerScreen";
import type { VideoFolder, VideoItem } from "@/types";

export type VideosStackParamList = {
  FolderList: undefined;
  FolderDetail: { folder: VideoFolder };
  Player: { video: VideoItem; folderName: string };
};

const Stack = createNativeStackNavigator<VideosStackParamList>();

export default function VideosStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FolderList" component={FolderListScreen} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
      <Stack.Screen name="Player" component={VideoPlayerScreen} />
    </Stack.Navigator>
  );
}