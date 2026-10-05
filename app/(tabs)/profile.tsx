import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Mail, Calendar, Fingerprint, LogOut, Package, Clock, CheckCircle2, Heart } from 'lucide-react-native';
import { mockProducts } from '../../lib/data';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    
    if (!currentUser) {
      router.replace('/auth');
      return;
    }
    setUser(currentUser);

    // Fetch Orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
      
    if (ordersData) setOrders(ordersData);

    // Fetch Wishlist
    const { data: wishlistData } = await supabase
      .from('wishlist')
      .select('product_slug')
      .eq('user_id', currentUser.id);

    if (wishlistData) {
      const savedSlugs = wishlistData.map(w => w.product_slug);
      const savedProducts = mockProducts.filter(p => savedSlugs.includes(p.slug));
      setWishlist(savedProducts);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const handleConfirmReceipt = async (orderId: string) => {
    // We update directly since we don't have the secure action wrapper locally
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'DELIVERED' })
      .eq('id', orderId);
      
    if (!error) {
      Alert.alert('Success', 'Thank you! Order marked as delivered.');
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'DELIVERED' } : o));
    } else {
      Alert.alert('Error', 'Failed to confirm delivery');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) return null;

  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const displayName = user.user_metadata?.full_name || 'EagleTech User';
  const initial = displayName.charAt(0).toUpperCase();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PROCESSING': return '#3b82f6';
      case 'SHIPPED': return '#f97316';
      case 'DELIVERED': return '#10b981';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status: string, color: string) => {
    switch(status) {
      case 'PROCESSING': return <View style={[styles.pulseDot, {backgroundColor: color}]} />;
      case 'SHIPPED': return <Clock color={color} size={12} style={{marginRight: 4}} />;
      case 'DELIVERED': return <CheckCircle2 color={color} size={12} style={{marginRight: 4}} />;
      default: return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileTitleBlock}>
            <Text style={styles.displayName}>{displayName}</Text>
            <View style={styles.verifiedBadge}>
              <View style={styles.verifiedDot} />
              <Text style={styles.verifiedText}>Verified Account</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <View style={styles.iconWrapper}><Mail color="#64748b" size={20} /></View>
            <View style={{flex: 1}}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.iconWrapper}><Calendar color="#64748b" size={20} /></View>
            <View style={{flex: 1}}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{joinDate}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.iconWrapper}><Fingerprint color="#64748b" size={20} /></View>
            <View style={{flex: 1}}>
              <Text style={styles.infoLabel}>Account ID</Text>
              <Text style={[styles.infoValue, {fontFamily: 'Courier', fontSize: 11, opacity: 0.7}]} numberOfLines={1}>{user.id}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Orders Section */}
      <View style={styles.sectionHeader}>
        <Package color="#3b82f6" size={24} />
        <Text style={styles.sectionTitle}>Recent Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Package color="#cbd5e1" size={48} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your order history will appear here.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderMeta}>
                <Text style={styles.orderAmount}>₦{order.total_amount.toLocaleString()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.order_status)}15`, borderColor: `${getStatusColor(order.order_status)}30` }]}>
                  {getStatusIcon(order.order_status, getStatusColor(order.order_status))}
                  <Text style={[styles.statusText, { color: getStatusColor(order.order_status) }]}>{order.order_status}</Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
            </View>

            {order.order_status === 'SHIPPED' && (
              <TouchableOpacity 
                style={styles.confirmBtn}
                onPress={() => handleConfirmReceipt(order.id)}
              >
                <CheckCircle2 color="#fff" size={16} style={{marginRight: 8}} />
                <Text style={styles.confirmBtnText}>Confirm Delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Wishlist Section */}
      <View style={[styles.sectionHeader, { marginTop: 30 }]}>
        <Heart color="#ef4444" size={24} />
        <Text style={styles.sectionTitle}>Saved Items</Text>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyCard}>
          <Heart color="#cbd5e1" size={48} />
          <Text style={styles.emptyTitle}>Wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>Items you save will appear here.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
          {wishlist.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.wishlistCard}
              onPress={() => router.push(`/product/${item.slug}`)}
            >
              <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }} style={styles.wishlistImage} />
              <Text style={styles.wishlistName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.wishlistPrice}>₦{item.price.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
          <View style={{width: 40}} />
        </ScrollView>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <LogOut color="#ef4444" size={20} style={{marginRight: 8}} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  // Profile Card
  profileCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileTitleBlock: { marginLeft: 16 },
  displayName: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  verifiedText: { fontSize: 12, fontWeight: '600', color: '#10b981' },
  
  infoGrid: { gap: 12 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  infoLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  
  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginLeft: 8 },
  
  emptyCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  
  // Orders
  orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  orderMeta: { flex: 1 },
  orderAmount: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  orderDate: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  
  orderItems: { gap: 8 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center' },
  orderItemQty: { fontSize: 13, fontWeight: 'bold', color: '#64748b', width: 24 },
  orderItemName: { flex: 1, fontSize: 13, color: '#0f172a', marginRight: 12 },
  orderItemPrice: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  moreItems: { fontSize: 12, color: '#3b82f6', fontWeight: '600', marginTop: 4 },
  
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', padding: 12, borderRadius: 12, marginTop: 16 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  // Wishlist
  wishlistCard: { width: 140, backgroundColor: '#fff', borderRadius: 16, padding: 12, marginRight: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  wishlistImage: { width: '100%', height: 100, borderRadius: 12, backgroundColor: '#f8fafc', marginBottom: 12 },
  wishlistName: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginBottom: 4, height: 36 },
  wishlistPrice: { fontSize: 14, fontWeight: '900', color: '#3b82f6' },
  
  // Sign Out
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 16, borderRadius: 16, marginTop: 40, borderWidth: 1, borderColor: '#fecaca' },
  signOutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
});
