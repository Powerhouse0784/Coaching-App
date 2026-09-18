import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { X, Upload, Send } from "lucide-react-native";
import api from "@/lib/api";
import { pickAndUploadImage, type UploadedFile } from "@/lib/upload";
import type { PaymentOrderFull } from "@/types";

interface Props {
  visible: boolean;
  order: PaymentOrderFull | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QRPaymentModal({ visible, order, onClose, onSuccess }: Props) {
  const [proof, setProof] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const handlePickProof = async () => {
    setUploading(true);
    try {
      const file = await pickAndUploadImage();
      if (file) setProof(file);
    } catch (err: any) {
      Alert.alert("Upload failed", err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proof) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/payments", {
        action: "update-payment-proof",
        orderId: order.id,
        proofUrl: proof.url,
      });
      if (data.success) {
        Alert.alert("Submitted!", "We'll verify and confirm your order shortly.");
        setProof(null);
        onSuccess();
      } else {
        Alert.alert("Error", data.error || "Failed to update order");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-background rounded-t-3xl" style={{ maxHeight: "88%" }}>
          <View className="flex-row items-center justify-between p-5 border-b border-border">
            <View>
              <Text className="text-lg font-bold text-foreground">Complete Payment</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Order #{order.id.slice(0, 8)} · ₹{order.total.toLocaleString("en-IN")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View className="bg-secondary rounded-2xl p-5 items-center mb-5">
              <Text className="font-bold text-foreground text-base mb-3">Scan & Pay</Text>
              <View className="w-44 h-44 bg-white rounded-2xl items-center justify-center p-3 mb-3">
                <Image
                  source={{ uri: "https://intense-learners.vercel.app/paytm-qr-placeholder.jpeg" }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-sm text-foreground mb-1">
                Pay <Text className="font-bold text-violet-600">₹{order.total.toLocaleString("en-IN")}</Text> via any UPI app
              </Text>
              <Text className="text-xs text-muted-foreground">
                UPI ID: <Text className="font-bold text-violet-600">9810493309@ptsbi</Text>
              </Text>
            </View>

            <Text className="text-sm font-bold text-foreground mb-2">Upload Payment Screenshot</Text>
            {proof ? (
              <View className="border-2 border-violet-300 bg-violet-50 rounded-xl p-3 mb-3">
                <Image source={{ uri: proof.url }} className="w-full rounded-lg mb-2" style={{ height: 140 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => setProof(null)}>
                  <Text className="text-xs text-red-600 text-center font-semibold">Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickProof}
                disabled={uploading}
                className="border-2 border-dashed border-border rounded-xl p-6 items-center mb-3"
              >
                {uploading ? (
                  <ActivityIndicator color="#7c3aed" />
                ) : (
                  <>
                    <Upload size={26} color="#9ca3af" />
                    <Text className="text-sm text-muted-foreground mt-2">Tap to upload screenshot</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">PNG, JPG up to 5MB</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSubmitProof}
              disabled={!proof || submitting}
              className="bg-violet-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
              style={{ opacity: !proof || submitting ? 0.5 : 1 }}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Send size={16} color="#fff" />}
              <Text className="text-white font-bold text-sm">
                {submitting ? "Uploading…" : "Submit Payment Proof"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}