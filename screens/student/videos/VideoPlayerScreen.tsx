import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity,  ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { VideosStackParamList } from "@/navigation/VideosStackNavigator";
import api from "@/lib/api";

type Nav = NativeStackNavigationProp<VideosStackParamList, "Player">;
type Rt = RouteProp<VideosStackParamList, "Player">;

const { width } = Dimensions.get("window");
const PLAYER_HEIGHT = (width * 9) / 16;
const SYNC_INTERVAL_SECONDS = 10;
const COMPLETION_THRESHOLD = 0.9;

export default function VideoPlayerScreen() {
  const navigation = useNavigation<Nav>();
  const { video, folderName } = useRoute<Rt>().params;

  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const secondsSinceSyncRef = useRef(0);
  const hasSeekedToResume = useRef(false);

  const syncProgress = useCallback(
    async (completedOverride?: boolean) => {
      if (secondsSinceSyncRef.current <= 0 && !completedOverride) return;
      try {
        const currentTime = await playerRef.current?.getCurrentTime();
        const duration = await playerRef.current?.getDuration();
        const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
        const completed = completedOverride ?? pct / 100 >= COMPLETION_THRESHOLD;

        await api.post("/api/student/video-progress", {
          videoId: video.id,
          watchedPercentage: pct,
          watchedSeconds: secondsSinceSyncRef.current,
          lastPosition: currentTime,
          completed,
        });
        secondsSinceSyncRef.current = 0;
      } catch (e) {
        console.error("Progress sync error:", e);
      }
    },
    [video.id]
  );

  // Tick every second while playing, sync every SYNC_INTERVAL_SECONDS
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      secondsSinceSyncRef.current += 1;
      if (secondsSinceSyncRef.current >= SYNC_INTERVAL_SECONDS) {
        syncProgress();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, syncProgress]);

  // Sync on leaving the screen
  useEffect(() => {
    return () => {
      syncProgress();
    };
  }, [syncProgress]);

  const onReady = useCallback(async () => {
    if (!hasSeekedToResume.current && video.lastPosition > 0) {
      playerRef.current?.seekTo(video.lastPosition, true);
      hasSeekedToResume.current = true;
    }
  }, [video.lastPosition]);

  const onStateChange = useCallback(
    (state: string) => {
      if (state === "playing") setPlaying(true);
      if (state === "paused") {
        setPlaying(false);
        syncProgress();
      }
      if (state === "ended") {
        setPlaying(false);
        syncProgress(true);
      }
    },
    [syncProgress]
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center gap-3 px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center">
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xs flex-1" numberOfLines={1}>{folderName}</Text>
      </View>

      <YoutubePlayer
        ref={playerRef}
        height={PLAYER_HEIGHT}
        play={playing}
        videoId={video.videoUrl}
        onChangeState={onStateChange}
        onReady={onReady}
        webViewProps={{ androidLayerType: "hardware" }}
      />

      <ScrollView className="flex-1 bg-background rounded-t-3xl mt-2" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-lg font-bold text-foreground mb-2">{video.title}</Text>
        <View className="flex-row items-center gap-3 mb-4">
          <Text className="text-xs text-muted-foreground">{video.duration}</Text>
          <Text className="text-xs text-muted-foreground">·</Text>
          <Text className="text-xs text-muted-foreground">{video.views} views</Text>
        </View>
        {video.description ? (
          <Text className="text-sm text-muted-foreground leading-relaxed">{video.description}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}