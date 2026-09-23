import { useState } from "react";
import { View, Text, Linking } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import {
  FileText, Clock, CheckCircle, Activity, User, Calendar, Award,
  Users, MessageSquare, Download, Upload, Check, Eye, ChevronDown,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing, type } from "@/constants/theme";
import type { StudentAssignment } from "@/types";

interface Props {
  assignment: StudentAssignment;
  onSubmit: () => void;
  onViewComments: () => void;
  onMarkCompleted: (submissionId: string) => void;
}

export default function AssignmentCard({ assignment, onSubmit, onViewComments, onMarkCompleted }: Props) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  const timeLeftText =
    daysLeft > 1 ? `${daysLeft} days left` : hoursLeft > 1 ? `${hoursLeft} hours left` : daysLeft < 0 ? "Past due" : "Due soon";
  const timeLeftColor = daysLeft < 0 ? colors.inkFaint : daysLeft <= 2 ? colors.coral : colors.mint;

  const statusBadge = assignment.mySubmission?.isCompleted
    ? { label: "Completed", tone: "success" as const, Icon: CheckCircle }
    : assignment.mySubmission
    ? { label: "Submitted", tone: "brand" as const, Icon: Activity }
    : { label: "Pending", tone: "gold" as const, Icon: Clock };

  const toggleExpanded = () => {
    rotation.value = withTiming(expanded ? 0 : 180, { duration: 200 });
    setExpanded((e) => !e);
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const canExpand = assignment.description.length > 100;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ marginHorizontal: 20, marginBottom: 14 }}>
      <Card padding="lg">
        {/* Title + status */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm, marginBottom: spacing.sm }}>
          <Text style={{ ...type.h3, fontSize: 16, color: colors.ink, flex: 1 }} numberOfLines={2}>
            {assignment.title}
          </Text>
          <Badge label={statusBadge.label} tone={statusBadge.tone} />
        </View>

        {/* Meta tags */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.md }}>
          <Badge label={assignment.subject} tone="brand" />
          <Badge label={assignment.class} tone="neutral" />
        </View>

        {/* Description */}
        <Text style={{ ...type.body, fontSize: 13.5, color: colors.inkMuted, lineHeight: 19 }} numberOfLines={expanded ? undefined : 2}>
          {assignment.description}
        </Text>
        {canExpand && (
          <AnimatedPressable
            onPress={toggleExpanded}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, marginBottom: 4, alignSelf: "flex-start" }}
          >
            <Text style={{ color: colors.indigo, fontFamily: fonts.bodySemibold, fontSize: 12.5 }}>
              {expanded ? "Show less" : "Read more"}
            </Text>
            <Animated.View style={chevronStyle}>
              <ChevronDown size={14} color={colors.indigo} />
            </Animated.View>
          </AnimatedPressable>
        )}

        {/* Meta row */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 7, marginTop: spacing.sm, marginBottom: spacing.md }}>
          <MetaItem icon={User} text={assignment.teacher.name || "Unknown"} />
          <MetaItem icon={Calendar} text={`Due ${dueDate.toLocaleDateString()}`} />
          <MetaItem icon={Clock} text={timeLeftText} color={timeLeftColor} />
          <MetaItem icon={Award} text={`${assignment.totalMarks} marks`} />
          <MetaItem icon={Users} text={`${assignment.stats.totalSubmissions} submissions`} />
        </View>

        {/* Submission box */}
        {assignment.mySubmission && (
          <View
            style={{
              backgroundColor: colors.indigoTint,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={17} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.indigoDark, marginBottom: 2 }}>
                  Your Submission
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <FileText size={11} color={colors.indigo} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.indigo, flexShrink: 1 }} numberOfLines={1}>
                    {assignment.mySubmission.fileName} · {assignment.mySubmission.fileSize}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: colors.inkMuted, marginTop: 3 }}>
                  Submitted {new Date(assignment.mySubmission.submittedAt).toLocaleDateString()}
                </Text>
                {assignment.mySubmission.remarks ? (
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.indigoDark, fontStyle: "italic", marginTop: 6 }}>
                    "{assignment.mySubmission.remarks}"
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: spacing.md }}>
              <Button
                label="View"
                icon={Eye}
                size="sm"
                onPress={() => Linking.openURL(assignment.mySubmission!.fileUrl)}
                style={{ flex: 1 }}
              />
              {!assignment.mySubmission.isCompleted && (
                <Button
                  label="Mark Done"
                  icon={Check}
                  size="sm"
                  onPress={() => onMarkCompleted(assignment.mySubmission!.id)}
                  style={{ flex: 1, backgroundColor: colors.mint }}
                />
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {assignment.fileUrl && (
            <Button
              label="Download"
              icon={Download}
              variant="secondary"
              size="sm"
              onPress={() => Linking.openURL(assignment.fileUrl!)}
              style={{ flex: 1, minWidth: "45%" }}
            />
          )}
          {!assignment.mySubmission && (
            <Button
              label="Submit"
              icon={Upload}
              size="sm"
              onPress={onSubmit}
              style={{ flex: 1, minWidth: "45%" }}
            />
          )}
          <Button
            label={`Discuss (${assignment.stats.totalComments})`}
            icon={MessageSquare}
            variant="ghost"
            size="sm"
            onPress={onViewComments}
            style={{ flex: 1, minWidth: "45%" }}
          />
        </View>
      </Card>
    </Animated.View>
  );
}

function MetaItem({ icon: Icon, text, color }: { icon: typeof User; text: string; color?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Icon size={12} color={color ?? colors.inkFaint} />
      <Text
        style={{ fontFamily: color ? fonts.bodySemibold : fonts.body, fontSize: 11.5, color: color ?? colors.inkMuted }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}
