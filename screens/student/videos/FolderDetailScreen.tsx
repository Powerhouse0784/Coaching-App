import { View, Text, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft, Play, CheckCircle, Eye } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { VideosStackParamList } from "@/navigation/VideosStackNavigator";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";

type Nav = NativeStackNavigationProp<VideosStackParamList, "FolderDetail">;
type Rt = RouteProp<VideosStackParamList, "FolderDetail">;

export default function FolderDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { folder } = useRoute<Rt>().params;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <AnimatedPressable
          pressScale={0.9}
          onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} color={colors.ink} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h3, fontSize: 16, color: colors.ink }} numberOfLines={1}>{folder.name}</Text>
          <Text style={{ ...type.caption, color: colors.inkMuted, marginTop: 1 }}>
            {folder.videoCount} videos · {folder.totalDuration}
          </Text>
        </View>
      </View>

      <FlatList
        data={folder.videos}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: video, index }) => (
          <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 50)}>
            <AnimatedPressable
              onPress={() => navigation.navigate("Player", { video, folderName: folder.name })}
              pressScale={0.98}
              style={{
                flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg,
                borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 12,
              }}
            >
              <View style={{ width: 118, height: 84, backgroundColor: colors.indigoTint }}>
                {video.thumbnail ? (
                  <Image source={{ uri: video.thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
                    <Play size={20} color={colors.indigo} />
                  </View>
                )}
                <View style={{ position: "absolute", top: 6, left: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(23,25,35,0.7)", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>{index + 1}</Text>
                </View>
                {video.watchedPercentage > 0 && (
                  <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(0,0,0,0.25)" }}>
                    <View style={{ height: "100%", width: `${video.watchedPercentage}%`, backgroundColor: video.watched ? colors.mint : colors.gold }} />
                  </View>
                )}
              </View>

              <View style={{ flex: 1, padding: spacing.md, justifyContent: "center" }}>
                <Text style={{ ...type.caption, color: colors.inkFaint, marginBottom: 2 }}>{video.duration}</Text>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.ink, lineHeight: 18 }} numberOfLines={2}>
                  {video.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 7 }}>
                  {video.watched ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={11} color={colors.mint} />
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 10.5, color: colors.mint }}>Watched</Text>
                    </View>
                  ) : video.watchedPercentage > 0 ? (
                    <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 10.5, color: colors.gold }}>
                      {Math.round(video.watchedPercentage)}% watched
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Eye size={11} color={colors.inkFaint} />
                    <Text style={{ ...type.caption, color: colors.inkFaint }}>{video.views}</Text>
                  </View>
                </View>
              </View>
            </AnimatedPressable>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
