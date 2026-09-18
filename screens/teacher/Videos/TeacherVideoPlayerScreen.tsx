import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, SkipBack, SkipForward, List, X, Play, ExternalLink } from "lucide-react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TeacherVideosStackParamList } from "@/navigation/TeacherVideosStackNavigator";

type Nav = NativeStackNavigationProp<TeacherVideosStackParamList, "Player">;
type Rt = RouteProp<TeacherVideosStackParamList, "Player">;
type YouTubePlayerState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "video cued";

const { width } = Dimensions.get("window");
const PLAYER_HEIGHT = (width * 9) / 16;

export default function TeacherVideoPlayerScreen() {
  const navigation = useNavigation<Nav>();
  const { video, queue, folderName } = useRoute<Rt>().params;
  const [showQueue, setShowQueue] = useState(false);
  const [playing, setPlaying] = useState(true);

  const currentIndex = queue.findIndex((v) => v.id === video.id);
  const nextVideo = currentIndex >= 0 && currentIndex < queue.length - 1 ? queue[currentIndex + 1] : null;
  const prevVideo = currentIndex > 0 ? queue[currentIndex - 1] : null;

  const goTo = useCallback(
    (v: typeof video) => {
      setShowQueue(false);
      navigation.setParams({ video: v, queue, folderName });
    },
    [navigation, queue, folderName]
  );

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center">
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-sm font-semibold" numberOfLines={1}>{video.title}</Text>
          <Text className="text-white/50 text-xs" numberOfLines={1}>{folderName}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowQueue((v) => !v)} className="w-9 h-9 items-center justify-center">
          <List size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <YoutubePlayer
        height={PLAYER_HEIGHT}
        play={playing}
        videoId={video.videoUrl}
        onChangeState={(state: YouTubePlayerState) => {
          if (state === "playing") {
            setPlaying(true);
          }

          if (state === "paused" || state === "ended") {
            setPlaying(false);
          }
        }}
        webViewProps={{ androidLayerType: "hardware" }}
      />

      {showQueue ? (
        <ScrollView className="flex-1 bg-black" contentContainerStyle={{ padding: 16 }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold text-sm">Queue · {queue.length} videos</Text>
            <TouchableOpacity onPress={() => setShowQueue(false)}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          {queue.map((v, i) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => goTo(v)}
              className="flex-row items-center gap-2.5 p-2 rounded-xl mb-1"
              style={{ backgroundColor: v.id === video.id ? "rgba(239,68,68,0.15)" : "transparent" }}
            >
              <Text className="text-white/40 text-xs w-5 text-center">{i + 1}</Text>
              <View className="w-16 h-10 bg-white/10 rounded-lg overflow-hidden">
                {v.thumbnail ? (
                  <Image source={{ uri: v.thumbnail }} className="w-full h-full" resizeMode="cover" />
                ) : null}
              </View>
              <Text
                className="flex-1 text-xs"
                style={{ color: v.id === video.id ? "#fca5a5" : "rgba(255,255,255,0.8)" }}
                numberOfLines={2}
              >
                {v.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 bg-background rounded-t-3xl mt-2" contentContainerStyle={{ padding: 20 }}>
          <View className="flex-row items-center gap-3 mb-4">
            {prevVideo && (
              <TouchableOpacity onPress={() => goTo(prevVideo)} className="flex-1 border-2 border-border rounded-xl py-2.5 flex-row items-center justify-center gap-1.5">
                <SkipBack size={14} color="#374151" />
                <Text className="text-xs font-semibold text-foreground">Previous</Text>
              </TouchableOpacity>
            )}
            {nextVideo && (
              <TouchableOpacity onPress={() => goTo(nextVideo)} className="flex-1 bg-red-500 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5">
                <Text className="text-xs font-semibold text-white">Next</Text>
                <SkipForward size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <Text className="text-lg font-bold text-foreground mb-2">{video.title}</Text>
          <View className="flex-row items-center gap-3 mb-4">
            <Text className="text-xs text-muted-foreground">{video.duration}</Text>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{video.views.toLocaleString()} views</Text>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{video.uniqueViewers} unique</Text>
          </View>

          <TouchableOpacity
            onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.videoUrl}`)}
            className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 self-start mb-4"
          >
            <Play size={14} color="#ef4444" />
            <Text className="text-xs font-semibold text-red-600">Open on YouTube</Text>
            <ExternalLink size={12} color="#ef4444" />
          </TouchableOpacity>

          {video.description ? (
            <Text className="text-sm text-muted-foreground leading-relaxed">{video.description}</Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}