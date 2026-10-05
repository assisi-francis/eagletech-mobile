import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useCartStore, syncCartFromSupabase } from '../../store/useCartStore';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();

  useEffect(() => {
    syncCartFromSupabase();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.title || item.name}</Text>
        <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, Math.max(1, item.cartQuantity - 1))} style={styles.btn}>
            <Minus size={16} color="#000" />
          </TouchableOpacity>
          <Text style={styles.qty}>{item.cartQuantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, item.cartQuantity + 1)} style={styles.btn}>
            <Plus size={16} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeItem(item.id)} style={[styles.btn, styles.deleteBtn]}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Your cart is empty.</Text>}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>₦{getTotal().toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} disabled={items.length === 0}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 15 },
  empty: { textAlign: 'center', marginTop: 50, color: '#64748b' },
  cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 10 },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9' },
  details: { flex: 1, marginLeft: 15, justifyContent: 'space-around' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  price: { color: '#3b82f6', fontWeight: 'bold' },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  btn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 5, marginRight: 10 },
  deleteBtn: { marginLeft: 'auto', backgroundColor: '#fee2e2' },
  qty: { fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, color: '#64748b' },
  totalPrice: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  checkoutBtn: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
