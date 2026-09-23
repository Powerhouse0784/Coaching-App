import { View, Text, FlatList, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft, Eye, Play } from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TeacherVideosStackParamList } from "@/navigation/TeacherVideosStackNavigator";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = NativeStackNavigationProp<TeacherVideosStackParamList, "FolderVideos">;
type Rt = RouteProp<TeacherVideosStackParamList, "FolderVideos">;

export default function FolderVideosScreen() {
  const navigation = useNavigation<Nav>();
  const { folder } = useRoute<Rt>().params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <AnimatedPressable
          pressScale={0.9}
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} color={colors.ink} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ ...type.h3, fontSize: 16, color: colors.ink }} numberOfLines={1}>{folder.name}</Text>
            {folder.youtubePlaylistId && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.coral, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill }}>
                <Play size={8} color={colors.white} fill={colors.white} />
                <Text style={{ color: colors.white, fontSize: 8.5, fontFamily: fonts.bodySemibold }}>YT</Text>
              </View>
            )}
          </View>
          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 1 }}>{folder.videoCount} videos · {folder.chapter}</Text>
        </View>
      </View>

      <FlatList
        data={folder.videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: video, index }) => (
          <Animated.View entering={FadeInDown.duration(280).delay(Math.min(index, 10) * 40)}>
            <AnimatedPressable
              onPress={() => navigation.navigate("Player", { video, queue: folder.videos, folderName: folder.name })}
              pressScale={0.98}
              style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 12 }}
            >
              <View style={{ width: 112, height: 80, backgroundColor: colors.coralTint }}>
                {video.thumbnail ? (
                  <Image source={{ uri: video.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <Play size={20} color={colors.coral} />
                  </View>
                )}
                <View style={{ position: "absolute", top: 6, left: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(23,25,35,0.7)", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>{index + 1}</Text>
                </View>
                <View style={{ position: "absolute", bottom: 5, right: 5, backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm }}>
                  <Text style={{ color: colors.white, fontSize: 9.5, fontFamily: fonts.bodySemibold }}>{video.duration}</Text>
                </View>
              </View>

              <View style={{ flex: 1, padding: spacing.md, justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, lineHeight: 18, marginBottom: 7 }} numberOfLines={2}>{video.title}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Eye size={11} color={colors.inkFaint} />
                    <Text style={{ fontSize: 10, color: colors.inkMuted, fontFamily: fonts.body }}>{video.views.toLocaleString()}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: colors.inkFaint, fontFamily: fonts.body }}>{video.uniqueViewers} unique</Text>
                  <Text style={{ fontSize: 10, color: colors.inkFaint, fontFamily: fonts.body }}>{video.totalWatchTime} watched</Text>
                </View>
              </View>

              <AnimatedPressable pressScale={0.9} onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.videoUrl}`)} style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.coralTint, alignItems: "center", justifyContent: "center" }}>
                  <Play size={14} color={colors.coral} fill={colors.coral} />
                </View>
              </AnimatedPressable>
            </AnimatedPressable>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.coralTint, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <Play size={30} color={colors.coral} />
            </View>
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>No videos found</Text>
            {folder.youtubePlaylistId && (
              <Text style={{ ...type.body, fontSize: 12.5, color: colors.inkMuted, textAlign: "center", marginTop: 4, paddingHorizontal: 32 }}>
                Linked to YouTube — go to the "YouTube Sync" tab and tap Sync Now.
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
