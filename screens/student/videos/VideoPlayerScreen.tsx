import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { ArrowLeft, Eye, Clock, PlayCircle } from "lucide-react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { VideosStackParamList } from "@/navigation/VideosStackNavigator";
import api from "@/lib/api";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <AnimatedPressable
          pressScale={0.9}
          onPress={() => navigation.goBack()}
          style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} color={colors.white} />
        </AnimatedPressable>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontFamily: fonts.bodyMedium, fontSize: 12.5, flex: 1 }} numberOfLines={1}>
          {folderName}
        </Text>
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

      <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: 6 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }} showsVerticalScrollIndicator={false}>
          {video.watched && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: colors.mintTint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, marginBottom: spacing.md }}>
              <PlayCircle size={12} color={colors.mint} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.mint }}>Watched</Text>
            </View>
          )}

          <Text style={{ ...type.h3, fontSize: 18, color: colors.ink, marginBottom: spacing.sm }}>{video.title}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Clock size={13} color={colors.inkFaint} />
              <Text style={{ ...type.caption, color: colors.inkMuted }}>{video.duration}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Eye size={13} color={colors.inkFaint} />
              <Text style={{ ...type.caption, color: colors.inkMuted }}>{video.views} views</Text>
            </View>
          </View>

          {video.description ? (
            <Text style={{ ...type.body, fontSize: 14, color: colors.inkMuted, lineHeight: 21 }}>
              {video.description}
            </Text>
          ) : null}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
