import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Modal, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useCartStore, syncCartFromSupabase } from '../../store/useCartStore';
import { Minus, Plus, Trash2, ShoppingCart, ShieldCheck, Truck, ArrowLeft, CreditCard } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { usePaystack } from 'react-native-paystack-webview';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const { popup } = usePaystack();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    syncCartFromSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setFormData(prev => ({
          ...prev,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || ''
        }));
      }
    });
  }, []);

  const totalAmount = getTotal();
  const shippingCost = totalAmount >= 1000000 ? 0 : 15000;
  const finalTotal = totalAmount + shippingCost;

  const handleCheckoutSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.address || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // Hide modal so Webview can pop up over it cleanly
    setShowCheckout(false);

    popup.checkout({
      email: formData.email || 'customer@eagletech.com',
      amount: finalTotal, // amount is in Naira for react-native-paystack-webview v5 (sometimes)
      reference: `TXN_${new Date().getTime()}`,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
      onSuccess: (res: any) => {
        clearCart();
        Alert.alert('Success!', `Payment successful! Ref: ${res.transactionRef?.reference || res.reference}`);
        router.replace('/(tabs)');
      },
      onCancel: () => {
        Alert.alert('Payment Cancelled');
      }
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.details}>
        <View>
          <Text style={styles.name} numberOfLines={1}>{item.title || item.name}</Text>
          <Text style={styles.brand}>{item.brand || 'EagleTech'}</Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>₦{(item.price * item.cartQuantity).toLocaleString()}</Text>
          <View style={styles.qtyContainer}>
            <TouchableOpacity onPress={() => {
              if (item.cartQuantity > 1) updateQuantity(item.id, item.cartQuantity - 1);
              else removeItem(item.id);
            }} style={styles.btn}>
              {item.cartQuantity === 1 ? <Trash2 size={14} color="#ef4444" /> : <Minus size={14} color="#0f172a" />}
            </TouchableOpacity>
            <Text style={styles.qty}>{item.cartQuantity}</Text>
            <TouchableOpacity onPress={() => updateQuantity(item.id, item.cartQuantity + 1)} style={styles.btn}>
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
        {totalAmount >= 1000000 ? (
          <View style={styles.shippingRow}>
            <ShieldCheck color="#10b981" size={16} />
            <Text style={styles.shippingSuccess}>Free Premium Shipping Unlocked</Text>
          </View>
        ) : (
          <Text style={styles.shippingText}>
            Add <Text style={styles.shippingHighlight}>₦{(1000000 - totalAmount).toLocaleString()}</Text> more for Free Shipping
          </Text>
        )}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min((totalAmount / 1000000) * 100, 100)}%`, backgroundColor: totalAmount >= 1000000 ? '#10b981' : '#3b82f6' }]} />
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}><ShoppingCart color="#94a3b8" size={32} /></View>
            <Text style={styles.empty}>Your cart is empty.</Text>
          </View>
        }
      />
      
      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₦{totalAmount.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowCheckout(true)}>
            <Text style={styles.checkoutText}>Secure Checkout</Text>
          </TouchableOpacity>
          <View style={styles.secureRow}>
            <ShieldCheck color="#10b981" size={14} />
            <Text style={styles.secureText}>Secured with 256-bit Encryption</Text>
          </View>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal visible={showCheckout} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCheckout(false)} style={styles.iconBtn}>
              <ArrowLeft color="#0f172a" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Checkout</Text>
            <View style={{width: 40}} />
          </View>
          
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryVal}>₦{totalAmount.toLocaleString()}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Shipping</Text><Text style={styles.summaryVal}>{shippingCost === 0 ? 'Free' : `₦${shippingCost.toLocaleString()}`}</Text></View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}><Text style={styles.summaryTotalLabel}>Total</Text><Text style={styles.summaryTotalVal}>₦{finalTotal.toLocaleString()}</Text></View>
            </View>

            <Text style={styles.formTitle}>Shipping Details</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={formData.fullName} onChangeText={(t) => setFormData({...formData, fullName: t})} />
            <TextInput style={styles.input} placeholder="Email" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Phone Number" value={formData.phone} onChangeText={(t) => setFormData({...formData, phone: t})} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Delivery Address" value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} />
            <View style={styles.rowInputs}>
              <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="City" value={formData.city} onChangeText={(t) => setFormData({...formData, city: t})} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="State" value={formData.state} onChangeText={(t) => setFormData({...formData, state: t})} />
            </View>
            
            <TouchableOpacity style={styles.payBtn} onPress={handleCheckoutSubmit}>
              <CreditCard color="#fff" size={20} style={{marginRight: 8}} />
              <Text style={styles.payBtnText}>Pay ₦{finalTotal.toLocaleString()}</Text>
            </TouchableOpacity>
            <View style={{height: 40}} />
          </ScrollView>
        </KeyboardAvoidingView>

        
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  shippingBanner: { backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  shippingText: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  shippingHighlight: { color: '#3b82f6' },
  shippingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  shippingSuccess: { fontSize: 13, fontWeight: 'bold', color: '#10b981', marginLeft: 6 },
  progressBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  
  list: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80, opacity: 0.7 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  empty: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  
  cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#f1f5f9' },
  details: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  brand: { fontSize: 12, color: '#64748b', marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { color: '#3b82f6', fontWeight: '900', fontSize: 15 },
  
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, padding: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  btn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  qty: { fontSize: 14, fontWeight: 'bold', width: 24, textAlign: 'center' },
  
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  totalPrice: { fontSize: 24, fontWeight: '900', color: '#3b82f6' },
  checkoutBtn: { backgroundColor: '#0f172a', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secureRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, opacity: 0.6 },
  secureText: { fontSize: 11, fontWeight: '600', color: '#0f172a', marginLeft: 4 },
  
  // Modal Styles
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  modalScroll: { padding: 20 },
  
  summaryBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#64748b', fontSize: 14 },
  summaryVal: { fontWeight: '600', color: '#0f172a', fontSize: 14 },
  summaryTotalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  summaryTotalLabel: { fontWeight: 'bold', color: '#0f172a', fontSize: 16 },
  summaryTotalVal: { fontWeight: '900', color: '#3b82f6', fontSize: 18 },
  
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  input: { backgroundColor: '#fff', height: 50, borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15 },
  rowInputs: { flexDirection: 'row', marginBottom: 24 },
  
  payBtn: { backgroundColor: '#3b82f6', flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
