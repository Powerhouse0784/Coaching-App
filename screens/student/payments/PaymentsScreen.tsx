import { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, FlatList, ScrollView, ActivityIndicator, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ArrowLeft, GraduationCap, Printer, Wallet, Search, Tag, X,
  Check, ArrowRight, Lock, ChevronDown, FileText, Truck, AlertTriangle,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import api from "@/lib/api";
import type { FeePlan, PurchasableNote, CartItem, AddressForm, PaymentOrderFull } from "@/types";
import { useAuthStore } from "@/store/authStore";
import PaymentMethodModal from "@/components/payment/PaymentMethodModal";
import OrderSummaryModal from "@/components/payment/OrderSummaryModal";
import QRPaymentModal from "@/components/payment/QRPaymentModal";
import TrackOrderModal from "@/components/payment/TrackOrderModal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AnimatedPressable from "@/components/ui/AnimatedPressable";
import { colors, fonts, radius, spacing } from "@/constants/theme";

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

  const tabs = [
    { id: "fees" as const, label: "Fees", icon: GraduationCap },
    { id: "hardcopy" as const, label: "Notes", icon: Printer },
    { id: "cart" as const, label: cartItems.length > 0 ? `Cart (${cartItems.length})` : "Checkout", icon: Wallet },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <AnimatedPressable pressScale={0.9} onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={18} color={colors.ink} />
          </AnimatedPressable>
          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>Fees & Payments</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AnimatedPressable pressScale={0.92} onPress={() => setShowTrackModal(true)} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border }}>
            <Truck size={13} color={colors.inkMuted} />
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 11.5, color: colors.ink }}>Track</Text>
          </AnimatedPressable>
          <AnimatedPressable
            pressScale={0.92}
            onPress={() => setTab("cart")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.md, backgroundColor: tab === "cart" ? colors.indigo : colors.surface, borderWidth: tab === "cart" ? 0 : 1.5, borderColor: colors.border }}
          >
            <Wallet size={14} color={tab === "cart" ? colors.white : colors.inkMuted} />
            {cartItems.length > 0 && (
              <View style={{ backgroundColor: colors.coral, borderRadius: radius.pill, paddingHorizontal: 6, minWidth: 18, alignItems: "center" }}>
                <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 10 }}>{cartItems.length}</Text>
              </View>
            )}
          </AnimatedPressable>
        </View>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <AnimatedPressable
              key={id}
              pressScale={0.97}
              onPress={() => setTab(id)}
              style={{ flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: active ? colors.indigo : "transparent" }}
            >
              <Icon size={14} color={active ? colors.indigo : colors.inkFaint} />
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: active ? colors.indigo : colors.inkFaint }}>{label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {cartItems.length > 0 && !meetsMinOrder && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginTop: 12, padding: spacing.md, backgroundColor: colors.goldTint, borderRadius: radius.md, borderWidth: 1, borderColor: `${colors.gold}40` }}>
          <AlertTriangle size={14} color={colors.gold} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: "#8A6816", flex: 1 }}>
            Minimum order ₹{MIN_ORDER}. Add ₹{MIN_ORDER - total} more to proceed.
          </Text>
        </View>
      )}

      {tab === "fees" && (
        <FlatList
          data={plansForClass}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, marginBottom: spacing.md }}>Select Your Class</Text>
              {plansLoading ? (
                <ActivityIndicator color={colors.indigo} />
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={classes}
                  keyExtractor={(c) => c}
                  contentContainerStyle={{ gap: 8, marginBottom: spacing.lg }}
                  renderItem={({ item: cls }) => {
                    const active = selectedClass === cls;
                    return (
                      <AnimatedPressable pressScale={0.94} onPress={() => setSelectedClass(cls)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.lg, backgroundColor: active ? colors.indigo : colors.surface, borderWidth: active ? 0 : 1.5, borderColor: colors.border }}>
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12.5, color: active ? colors.white : colors.ink }}>{cls}</Text>
                      </AnimatedPressable>
                    );
                  }}
                />
              )}
              {selectedClass ? <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: spacing.md }}>Plans for {selectedClass}</Text> : null}
            </View>
          }
          renderItem={({ item: plan, index }) => {
            const isSelected = !!selectedPlans[plan.id];
            const save = plan.originalPrice - plan.price;
            const pct = Math.round((save / plan.originalPrice) * 100);
            return (
              <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 40)} style={{ marginHorizontal: 20, marginBottom: 12 }}>
                <Card onPress={() => setSelectedPlans((p) => ({ ...p, [plan.id]: !p[plan.id] }))} padding="md" style={isSelected ? { borderColor: colors.indigo, borderWidth: 1.5 } : undefined}>
                  {plan.popular && (
                    <View style={{ position: "absolute", top: 12, right: 12 }}>
                      <Badge label="★ Popular" tone="gold" />
                    </View>
                  )}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.md }}>
                    <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.indigoTint, alignItems: "center", justifyContent: "center" }}>
                      <GraduationCap size={17} color={colors.indigo} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink }}>{plan.subject}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }}>{plan.duration}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink }}>₹{plan.price.toLocaleString("en-IN")}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint, textDecorationLine: "line-through" }}>₹{plan.originalPrice.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md }}>
                    <Badge label={`${pct}% OFF`} tone="success" />
                    <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: colors.inkFaint }}>Save ₹{save.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={{ paddingVertical: 10, borderRadius: radius.sm, alignItems: "center", backgroundColor: isSelected ? colors.indigo : colors.surfaceMuted }}>
                    {isSelected ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Check size={14} color={colors.white} />
                        <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>Selected</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: colors.ink, fontFamily: fonts.bodySemibold, fontSize: 12 }}>Select</Text>
                        <ArrowRight size={14} color={colors.ink} />
                      </View>
                    )}
                  </View>
                </Card>
              </Animated.View>
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
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: spacing.md, backgroundColor: colors.goldTint, borderRadius: radius.md, borderWidth: 1, borderColor: `${colors.gold}40`, marginBottom: spacing.lg }}>
                <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" }}>
                  <Printer size={16} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 12, color: "#8A6816" }}>Order Printed Notes</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: "#8A6816" }}>Free delivery · 3–5 days</Text>
                </View>
              </View>
              <Input
                value={noteSearch}
                onChangeText={setNoteSearch}
                placeholder="Search notes…"
                leftIcon={<Search size={16} color={colors.inkFaint} />}
              />
              <View style={{ height: spacing.sm }} />
            </View>
          }
          renderItem={({ item: note, index }) => {
            const qty = hardcopyQty[note.id] || 0;
            const unitPrice = note.price || 30;
            return (
              <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 6) * 40)} style={{ marginHorizontal: 20, marginBottom: 12 }}>
                <Card padding="md">
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {note.thumbnailUrl ? (
                        <Image source={{ uri: note.thumbnailUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      ) : (
                        <FileText size={20} color={colors.inkFaint} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginBottom: 2 }} numberOfLines={2}>{note.title}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkMuted }}>{note.subject} · {note.class}</Text>
                      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginTop: 4 }}>
                        ₹{unitPrice}<Text style={{ fontFamily: fonts.body, fontSize: 11 }}>/copy</Text>
                      </Text>
                    </View>
                    {qty === 0 ? (
                      <AnimatedPressable pressScale={0.93} onPress={() => setHardcopyQty((p) => ({ ...p, [note.id]: 1 }))} style={{ backgroundColor: colors.indigo, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 9 }}>
                        <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>Add</Text>
                      </AnimatedPressable>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <AnimatedPressable
                          pressScale={0.9}
                          onPress={() => setHardcopyQty((p) => {
                            const next = { ...p };
                            if (next[note.id] <= 1) delete next[note.id];
                            else next[note.id]--;
                            return next;
                          })}
                          style={{ width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}
                        >
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink }}>−</Text>
                        </AnimatedPressable>
                        <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, width: 20, textAlign: "center" }}>{qty}</Text>
                        <AnimatedPressable pressScale={0.9} onPress={() => setHardcopyQty((p) => ({ ...p, [note.id]: (p[note.id] || 0) + 1 }))} style={{ width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.indigo, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.white }}>+</Text>
                        </AnimatedPressable>
                      </View>
                    )}
                  </View>
                </Card>
              </Animated.View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            notesLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.indigo} />
            ) : (
              <Text style={{ textAlign: "center", fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 40 }}>No notes found</Text>
            )
          }
        />
      )}

      {tab === "cart" && (
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          <Card padding={0} style={{ overflow: "hidden", marginBottom: spacing.lg }}>
            <View style={{ padding: spacing.md, backgroundColor: colors.surfaceMuted, borderBottomWidth: cartItems.length ? 1 : 0, borderBottomColor: colors.border }}>
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink }}>Cart ({cartItems.length} items)</Text>
            </View>
            {cartItems.length === 0 ? (
              <View style={{ padding: 32, alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginBottom: spacing.md }}>Your cart is empty</Text>
                <Button label="Browse Plans" onPress={() => setTab("fees")} size="sm" />
              </View>
            ) : (
              cartItems.map((item) => (
                <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>{item.name}{item.qty ? ` × ${item.qty}` : ""}</Text>
                    {item.qty && item.unitPrice ? (
                      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkMuted }}>₹{item.unitPrice} × {item.qty}</Text>
                    ) : null}
                  </View>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink }}>₹{item.price.toLocaleString("en-IN")}</Text>
                </View>
              ))
            )}
          </Card>

          {hasHardcopy && cartItems.length > 0 && (
            <Card padding="md" style={{ marginBottom: spacing.lg }}>
              <AnimatedPressable pressScale={0.99} onPress={() => setShowAddress((v) => !v)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink }}>
                  Delivery Address {!showAddress && address.name ? <Text style={{ color: colors.mint, fontSize: 11 }}>✓ Filled</Text> : null}
                </Text>
                <ChevronDown size={16} color={colors.inkMuted} style={{ transform: [{ rotate: showAddress ? "180deg" : "0deg" }] }} />
              </AnimatedPressable>
              {showAddress && (
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  <PlainField value={address.name} onChangeText={(v) => setAddress((a) => ({ ...a, name: v }))} placeholder="Full Name" />
                  <PlainField value={address.phone} onChangeText={(v) => setAddress((a) => ({ ...a, phone: v }))} placeholder="Phone" keyboardType="phone-pad" />
                  <PlainField value={address.address} onChangeText={(v) => setAddress((a) => ({ ...a, address: v }))} placeholder="Full Address" />
                  <View style={{ flexDirection: "row", gap: spacing.sm }}>
                    <PlainField value={address.city} onChangeText={(v) => setAddress((a) => ({ ...a, city: v }))} placeholder="City" style={{ flex: 1 }} />
                    <PlainField value={address.pincode} onChangeText={(v) => setAddress((a) => ({ ...a, pincode: v }))} placeholder="PIN Code" keyboardType="number-pad" style={{ flex: 1 }} />
                  </View>
                </View>
              )}
            </Card>
          )}

          {cartItems.length > 0 && (
            <Card padding="md" style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.md }}>
                <Tag size={14} color={colors.indigo} />
                <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink }}>Coupon Code</Text>
              </View>
              {appliedCoupon ? (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, backgroundColor: colors.mintTint, borderRadius: radius.md, borderWidth: 1, borderColor: `${colors.mint}40` }}>
                  <View>
                    <Text style={{ color: colors.mint, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{appliedCoupon.code}</Text>
                    <Text style={{ color: colors.mint, fontFamily: fonts.body, fontSize: 11 }}>{appliedCoupon.label} · Saved ₹{appliedCoupon.discount}</Text>
                  </View>
                  <AnimatedPressable pressScale={0.85} onPress={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                    <X size={16} color={colors.coral} />
                  </AnimatedPressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <PlainField value={couponCode} onChangeText={(v) => { setCouponCode(v.toUpperCase()); setCouponError(""); }} placeholder="Enter code" autoCapitalize="characters" />
                  </View>
                  <AnimatedPressable
                    pressScale={0.93}
                    onPress={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{ backgroundColor: colors.indigo, borderRadius: radius.md, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, opacity: couponLoading || !couponCode.trim() ? 0.5 : 1 }}
                  >
                    {couponLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Tag size={14} color={colors.white} />}
                    <Text style={{ color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 12 }}>Apply</Text>
                  </AnimatedPressable>
                </View>
              )}
              {couponError ? <Text style={{ color: colors.coral, fontFamily: fonts.body, fontSize: 11.5, marginTop: spacing.sm }}>{couponError}</Text> : null}
            </Card>
          )}

          {cartItems.length > 0 && (
            <Card padding="md">
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, marginBottom: spacing.md }}>Order Summary</Text>
              <View style={{ gap: 7, marginBottom: spacing.lg }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>Subtotal</Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>₹{subtotal.toLocaleString("en-IN")}</Text>
                </View>
                {couponDiscount > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mint }}>Discount</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.mint }}>-₹{couponDiscount.toLocaleString("en-IN")}</Text>
                  </View>
                )}
                {hasHardcopy && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted }}>Delivery</Text>
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.mint }}>FREE</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }}>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14.5, color: colors.ink }}>Total</Text>
                  <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 14.5, color: colors.indigo }}>₹{total.toLocaleString("en-IN")}</Text>
                </View>
              </View>
              <Button label="Proceed to Payment" icon={Lock} onPress={handleProceedToPayment} disabled={!meetsMinOrder} fullWidth size="lg" />
            </Card>
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

// Lightweight themed text field for the compact address/coupon rows —
// full Input component's label/error chrome would be too tall for these dense forms.
function PlainField(props: React.ComponentProps<typeof TextInput> & { style?: any }) {
  const { style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={colors.inkFaint}
      style={[
        { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonts.body, fontSize: 13, color: colors.ink, backgroundColor: colors.surface },
        style,
      ]}
      {...rest}
    />
  );
}
