import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from "react-native";
import { X, QrCode, DollarSign, Lock } from "lucide-react-native";
import type { CartItem, AddressForm } from "@/types";

interface Props {
  visible: boolean;
  method: "qr" | "cod" | null;
  cartItems: CartItem[];
  subtotal: number;
  couponDiscount: number;
  couponCode: string | null;
  total: number;
  hasHardcopy: boolean;
  address: AddressForm;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function OrderSummaryModal({
  visible, method, cartItems, subtotal, couponDiscount, couponCode, total,
  hasHardcopy, address, submitting, onClose, onConfirm,
}: Props) {
  if (!method) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-background rounded-t-3xl" style={{ maxHeight: "88%" }}>
          <View className="flex-row items-center justify-between p-5 border-b border-border">
            <Text className="text-lg font-bold text-foreground">Confirm Order</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View
              className="flex-row items-center gap-3 p-3.5 rounded-xl border-2 mb-4"
              style={{
                borderColor: method === "qr" ? "#ddd6fe" : "#bbf7d0",
                backgroundColor: method === "qr" ? "#faf5ff" : "#f0fdf4",
              }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: method === "qr" ? "#ede9fe" : "#dcfce7" }}
              >
                {method === "qr" ? <QrCode size={18} color="#7c3aed" /> : <DollarSign size={18} color="#16a34a" />}
              </View>
              <View>
                <Text className="font-bold text-sm text-foreground">
                  {method === "qr" ? "QR Code Payment" : "Cash on Delivery"}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {method === "qr" ? "Pay via UPI by scanning QR code" : "Pay when you receive the order"}
                </Text>
              </View>
            </View>

            <View className="rounded-xl border-2 border-border overflow-hidden mb-4">
              <View className="p-3.5 border-b border-border bg-secondary">
                <Text className="font-bold text-sm text-foreground">Order Summary</Text>
              </View>
              <View className="p-3.5 gap-2">
                {cartItems.map((item, i) => (
                  <View key={i} className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground flex-1 pr-2">
                      {item.name}{item.qty ? ` × ${item.qty}` : ""}
                    </Text>
                    <Text className="text-sm font-medium text-foreground">₹{item.price.toLocaleString("en-IN")}</Text>
                  </View>
                ))}
                <View className="border-t border-border pt-2 mt-1 gap-1">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted-foreground">Subtotal</Text>
                    <Text className="text-xs text-muted-foreground">₹{subtotal.toLocaleString("en-IN")}</Text>
                  </View>
                  {couponDiscount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-green-600">Discount ({couponCode})</Text>
                      <Text className="text-xs text-green-600">-₹{couponDiscount.toLocaleString("en-IN")}</Text>
                    </View>
                  )}
                  {hasHardcopy && (
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">Delivery</Text>
                      <Text className="text-xs text-green-600 font-medium">FREE</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between pt-1">
                    <Text className="font-bold text-foreground text-base">Total</Text>
                    <Text className="font-bold text-base" style={{ color: method === "qr" ? "#7c3aed" : "#16a34a" }}>
                      ₹{total.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {hasHardcopy && (
              <View className="rounded-xl border-2 border-border p-3.5 mb-4">
                <Text className="font-bold text-sm text-foreground mb-1.5">Delivery Address</Text>
                <Text className="text-sm text-muted-foreground">{address.name} · {address.phone}</Text>
                <Text className="text-sm text-muted-foreground">{address.address}, {address.city} - {address.pincode}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={onConfirm}
              disabled={submitting}
              className="bg-violet-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Lock size={16} color="#fff" />}
              <Text className="text-white font-bold text-sm">
                {submitting ? "Placing Order…" : `Place Order · ₹${total.toLocaleString("en-IN")}`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}