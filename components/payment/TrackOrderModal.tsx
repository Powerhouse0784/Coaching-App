import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { X, Package, Search, AlertCircle, ThumbsUp, ThumbsDown, Loader } from "lucide-react-native";
import api from "@/lib/api";
import type { PaymentOrderFull } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TrackOrderModal({ visible, onClose }: Props) {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<PaymentOrderFull | null>(null);

  const search = async () => {
    if (!id.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get(`/api/payments?action=order-status&orderId=${encodeURIComponent(id.trim())}`);
      if (!data.success) {
        setError(data.error || "Order not found");
        return;
      }
      setOrder(data.order);
    } catch (err: any) {
      setError(err.response?.data?.error || "Order not found");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    setId("");
    setError("");
    setOrder(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/70 items-center justify-center px-5">
        <View className="w-full bg-card rounded-3xl overflow-hidden">
          <View className="flex-row items-center justify-between p-5 border-b border-border">
            <Text className="text-lg font-bold text-foreground">{order ? "Order Status" : "Track Order"}</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="p-5">
            {!order ? (
              <>
                <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-3">
                  <Package size={16} color="#9ca3af" />
                  <TextInput
                    value={id}
                    onChangeText={(v) => { setId(v); setError(""); }}
                    placeholder="Enter your Order ID…"
                    autoCapitalize="none"
                    className="flex-1 py-3 px-2 text-foreground text-sm"
                  />
                </View>
                {error ? (
                  <View className="flex-row items-center gap-1.5 mb-3">
                    <AlertCircle size={13} color="#dc2626" />
                    <Text className="text-red-600 text-xs">{error}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={search}
                  disabled={busy || !id.trim()}
                  className="bg-violet-600 rounded-xl py-3 items-center flex-row justify-center gap-2"
                  style={{ opacity: busy || !id.trim() ? 0.5 : 1 }}
                >
                  {busy ? <ActivityIndicator color="#fff" size="small" /> : <Search size={16} color="#fff" />}
                  <Text className="text-white font-bold text-sm">{busy ? "Searching…" : "Track Order"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  className="p-4 rounded-xl items-center mb-4"
                  style={{
                    backgroundColor:
                      order.status === "approved" ? "#d1fae5" : order.status === "rejected" ? "#fee2e2" : "#fef3c7",
                  }}
                >
                  {order.status === "approved" && (
                    <>
                      <ThumbsUp size={36} color="#10b981" />
                      <Text className="font-bold text-emerald-600 mt-2">Order Approved! ✅</Text>
                      <Text className="text-sm text-center mt-1 text-emerald-700">Your order is confirmed and will be delivered soon.</Text>
                    </>
                  )}
                  {order.status === "rejected" && (
                    <>
                      <ThumbsDown size={36} color="#ef4444" />
                      <Text className="font-bold text-red-600 mt-2">Order Rejected ❌</Text>
                      <Text className="text-sm text-center mt-1 text-red-700">Please contact support for more information.</Text>
                    </>
                  )}
                  {order.status === "pending" && (
                    <>
                      <Loader size={36} color="#f59e0b" />
                      <Text className="font-bold text-amber-600 mt-2">Pending Approval ⏳</Text>
                      <Text className="text-sm text-center mt-1 text-amber-700">Your order is waiting for admin approval.</Text>
                    </>
                  )}
                </View>

                <View className="bg-secondary rounded-xl p-3.5 gap-1">
                  <Text className="text-sm text-foreground"><Text className="font-bold">Order ID:</Text> {order.id}</Text>
                  <Text className="text-sm text-foreground"><Text className="font-bold">Total:</Text> ₹{order.total.toLocaleString("en-IN")}</Text>
                  <Text className="text-sm text-foreground"><Text className="font-bold">Payment:</Text> {order.paymentMethod?.toUpperCase() || "—"}</Text>
                  <Text className="text-sm text-foreground"><Text className="font-bold">Placed:</Text> {new Date(order.createdAt).toLocaleString()}</Text>
                </View>

                <TouchableOpacity onPress={() => setOrder(null)} className="mt-4">
                  <Text className="text-center text-violet-600 text-sm font-semibold">Track another order</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}