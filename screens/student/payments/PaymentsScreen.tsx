import { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  ActivityIndicator,  Alert, Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, GraduationCap, Printer, Wallet, Search, Tag, X,
  Check, ArrowRight, Lock, ChevronDown, FileText, Truck,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { FeePlan, PurchasableNote, CartItem, AddressForm, PaymentOrderFull } from "@/types";
import { useAuthStore } from "@/store/authStore";
import PaymentMethodModal from "@/components/payment/PaymentMethodModal";
import OrderSummaryModal from "@/components/payment/OrderSummaryModal";
import QRPaymentModal from "@/components/payment/QRPaymentModal";
import TrackOrderModal from "@/components/payment/TrackOrderModal";

const MIN_ORDER = 200;

type Tab = "fees" | "hardcopy" | "cart";

export default function PaymentsScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>("fees");

  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<Record<string, boolean>>({});

  const [notes, setNotes] = useState<PurchasableNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteSearch, setNoteSearch] = useState("");
  const [hardcopyQty, setHardcopyQty] = useState<Record<string, number>>({});

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [showAddress, setShowAddress] = useState(false);
  const [address, setAddress] = useState<AddressForm>({
    name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "",
  });
  const currentUser = useAuthStore((s) => s.user);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"qr" | "cod" | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<PaymentOrderFull | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  useEffect(() => {
    api.get("/api/payments?action=fee-plans").then(({ data }) => {
      if (data.success) {
        setFeePlans(data.plans);
        const classes = [...new Set(data.plans.map((p: FeePlan) => p.class))] as string[];
        if (classes.length) setSelectedClass(classes[0]);
      }
    }).finally(() => setPlansLoading(false));

    api.get("/api/payments?action=notes").then(({ data }) => {
      if (data.success) setNotes(data.notes);
    }).finally(() => setNotesLoading(false));
  }, []);

  const classes = useMemo(() => [...new Set(feePlans.map((p) => p.class))], [feePlans]);
  const plansForClass = feePlans.filter((p) => p.class === selectedClass);
  const filteredNotes = notes.filter((n) => {
    if (!noteSearch) return true;
    const q = noteSearch.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q);
  });

  const cartItems: CartItem[] = [
    ...feePlans.filter((p) => selectedPlans[p.id]).map((p) => ({
      id: p.id, type: "fee" as const, name: `${p.class} · ${p.subject} (${p.duration})`, price: p.price, subject: p.subject, class: p.class,
    })),
    ...Object.entries(hardcopyQty).filter(([, q]) => q > 0).map(([noteId, qty]) => {
      const note = notes.find((n) => n.id === noteId);
      const unitPrice = note?.price || 30;
      return { id: noteId, type: "hardcopy" as const, name: note?.title || "Note", price: unitPrice * qty, qty, unitPrice, subject: note?.subject };
    }),
  ];

  const subtotal = cartItems.reduce((s, i) => s + i.price, 0);
  const couponDiscount = appliedCoupon?.discount || 0;
  const total = Math.max(subtotal - couponDiscount, 0);
  const hasHardcopy = cartItems.some((i) => i.type === "hardcopy");
  const hasOnlyFees = cartItems.length > 0 && cartItems.every((i) => i.type === "fee");
  const meetsMinOrder = total >= MIN_ORDER;

  const resetCart = () => {
    setOrderPlaced(null);
    setSelectedMethod(null);
    setSelectedPlans({});
    setHardcopyQty({});
    setAppliedCoupon(null);
    setCouponCode("");
    setTab("fees");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const { data } = await api.post("/api/payments", { action: "validate-coupon", code: couponCode, subtotal });
      if (data.success) {
        setAppliedCoupon({ code: data.code, discount: data.discount, label: data.label });
      } else {
        setCouponError(data.error || "Invalid coupon");
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.error || "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!cartItems.length) return;
    if (!meetsMinOrder) {
      Alert.alert("Minimum order", `Minimum order is ₹${MIN_ORDER}. Add ₹${MIN_ORDER - total} more.`);
      return;
    }
    if (hasHardcopy && (!address.name || !address.phone || !address.address || !address.city || !address.pincode)) {
      Alert.alert("Address required", "Please fill in all delivery address fields");
      setShowAddress(true);
      return;
    }
    setShowMethodModal(true);
  };

  const handleSelectMethod = (method: "qr" | "cod") => {
    setSelectedMethod(method);
    setShowMethodModal(false);
    setShowSummaryModal(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedMethod) return;
    setPlacingOrder(true);
    try {
      const { data } = await api.post("/api/payments", {
        action: "create-order",
        items: cartItems,
        subtotal,
        couponDiscount,
        total,
        couponCode: appliedCoupon?.code || null,
        address: hasHardcopy ? address : null,
        paymentMethod: selectedMethod,
        userEmail: currentUser?.email,
        });
      if (!data.success) throw new Error(data.error);
      setOrderPlaced(data.order);
      setShowSummaryModal(false);
      if (selectedMethod === "cod") {
        Alert.alert("Order placed!", "You'll receive a confirmation once admin approves your order.");
        resetCart();
      } else {
        setShowQrModal(true);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 bg-secondary rounded-lg items-center justify-center">
            <ArrowLeft size={18} color="#374151" />
          </TouchableOpacity>
          <Text className="font-bold text-foreground text-base">Fees & Payments</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setShowTrackModal(true)}
            className="flex-row items-center gap-1 px-3 py-2 border-2 border-border rounded-xl"
          >
            <Truck size={14} color="#6b7280" />
            <Text className="text-xs font-semibold text-foreground">Track</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab("cart")}
            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${tab === "cart" ? "bg-violet-600" : "border-2 border-border"}`}
          >
            <Wallet size={14} color={tab === "cart" ? "#fff" : "#6b7280"} />
            {cartItems.length > 0 && (
              <View className="bg-red-500 rounded-full px-1.5">
                <Text className="text-white text-[10px] font-bold">{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row border-b border-border px-2">
        {([
          { id: "fees" as const, label: "Fees", icon: GraduationCap },
          { id: "hardcopy" as const, label: "Notes", icon: Printer },
          { id: "cart" as const, label: cartItems.length > 0 ? `Cart (${cartItems.length})` : "Checkout", icon: Wallet },
        ]).map(({ id, label, icon: Icon }) => (
          <TouchableOpacity
            key={id}
            onPress={() => setTab(id)}
            className="flex-1 items-center py-3 flex-row justify-center gap-1.5"
            style={{ borderBottomWidth: 2, borderBottomColor: tab === id ? "#7c3aed" : "transparent" }}
          >
            <Icon size={14} color={tab === id ? "#7c3aed" : "#9ca3af"} />
            <Text className="text-xs font-bold" style={{ color: tab === id ? "#7c3aed" : "#9ca3af" }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {cartItems.length > 0 && !meetsMinOrder && (
        <View className="mx-5 mt-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <Text className="text-xs text-amber-700 font-medium">
            ⚠️ Minimum order ₹{MIN_ORDER}. Add ₹{MIN_ORDER - total} more to proceed.
          </Text>
        </View>
      )}

      {tab === "fees" && (
        <FlatList
          data={plansForClass}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <View className="px-5 pt-4">
              <Text className="font-bold text-foreground text-base mb-3">Select Your Class</Text>
              {plansLoading ? (
                <ActivityIndicator color="#7c3aed" />
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={classes}
                  keyExtractor={(c) => c}
                  contentContainerStyle={{ gap: 8, marginBottom: 16 }}
                  renderItem={({ item: cls }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedClass(cls)}
                      className={`px-4 py-2.5 rounded-2xl ${selectedClass === cls ? "bg-violet-600" : "bg-card border-2 border-border"}`}
                    >
                      <Text className={`text-xs font-bold ${selectedClass === cls ? "text-white" : "text-foreground"}`}>{cls}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              {selectedClass ? <Text className="font-bold text-foreground text-sm mb-3">Plans for {selectedClass}</Text> : null}
            </View>
          }
          renderItem={({ item: plan }) => {
            const isSelected = !!selectedPlans[plan.id];
            const save = plan.originalPrice - plan.price;
            const pct = Math.round((save / plan.originalPrice) * 100);
            return (
              <TouchableOpacity
                onPress={() => setSelectedPlans((p) => ({ ...p, [plan.id]: !p[plan.id] }))}
                className="mx-5 mb-3 bg-card rounded-2xl border-2 p-4"
                style={{ borderColor: isSelected ? "#7c3aed" : "#e5e7eb" }}
              >
                {plan.popular && (
                  <View className="absolute top-3 right-3 bg-violet-600 px-2 py-0.5 rounded-lg">
                    <Text className="text-white text-[9px] font-bold">★ Popular</Text>
                  </View>
                )}
                <View className="flex-row items-center gap-2.5 mb-3">
                  <View className="w-9 h-9 bg-violet-100 rounded-xl items-center justify-center">
                    <GraduationCap size={16} color="#7c3aed" />
                  </View>
                  <View>
                    <Text className="font-bold text-foreground text-sm">{plan.subject}</Text>
                    <Text className="text-xs text-muted-foreground">{plan.duration}</Text>
                  </View>
                </View>
                <View className="flex-row items-baseline gap-2 mb-1">
                  <Text className="text-xl font-bold text-foreground">₹{plan.price.toLocaleString("en-IN")}</Text>
                  <Text className="text-xs text-muted-foreground line-through">₹{plan.originalPrice.toLocaleString("en-IN")}</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="bg-emerald-100 px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-emerald-700">{pct}% OFF</Text>
                  </View>
                  <Text className="text-[10px] text-muted-foreground">Save ₹{save.toLocaleString("en-IN")}</Text>
                </View>
                <View className={`py-2 rounded-xl items-center ${isSelected ? "bg-violet-600" : "bg-secondary"}`}>
                  {isSelected ? (
                    <View className="flex-row items-center gap-1.5">
                      <Check size={14} color="#fff" />
                      <Text className="text-white text-xs font-bold">Selected</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-foreground text-xs font-bold">Select</Text>
                      <ArrowRight size={14} color="#374151" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {tab === "hardcopy" && (
        <FlatList
          data={filteredNotes}
          keyExtractor={(n) => n.id}
          ListHeaderComponent={
            <View className="px-5 pt-4">
              <View className="flex-row items-center gap-3 p-3.5 bg-amber-50 border-2 border-amber-200 rounded-xl mb-4">
                <View className="w-9 h-9 bg-amber-500 rounded-xl items-center justify-center">
                  <Printer size={16} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-xs text-amber-800">Order Printed Notes</Text>
                  <Text className="text-[10px] text-amber-700">Free delivery · 3–5 days</Text>
                </View>
              </View>
              <View className="flex-row items-center border-2 border-border rounded-xl px-3 mb-4 bg-card">
                <Search size={16} color="#9ca3af" />
                <TextInput
                  value={noteSearch}
                  onChangeText={setNoteSearch}
                  placeholder="Search notes…"
                  className="flex-1 py-2.5 px-2 text-foreground text-sm"
                />
              </View>
            </View>
          }
          renderItem={({ item: note }) => {
            const qty = hardcopyQty[note.id] || 0;
            const unitPrice = note.price || 30;
            return (
              <View className="mx-5 mb-3 bg-card rounded-2xl border-2 border-border p-4 flex-row items-center gap-3">
                <View className="w-14 h-14 bg-secondary rounded-xl items-center justify-center overflow-hidden">
                    {note.thumbnailUrl ? (
                        <Image source={{ uri: note.thumbnailUrl }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <FileText size={20} color="#9ca3af" />
                    )}
                    </View>
                <View className="flex-1">
                  <Text className="font-bold text-foreground text-sm mb-0.5" numberOfLines={2}>{note.title}</Text>
                  <Text className="text-xs text-muted-foreground">{note.subject} · {note.class}</Text>
                  <Text className="font-bold text-foreground text-sm mt-1">₹{unitPrice}<Text className="text-xs font-normal">/copy</Text></Text>
                </View>
                {qty === 0 ? (
                  <TouchableOpacity
                    onPress={() => setHardcopyQty((p) => ({ ...p, [note.id]: 1 }))}
                    className="bg-violet-600 rounded-xl px-3 py-2"
                  >
                    <Text className="text-white text-xs font-bold">Add</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => setHardcopyQty((p) => {
                        const next = { ...p };
                        if (next[note.id] <= 1) delete next[note.id];
                        else next[note.id]--;
                        return next;
                      })}
                      className="w-7 h-7 bg-secondary rounded-lg items-center justify-center"
                    >
                      <Text className="font-bold text-foreground">−</Text>
                    </TouchableOpacity>
                    <Text className="font-bold text-foreground text-sm w-5 text-center">{qty}</Text>
                    <TouchableOpacity
                      onPress={() => setHardcopyQty((p) => ({ ...p, [note.id]: (p[note.id] || 0) + 1 }))}
                      className="w-7 h-7 bg-violet-600 rounded-lg items-center justify-center"
                    >
                      <Text className="font-bold text-white">+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            notesLoading ? (
              <ActivityIndicator className="mt-10" color="#7c3aed" />
            ) : (
              <Text className="text-center text-muted-foreground mt-10">No notes found</Text>
            )
          }
        />
      )}

      {tab === "cart" && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="bg-card rounded-2xl border-2 border-border overflow-hidden mb-4">
            <View className="p-3.5 border-b border-border bg-secondary">
              <Text className="font-bold text-sm text-foreground">Cart ({cartItems.length} items)</Text>
            </View>
            {cartItems.length === 0 ? (
              <View className="p-8 items-center">
                <Text className="text-sm text-muted-foreground mb-3">Your cart is empty</Text>
                <TouchableOpacity onPress={() => setTab("fees")} className="bg-violet-600 px-4 py-2 rounded-xl">
                  <Text className="text-white text-xs font-bold">Browse Plans</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cartItems.map((item) => (
                <View key={item.id} className="flex-row justify-between p-3.5 border-b border-border">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm text-foreground">{item.name}{item.qty ? ` × ${item.qty}` : ""}</Text>
                    {item.qty && item.unitPrice ? (
                      <Text className="text-xs text-muted-foreground">₹{item.unitPrice} × {item.qty}</Text>
                    ) : null}
                  </View>
                  <Text className="font-bold text-foreground text-sm">₹{item.price.toLocaleString("en-IN")}</Text>
                </View>
              ))
            )}
          </View>

          {hasHardcopy && cartItems.length > 0 && (
            <View className="bg-card rounded-2xl border-2 border-border p-4 mb-4">
              <TouchableOpacity onPress={() => setShowAddress((v) => !v)} className="flex-row justify-between items-center">
                <Text className="font-bold text-sm text-foreground">
                  Delivery Address {!showAddress && address.name ? <Text className="text-violet-600 text-xs">✓ Filled</Text> : null}
                </Text>
                <ChevronDown size={16} color="#6b7280" style={{ transform: [{ rotate: showAddress ? "180deg" : "0deg" }] }} />
              </TouchableOpacity>
              {showAddress && (
                <View className="mt-3 gap-2">
                  <TextInput
                    value={address.name}
                    onChangeText={(v) => setAddress((a) => ({ ...a, name: v }))}
                    placeholder="Full Name"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                  />
                  <TextInput
                    value={address.phone}
                    onChangeText={(v) => setAddress((a) => ({ ...a, phone: v }))}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                  />
                  <TextInput
                    value={address.address}
                    onChangeText={(v) => setAddress((a) => ({ ...a, address: v }))}
                    placeholder="Full Address"
                    className="border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                  />
                  <View className="flex-row gap-2">
                    <TextInput
                      value={address.city}
                      onChangeText={(v) => setAddress((a) => ({ ...a, city: v }))}
                      placeholder="City"
                      className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                    />
                    <TextInput
                      value={address.pincode}
                      onChangeText={(v) => setAddress((a) => ({ ...a, pincode: v }))}
                      placeholder="PIN Code"
                      keyboardType="number-pad"
                      className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {cartItems.length > 0 && (
            <View className="bg-card rounded-2xl border-2 border-border p-4 mb-4">
              <Text className="font-bold text-sm text-foreground mb-3">🏷️ Coupon Code</Text>
              {appliedCoupon ? (
                <View className="flex-row items-center justify-between p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
                  <View>
                    <Text className="text-emerald-700 font-bold text-sm">{appliedCoupon.code}</Text>
                    <Text className="text-emerald-600 text-xs">{appliedCoupon.label} · Saved ₹{appliedCoupon.discount}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                    <X size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row gap-2">
                  <TextInput
                    value={couponCode}
                    onChangeText={(v) => { setCouponCode(v.toUpperCase()); setCouponError(""); }}
                    placeholder="Enter code"
                    autoCapitalize="characters"
                    className="flex-1 border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                  />
                  <TouchableOpacity
                    onPress={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="bg-violet-600 rounded-xl px-4 items-center justify-center flex-row gap-1.5"
                    style={{ opacity: couponLoading || !couponCode.trim() ? 0.5 : 1 }}
                  >
                    {couponLoading ? <ActivityIndicator color="#fff" size="small" /> : <Tag size={14} color="#fff" />}
                    <Text className="text-white text-xs font-bold">Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
              {couponError ? <Text className="text-red-600 text-xs mt-2">{couponError}</Text> : null}
            </View>
          )}

          {cartItems.length > 0 && (
            <View className="bg-card rounded-2xl border-2 border-border p-4">
              <Text className="font-bold text-base text-foreground mb-3">Order Summary</Text>
              <View className="gap-1.5 mb-4">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Subtotal</Text>
                  <Text className="text-sm text-muted-foreground">₹{subtotal.toLocaleString("en-IN")}</Text>
                </View>
                {couponDiscount > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-green-600">Discount</Text>
                    <Text className="text-sm text-green-600">-₹{couponDiscount.toLocaleString("en-IN")}</Text>
                  </View>
                )}
                {hasHardcopy && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">Delivery</Text>
                    <Text className="text-sm text-green-600 font-medium">FREE</Text>
                  </View>
                )}
                <View className="flex-row justify-between border-t border-border pt-2 mt-1">
                  <Text className="font-bold text-foreground text-base">Total</Text>
                  <Text className="font-bold text-violet-600 text-base">₹{total.toLocaleString("en-IN")}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleProceedToPayment}
                disabled={!meetsMinOrder}
                className="bg-violet-600 rounded-xl py-3.5 items-center flex-row justify-center gap-2"
                style={{ opacity: meetsMinOrder ? 1 : 0.5 }}
              >
                <Lock size={16} color="#fff" />
                <Text className="text-white font-bold text-sm">Proceed to Payment</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <PaymentMethodModal
        visible={showMethodModal}
        total={total}
        showCod={!hasOnlyFees}
        onClose={() => setShowMethodModal(false)}
        onSelect={handleSelectMethod}
      />
      <OrderSummaryModal
        visible={showSummaryModal}
        method={selectedMethod}
        cartItems={cartItems}
        subtotal={subtotal}
        couponDiscount={couponDiscount}
        couponCode={appliedCoupon?.code || null}
        total={total}
        hasHardcopy={hasHardcopy}
        address={address}
        submitting={placingOrder}
        onClose={() => { setShowSummaryModal(false); setSelectedMethod(null); }}
        onConfirm={handlePlaceOrder}
      />
      <QRPaymentModal
        visible={showQrModal}
        order={orderPlaced}
        onClose={() => { setShowQrModal(false); setOrderPlaced(null); setSelectedMethod(null); }}
        onSuccess={() => { setShowQrModal(false); resetCart(); }}
      />
      <TrackOrderModal visible={showTrackModal} onClose={() => setShowTrackModal(false)} />
    </SafeAreaView>
  );
}