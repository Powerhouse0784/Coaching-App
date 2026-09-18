import { View, Text, TouchableOpacity, FlatList,  Image } from "react-native";
import { ArrowLeft, Play, CheckCircle, Eye } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { VideosStackParamList } from "@/navigation/VideosStackNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
type Nav = NativeStackNavigationProp<VideosStackParamList, "FolderDetail">;
type Rt = RouteProp<VideosStackParamList, "FolderDetail">;

export default function FolderDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { folder } = useRoute<Rt>().params;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-5 pt-2 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="font-bold text-foreground text-base" numberOfLines={1}>{folder.name}</Text>
          <Text className="text-xs text-muted-foreground">{folder.videoCount} videos · {folder.totalDuration}</Text>
        </View>
      </View>

      <FlatList
        data={folder.videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item: video, index }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("Player", { video, folderName: folder.name })}
            activeOpacity={0.85}
            className="flex-row bg-card rounded-2xl border border-border overflow-hidden mb-3"
          >
            <View className="w-28 h-20 bg-rose-50">
              {video.thumbnail ? (
                <Image source={{ uri: video.thumbnail }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Play size={20} color="#fda4af" />
                </View>
              )}
              {video.watchedPercentage > 0 && (
                <View className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <View className="h-full bg-rose-500" style={{ width: `${video.watchedPercentage}%` }} />
                </View>
              )}
            </View>

            <View className="flex-1 p-3 justify-center">
              <Text className="text-[10px] text-muted-foreground mb-0.5">
                {index + 1}. {video.duration}
              </Text>
              <Text className="font-semibold text-foreground text-sm" numberOfLines={2}>{video.title}</Text>
              <View className="flex-row items-center gap-3 mt-1.5">
                {video.watched ? (
                  <View className="flex-row items-center gap-1">
                    <CheckCircle size={11} color="#22c55e" />
                    <Text className="text-[10px] text-green-600 font-semibold">Watched</Text>
                  </View>
                ) : video.watchedPercentage > 0 ? (
                  <Text className="text-[10px] text-orange-500 font-semibold">{Math.round(video.watchedPercentage)}% watched</Text>
                ) : null}
                <View className="flex-row items-center gap-1">
                  <Eye size={11} color="#9ca3af" />
                  <Text className="text-[10px] text-muted-foreground">{video.views}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}