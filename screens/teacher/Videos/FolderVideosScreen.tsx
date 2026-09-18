import { View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Eye, Play  } from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TeacherVideosStackParamList } from "@/navigation/TeacherVideosStackNavigator";
import { Linking } from "react-native";

type Nav = NativeStackNavigationProp<TeacherVideosStackParamList, "FolderVideos">;
type Rt = RouteProp<TeacherVideosStackParamList, "FolderVideos">;

export default function FolderVideosScreen() {
  const navigation = useNavigation<Nav>();
  const { folder } = useRoute<Rt>().params;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-bold text-foreground text-base" numberOfLines={1}>{folder.name}</Text>
            {folder.youtubePlaylistId && (
              <View className="flex-row items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded-full">
                <Play  size={9} color="#fff" />
                <Text className="text-white text-[9px] font-bold">YT</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-muted-foreground">{folder.videoCount} videos · {folder.chapter}</Text>
        </View>
      </View>

      <FlatList
        data={folder.videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item: video, index }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("Player", { video, queue: folder.videos, folderName: folder.name })}
            activeOpacity={0.85}
            className="flex-row bg-card rounded-2xl border border-border overflow-hidden mb-3"
          >
            <View className="w-28 h-20 bg-red-50 relative">
              {video.thumbnail ? (
                <Image source={{ uri: video.thumbnail }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Play size={20} color="#fca5a5" />
                </View>
              )}
              <View className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded">
                <Text className="text-white text-[9px] font-semibold">{video.duration}</Text>
              </View>
            </View>

            <View className="flex-1 p-3 justify-center">
              <Text className="text-[10px] text-muted-foreground mb-0.5">{index + 1}.</Text>
              <Text className="font-semibold text-foreground text-sm mb-1.5" numberOfLines={2}>{video.title}</Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Eye size={11} color="#9ca3af" />
                  <Text className="text-[10px] text-muted-foreground">{video.views.toLocaleString()}</Text>
                </View>
                <Text className="text-[10px] text-muted-foreground">{video.uniqueViewers} unique</Text>
                <Text className="text-[10px] text-muted-foreground">{video.totalWatchTime} watched</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.videoUrl}`)}
              className="items-center justify-center px-3"
            >
              <Play  size={18} color="#ef4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Play size={40} color="#9ca3af" />
            <Text className="text-foreground font-semibold mt-3">No videos found</Text>
            {folder.youtubePlaylistId && (
              <Text className="text-muted-foreground text-xs text-center mt-1">
                Linked to YouTube — go to the "YouTube Sync" tab and tap Sync Now.
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}