import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCartStore, syncCartFromSupabase } from '../../store/useCartStore';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CreditCard,
  Tag,
  X,
  CheckCircle2,
  MapPin,
  Home,
  Briefcase,
  PlusCircle,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { usePaystack } from 'react-native-paystack-webview';
import { useRouter } from 'expo-router';
import { useAddressStore } from '../../store/useAddressStore';

interface Coupon {
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minSpend?: number;
}

const PROMO_CODES: Record<string, Coupon> = {
  WELCOME10: {
    code: 'WELCOME10',
    description: '10% off entire order',
    type: 'percentage',
    value: 10,
  },
  EAGLE5K: {
    code: 'EAGLE5K',
    description: '₦5,000 flat voucher discount',
    type: 'fixed',
    value: 5000,
    minSpend: 20000,
  },
  FREESHIP: {
    code: 'FREESHIP',
    description: '100% Free Nationwide Delivery',
    type: 'free_shipping',
    value: 0,
  },
};

export default function CartScreen() {
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const { popup } = usePaystack();
  const [user, setUser] = useState<any>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  const { addresses, selectedAddressId, setSelectedAddress, addAddress, getActiveAddress } = useAddressStore();
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrFullName, setNewAddrFullName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('Lagos');
  const [newAddrState, setNewAddrState] = useState('Lagos State');

  useEffect(() => {
    syncCartFromSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setFormData((prev) => ({
          ...prev,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || prev.fullName,
        }));
      }
    });

    const active = getActiveAddress();
    if (active) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || active.fullName,
        phone: prev.phone || active.phoneNumber,
        address: prev.address || active.street,
        city: prev.city || active.city,
        state: prev.state || active.state,
      }));
    }
  }, [selectedAddressId]);

  const handleSelectAddress = (addr: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setSelectedAddress(addr.id);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName,
      phone: addr.phoneNumber,
      address: addr.street,
      city: addr.city,
      state: addr.state,
    }));
  };

  const handleSaveNewAddress = () => {
    if (!newAddrFullName.trim() || !newAddrPhone.trim() || !newAddrStreet.trim()) {
      Alert.alert('Required Fields', 'Please fill in Full Name, Phone, and Street Address.');
      return;
    }
    addAddress({
      label: newAddrLabel,
      fullName: newAddrFullName.trim(),
      phoneNumber: newAddrPhone.trim(),
      street: newAddrStreet.trim(),
      city: newAddrCity.trim(),
      state: newAddrState.trim(),
      isDefault: false,
    });
    setFormData((prev) => ({
      ...prev,
      fullName: newAddrFullName.trim(),
      phone: newAddrPhone.trim(),
      address: newAddrStreet.trim(),
      city: newAddrCity.trim(),
      state: newAddrState.trim(),
    }));
    setShowAddAddressModal(false);
    setNewAddrFullName('');
    setNewAddrPhone('');
    setNewAddrStreet('');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  };

  const onRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setRefreshing(true);
    await syncCartFromSupabase();
    setRefreshing(false);
  };

  const totalAmount = getTotal();
  const baseShippingCost = totalAmount >= 1000000 ? 0 : 15000;

  // Calculate Discount & Final Shipping
  let discountAmount = 0;
  let shippingCost = baseShippingCost;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = Math.round((totalAmount * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discountAmount = Math.min(totalAmount, appliedCoupon.value);
    } else if (appliedCoupon.type === 'free_shipping') {
      shippingCost = 0;
      discountAmount = baseShippingCost;
    }
  }

  const finalTotal = Math.max(
    0,
    totalAmount - (appliedCoupon?.type !== 'free_shipping' ? discountAmount : 0) + shippingCost
  );

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponError('');

    const found = PROMO_CODES[code];
    if (!found) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      setCouponError('Invalid promo code. Try WELCOME10 or EAGLE5K');
      return;
    }

    if (found.minSpend && totalAmount < found.minSpend) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      setCouponError(`Requires minimum order of ₦${found.minSpend.toLocaleString()}`);
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    setAppliedCoupon(found);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleCheckoutSubmit = async () => {
    if (placingOrder) return;
    if (!formData.fullName || !formData.email || !formData.address || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Error', 'Please sign in to place an order');
      router.push('/auth');
      return;
    }

    setPlacingOrder(true);
    const paystackReference = `TXN_${new Date().getTime()}`;

    // Record order in Supabase with exact discounted total
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        total_amount: finalTotal,
        payment_status: 'PENDING',
        order_status: 'PENDING',
        shipping_address: `${formData.address}, ${formData.city}, ${formData.state}`,
        paystack_reference: paystackReference,
      })
      .select()
      .single();

    if (orderError || !order) {
      setPlacingOrder(false);
      Alert.alert(
        'Checkout Error',
        orderError?.message || 'Could not create your order. Please try again.'
      );
      return;
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.cartQuantity,
        unit_price: item.price,
      }))
    );
    if (itemsError) console.warn('order_items insert failed:', itemsError.message);

    setShowCheckout(false);

    popup.checkout({
      email: formData.email,
      amount: finalTotal, // Naira amount passed directly
      reference: paystackReference,
      onSuccess: async () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}

        const { error: confirmError } = await supabase
          .from('orders')
          .update({ payment_status: 'SUCCESSFUL', order_status: 'PROCESSING' })
          .eq('id', order.id);
        if (confirmError) console.warn('Failed to confirm order payment:', confirmError.message);

        clearCart();
        setAppliedCoupon(null);
        setPlacingOrder(false);
        Alert.alert('Success!', `Payment successful! Order Ref: ${paystackReference}`);
        router.replace('/(tabs)');
      },
      onCancel: () => {
        setPlacingOrder(false);
        Alert.alert('Payment Cancelled', 'Your order was saved as pending.');
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <Image
        source={{
          uri: item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/150',
        }}
        style={styles.image}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
      />
      <View style={styles.details}>
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {item.title || item.name}
          </Text>
          <Text style={styles.brand}>{item.brand || 'EagleTech'}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₦{(item.price * item.cartQuantity).toLocaleString()}</Text>
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                if (item.cartQuantity > 1) updateQuantity(item.id, item.cartQuantity - 1);
                else removeItem(item.id);
              }}
              style={styles.btn}
            >
              {item.cartQuantity === 1 ? (
                <Trash2 size={14} color="#ef4444" />
              ) : (
                <Minus size={14} color="#0f172a" />
              )}
            </TouchableOpacity>
            <Text style={styles.qty}>{item.cartQuantity}</Text>
            <TouchableOpacity
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                updateQuantity(item.id, item.cartQuantity + 1);
              }}
              style={styles.btn}
            >
              <Plus size={14} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Free Shipping Progress */}
      <View style={styles.shippingBanner}>
        {totalAmount >= 1000000 || (appliedCoupon && appliedCoupon.type === 'free_shipping') ? (
          <View style={styles.shippingRow}>
            <ShieldCheck color="#10b981" size={16} />
            <Text style={styles.shippingSuccess}>Free Premium Shipping Unlocked</Text>
          </View>
        ) : (
          <Text style={styles.shippingText}>
            Add{' '}
            <Text style={styles.shippingHighlight}>
              ₦{(1000000 - totalAmount).toLocaleString()}
            </Text>{' '}
            more for Free Shipping
          </Text>
        )}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min((totalAmount / 1000000) * 100, 100)}%`,
                backgroundColor:
                  totalAmount >= 1000000 || appliedCoupon?.type === 'free_shipping'
                    ? '#10b981'
                    : '#2563eb',
              },
            ]}
          />
        </View>
      </View>

      <FlatList
        refreshing={refreshing}
        onRefresh={onRefresh}
        data={items}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <ShoppingCart color="#94a3b8" size={32} />
            </View>
            <Text style={styles.empty}>Your cart is empty.</Text>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.promoSection}>
              <Text style={styles.promoTitle}>PROMO CODE & VOUCHERS</Text>

              {appliedCoupon ? (
                <View style={styles.appliedPill}>
                  <View style={styles.appliedPillLeft}>
                    <CheckCircle2 size={16} color="#10b981" style={{ marginRight: 6 }} />
                    <View>
                      <Text style={styles.appliedCodeText}>{appliedCoupon.code} Applied</Text>
                      <Text style={styles.appliedDescText}>{appliedCoupon.description}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleRemoveCoupon}
                    style={styles.removeCouponBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.couponInputRow}>
                    <Tag size={16} color="#94a3b8" style={{ marginLeft: 12, marginRight: 8 }} />
                    <TextInput
                      style={styles.couponInput}
                      placeholder="Enter promo code (e.g. WELCOME10)"
                      placeholderTextColor="#94a3b8"
                      value={couponInput}
                      onChangeText={(t) => {
                        setCouponInput(t);
                        setCouponError('');
                      }}
                      autoCapitalize="characters"
                      returnKeyType="done"
                      onSubmitEditing={() => handleApplyCoupon()}
                    />
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        !couponInput.trim() && styles.applyBtnDisabled,
                      ]}
                      disabled={!couponInput.trim()}
                      onPress={() => handleApplyCoupon()}
                    >
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  </View>

                  {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}

                  {/* Quick coupon hint pills */}
                  <View style={styles.hintsRow}>
                    <Text style={styles.hintLabel}>Tap to try:</Text>
                    {['WELCOME10', 'EAGLE5K', 'FREESHIP'].map((code) => (
                      <TouchableOpacity
                        key={code}
                        style={styles.hintPill}
                        onPress={() => handleApplyCoupon(code)}
                      >
                        <Text style={styles.hintPillText}>{code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : null
        }
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          {/* Summary Breakdown */}
          {appliedCoupon && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownVal}>₦{totalAmount.toLocaleString()}</Text>
            </View>
          )}

          {appliedCoupon && discountAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.discountLabel}>Discount ({appliedCoupon.code})</Text>
              <Text style={styles.discountVal}>-₦{discountAmount.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalPrice}>₦{finalTotal.toLocaleString()}</Text>
              {appliedCoupon && (
                <Text style={styles.originalPriceCrossed}>
                  ₦{(totalAmount + baseShippingCost).toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => setShowCheckout(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutText}>Secure Checkout</Text>
          </TouchableOpacity>
          <View style={styles.secureRow}>
            <ShieldCheck color="#10b981" size={14} />
            <Text style={styles.secureText}>Secured with Paystack 256-bit Encryption</Text>
          </View>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal visible={showCheckout} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckout(false)} style={styles.iconBtn}>
              <ArrowLeft color="#0f172a" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Checkout</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryVal}>₦{totalAmount.toLocaleString()}</Text>
              </View>
              {appliedCoupon && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#10b981', fontWeight: '700' }]}>
                    Promo Discount ({appliedCoupon.code})
                  </Text>
                  <Text style={[styles.summaryVal, { color: '#10b981', fontWeight: '700' }]}>
                    -₦{discountAmount.toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryVal}>
                  {shippingCost === 0 ? 'Free' : `₦${shippingCost.toLocaleString()}`}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Final Amount</Text>
                <Text style={styles.summaryTotalVal}>₦{finalTotal.toLocaleString()}</Text>
              </View>
            </View>

            {/* Saved Delivery Addresses Section */}
            <View style={styles.addressSectionHeader}>
              <View style={styles.addressSectionTitleRow}>
                <MapPin size={15} color="#2563eb" />
                <Text style={styles.addressSectionTitle}>SAVED DELIVERY ADDRESSES</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddAddressModal(true)}
                style={styles.addNewAddrBtn}
              >
                <PlusCircle size={13} color="#2563eb" style={{ marginRight: 4 }} />
                <Text style={styles.addNewAddrText}>+ Add New</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.savedAddressesScroll}
            >
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressCard,
                      isSelected && styles.addressCardSelected,
                    ]}
                    onPress={() => handleSelectAddress(addr)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.addressCardTop}>
                      <View style={styles.addressLabelBadge}>
                        {addr.label.toLowerCase().includes('work') || addr.label.toLowerCase().includes('office') ? (
                          <Briefcase size={11} color="#2563eb" style={{ marginRight: 4 }} />
                        ) : (
                          <Home size={11} color="#2563eb" style={{ marginRight: 4 }} />
                        )}
                        <Text style={styles.addressLabelText}>{addr.label}</Text>
                      </View>
                      {isSelected && (
                        <CheckCircle2 size={15} color="#2563eb" fill="#eff6ff" />
                      )}
                    </View>
                    <Text style={styles.addressCardName} numberOfLines={1}>
                      {addr.fullName}
                    </Text>
                    <Text style={styles.addressCardStreet} numberOfLines={2}>
                      {addr.street}, {addr.city}
                    </Text>
                    <Text style={styles.addressCardPhone}>{addr.phoneNumber}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.recipientInfoTitle}>Recipient & Delivery Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#94a3b8"
              value={formData.fullName}
              onChangeText={(t) => setFormData({ ...formData, fullName: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#94a3b8"
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#94a3b8"
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Delivery Street Address"
              placeholderTextColor="#94a3b8"
              value={formData.address}
              onChangeText={(t) => setFormData({ ...formData, address: t })}
            />
            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 10 }]}
                placeholder="City"
                placeholderTextColor="#94a3b8"
                value={formData.city}
                onChangeText={(t) => setFormData({ ...formData, city: t })}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="State"
                placeholderTextColor="#94a3b8"
                value={formData.state}
                onChangeText={(t) => setFormData({ ...formData, state: t })}
              />
            </View>

            <TouchableOpacity
              style={styles.payBtn}
              onPress={handleCheckoutSubmit}
              disabled={placingOrder}
            >
              <CreditCard color="#fff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.payBtnText}>
                {placingOrder ? 'Processing...' : `Pay ₦${finalTotal.toLocaleString()} with Paystack`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add New Address Modal */}
      <Modal
        visible={showAddAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddAddressModal(false)}
      >
        <View style={styles.addrModalOverlay}>
          <View style={styles.addrModalContent}>
            <View style={styles.addrModalHeader}>
              <Text style={styles.addrModalTitle}>Add Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddAddressModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Label Selector: Home / Work / Other */}
            <Text style={styles.addrInputLabel}>Address Label</Text>
            <View style={styles.labelPickerRow}>
              {['Home', 'Work / Office', 'Other'].map((lbl) => (
                <TouchableOpacity
                  key={lbl}
                  style={[
                    styles.labelPickerPill,
                    newAddrLabel === lbl && styles.labelPickerPillActive,
                  ]}
                  onPress={() => setNewAddrLabel(lbl)}
                >
                  <Text
                    style={[
                      styles.labelPickerPillText,
                      newAddrLabel === lbl && styles.labelPickerPillTextActive,
                    ]}
                  >
                    {lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.addrInputLabel}>Full Name</Text>
            <TextInput
              style={styles.addrInput}
              placeholder="e.g. John Adeleke"
              placeholderTextColor="#94a3b8"
              value={newAddrFullName}
              onChangeText={setNewAddrFullName}
            />

            <Text style={styles.addrInputLabel}>Phone Number</Text>
            <TextInput
              style={styles.addrInput}
              placeholder="e.g. +234 802 123 4567"
              placeholderTextColor="#94a3b8"
              value={newAddrPhone}
              onChangeText={setNewAddrPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.addrInputLabel}>Street Address</Text>
            <TextInput
              style={styles.addrInput}
              placeholder="Plot / Street / Building details"
              placeholderTextColor="#94a3b8"
              value={newAddrStreet}
              onChangeText={setNewAddrStreet}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrInputLabel}>City</Text>
                <TextInput
                  style={styles.addrInput}
                  placeholder="e.g. Ikeja"
                  placeholderTextColor="#94a3b8"
                  value={newAddrCity}
                  onChangeText={setNewAddrCity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrInputLabel}>State</Text>
                <TextInput
                  style={styles.addrInput}
                  placeholder="e.g. Lagos State"
                  placeholderTextColor="#94a3b8"
                  value={newAddrState}
                  onChangeText={setNewAddrState}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveAddrBtn}
              onPress={handleSaveNewAddress}
              activeOpacity={0.85}
            >
              <Text style={styles.saveAddrBtnText}>Save & Select Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  shippingBanner: {
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shippingText: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  shippingHighlight: { color: '#2563eb' },
  shippingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  shippingSuccess: { fontSize: 13, fontWeight: '700', color: '#10b981', marginLeft: 6 },
  progressBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  list: { padding: 16, paddingBottom: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.7 },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  empty: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },

  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#f1f5f9' },
  details: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  brand: { fontSize: 12, color: '#64748b', marginTop: 2 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: { color: '#2563eb', fontWeight: '900', fontSize: 15 },

  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  qty: { fontSize: 14, fontWeight: 'bold', width: 24, textAlign: 'center' },

  /* Promo Section */
  promoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  promoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    height: 44,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    paddingRight: 10,
  },
  applyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  couponErrorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  hintsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  hintLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  hintPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  hintPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  appliedPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  appliedDescText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  removeCouponBtn: {
    padding: 4,
  },

  /* Footer & Total */
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  discountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  discountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  totalPrice: { fontSize: 24, fontWeight: '900', color: '#2563eb' },
  originalPriceCrossed: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  checkoutBtn: {
    backgroundColor: '#0f172a',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    opacity: 0.7,
  },
  secureText: { fontSize: 11, fontWeight: '600', color: '#0f172a', marginLeft: 4 },

  // Modal Styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalScroll: { padding: 20 },

  summaryBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#64748b', fontSize: 13 },
  summaryVal: { fontWeight: '600', color: '#0f172a', fontSize: 13 },
  summaryTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryTotalLabel: { fontWeight: 'bold', color: '#0f172a', fontSize: 15 },
  summaryTotalVal: { fontWeight: '900', color: '#2563eb', fontSize: 18 },

  formTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  input: {
    backgroundColor: '#fff',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#0f172a',
  },
  rowInputs: { flexDirection: 'row', marginBottom: 20 },

  payBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  /* Address Section & Cards */
  addressSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  addNewAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  addNewAddrText: { fontSize: 11, fontWeight: '700', color: '#2563eb' },
  savedAddressesScroll: {
    gap: 10,
    paddingBottom: 14,
  },
  addressCard: {
    width: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  addressCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f7ff',
  },
  addressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressLabelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressLabelText: { fontSize: 10, fontWeight: '700', color: '#0f172a' },
  addressCardName: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  addressCardStreet: { fontSize: 11, color: '#64748b', lineHeight: 15, marginBottom: 4 },
  addressCardPhone: { fontSize: 11, fontWeight: '600', color: '#2563eb' },
  recipientInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 12,
  },

  /* Add Address Modal */
  addrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  addrModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  addrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addrModalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  addrInputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 5 },
  labelPickerRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  labelPickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  labelPickerPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  labelPickerPillText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  labelPickerPillTextActive: { color: '#ffffff' },
  addrInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12,
  },
  saveAddrBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveAddrBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
