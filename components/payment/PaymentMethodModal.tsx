import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { X, QrCode, DollarSign } from "lucide-react-native";

interface Props {
  visible: boolean;
  total: number;
  showCod: boolean;
  onClose: () => void;
  onSelect: (method: "qr" | "cod") => void;
}

export default function PaymentMethodModal({ visible, total, showCod, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 items-center justify-center px-5" onPress={onClose}>
        <Pressable className="w-full bg-card rounded-3xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between p-5 border-b border-border">
            <View>
              <Text className="text-lg font-bold text-foreground">Select Payment</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Total: ₹{total.toLocaleString("en-IN")}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="p-5 gap-3">
            <TouchableOpacity
              onPress={() => onSelect("qr")}
              className="border-2 border-border rounded-2xl p-5 items-center"
            >
              <View className="w-14 h-14 bg-violet-600 rounded-2xl items-center justify-center mb-3">
                <QrCode size={26} color="#fff" />
              </View>
              <Text className="font-bold text-foreground text-sm mb-1">Pay via QR</Text>
              <Text className="text-xs text-muted-foreground">Scan & pay with any UPI app</Text>
            </TouchableOpacity>

            {showCod && (
              <TouchableOpacity
                onPress={() => onSelect("cod")}
                className="border-2 border-border rounded-2xl p-5 items-center"
              >
                <View className="w-14 h-14 bg-emerald-600 rounded-2xl items-center justify-center mb-3">
                  <DollarSign size={26} color="#fff" />
                </View>
                <Text className="font-bold text-foreground text-sm mb-1">Cash on Delivery</Text>
                <Text className="text-xs text-muted-foreground">Pay when you receive</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}