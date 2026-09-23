import { useState, useCallback } from "react";
import { View, Text, ScrollView, Dimensions, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { ArrowLeft, SkipBack, SkipForward, List, X, Play, ExternalLink, Eye } from "lucide-react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TeacherVideosStackParamList } from "@/navigation/TeacherVideosStackNavigator";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = NativeStackNavigationProp<TeacherVideosStackParamList, "Player">;
type Rt = RouteProp<TeacherVideosStackParamList, "Player">;
type YouTubePlayerState = "unstarted" | "ended" | "playing" | "paused" | "buffering" | "video cued";

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.black }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <AnimatedPressable pressScale={0.9} onPress={() => navigation.goBack()} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={18} color={colors.white} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }} numberOfLines={1}>{video.title}</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontFamily: fonts.body, fontSize: 11 }} numberOfLines={1}>{folderName}</Text>
        </View>
        <AnimatedPressable pressScale={0.9} onPress={() => setShowQueue((v) => !v)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
          <List size={16} color={colors.white} />
        </AnimatedPressable>
      </View>

      <YoutubePlayer
        height={PLAYER_HEIGHT}
        play={playing}
        videoId={video.videoUrl}
        onChangeState={(state: YouTubePlayerState) => {
          if (state === "playing") setPlaying(true);
          if (state === "paused" || state === "ended") setPlaying(false);
        }}
        webViewProps={{ androidLayerType: "hardware" }}
      />

      {showQueue ? (
        <ScrollView style={{ flex: 1, backgroundColor: colors.black }} contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
            <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Queue · {queue.length} videos</Text>
            <AnimatedPressable pressScale={0.9} onPress={() => setShowQueue(false)}>
              <X size={18} color={colors.white} />
            </AnimatedPressable>
          </View>
          {queue.map((v, i) => {
            const isCurrent = v.id === video.id;
            return (
              <AnimatedPressable
                key={v.id}
                pressScale={0.98}
                onPress={() => goTo(v)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: radius.md, marginBottom: 4, backgroundColor: isCurrent ? "rgba(193,68,58,0.18)" : "transparent" }}
              >
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, width: 20, textAlign: "center" }}>{i + 1}</Text>
                <View style={{ width: 64, height: 40, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radius.sm, overflow: "hidden" }}>
                  {v.thumbnail ? <Image source={{ uri: v.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : null}
                </View>
                <Text style={{ flex: 1, fontSize: 12, fontFamily: isCurrent ? fonts.bodySemibold : fonts.body, color: isCurrent ? "#E9938B" : "rgba(255,255,255,0.8)" }} numberOfLines={2}>
                  {v.title}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      ) : (
        <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1, backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, marginTop: 6 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.xl }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: spacing.lg }}>
              {prevVideo && (
                <AnimatedPressable pressScale={0.96} onPress={() => goTo(prevVideo)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 11 }}>
                  <SkipBack size={14} color={colors.ink} />
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.ink }}>Previous</Text>
                </AnimatedPressable>
              )}
              {nextVideo && (
                <AnimatedPressable pressScale={0.96} onPress={() => goTo(nextVideo)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.coral, borderRadius: radius.md, paddingVertical: 11 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.white }}>Next</Text>
                  <SkipForward size={14} color={colors.white} />
                </AnimatedPressable>
              )}
            </View>

            <Text style={{ ...type.h3, fontSize: 17, color: colors.ink, marginBottom: spacing.sm }}>{video.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: spacing.lg }}>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>{video.duration}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Eye size={12} color={colors.inkFaint} />
                <Text style={{ ...type.caption, color: colors.inkMuted }}>{video.views.toLocaleString()} views</Text>
              </View>
              <Text style={{ ...type.caption, color: colors.inkMuted }}>{video.uniqueViewers} unique</Text>
            </View>

            <AnimatedPressable
              pressScale={0.96}
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.videoUrl}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.coralTint, borderWidth: 1, borderColor: "rgba(193,68,58,0.3)", borderRadius: radius.md, paddingHorizontal: 13, paddingVertical: 10, alignSelf: "flex-start", marginBottom: spacing.lg }}
            >
              <Play size={13} color={colors.coral} fill={colors.coral} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.coral }}>Open on YouTube</Text>
              <ExternalLink size={11} color={colors.coral} />
            </AnimatedPressable>

            {video.description ? (
              <Text style={{ ...type.body, fontSize: 13.5, color: colors.inkMuted, lineHeight: 20 }}>{video.description}</Text>
            ) : null}
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
