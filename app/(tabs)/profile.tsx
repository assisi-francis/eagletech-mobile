import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import {
  Mail,
  Calendar,
  Fingerprint,
  LogOut,
  Package,
  Clock,
  CheckCircle2,
  Heart,
  Truck,
  ShieldCheck,
} from 'lucide-react-native';
import { useWishlistStore } from '../../store/useWishlistStore';
import {
  isBiometricSupported,
  isBiometricEnabled,
  setBiometricEnabled,
  promptBiometricAuth,
} from '../../lib/biometrics';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Placed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
];

function OrderTimeline({ status }: { status: string }) {
  const currentIndex = ORDER_STEPS.findIndex(
    (step) => step.key === (status || 'PENDING').toUpperCase()
  );
  const activeStep = currentIndex === -1 ? 0 : currentIndex;

  return (
    <View style={styles.timelineContainer}>
      <View style={styles.timelineRow}>
        {ORDER_STEPS.map((step, index) => {
          const isDone = index <= activeStep;
          const isCurrent = index === activeStep;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.timelineNode}>
                <View
                  style={[
                    styles.timelineDot,
                    isDone && styles.timelineDotDone,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={12} color="#ffffff" />
                  ) : (
                    <View style={styles.timelineInnerPending} />
                  )}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    isDone && styles.timelineLabelDone,
                    isCurrent && styles.timelineLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {index < ORDER_STEPS.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    index < activeStep && styles.timelineLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsActive, setBiometricsActive] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData();
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const supported = await isBiometricSupported();
    setBiometricsAvailable(supported);
    if (supported) {
      const active = await isBiometricEnabled();
      setBiometricsActive(active);
    }
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      const authenticated = await promptBiometricAuth();
      if (authenticated) {
        await setBiometricEnabled(true);
        setBiometricsActive(true);
      }
    } else {
      await setBiometricEnabled(false);
      setBiometricsActive(false);
    }
  };

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    if (!currentUser) {
      setUser(null);
      setLoading(false);
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
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    if (user) {
      await useWishlistStore.getState().fetchWishlist(user.id);
    }
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/auth');
  };

  const handleConfirmReceipt = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ order_status: 'DELIVERED' })
      .eq('id', orderId);

    if (!error) {
      Alert.alert('Success', 'Thank you! Order marked as delivered.');
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, order_status: 'DELIVERED' } : o)));
    } else {
      Alert.alert('Error', 'Failed to confirm delivery');
    }
  };

  const wishlistItems = useWishlistStore((state) => state.items);
  const [wishlist, setWishlist] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (wishlistItems.length > 0) {
      supabase
        .from('products')
        .select('*')
        .in('slug', wishlistItems)
        .then(({ data }) => setWishlist(data || []));
    } else {
      setWishlist([]);
    }
  }, [wishlistItems]);

  const getStatusColor = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'DELIVERED':
        return '#10b981';
      case 'SHIPPED':
        return '#3b82f6';
      case 'PROCESSING':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <Fingerprint color="#64748b" size={40} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Welcome to EagleTech</Text>
        <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 }}>
          Sign in to view your orders, sync your cart across devices, and manage your wishlist.
        </Text>
        <TouchableOpacity
          style={{ width: '100%', backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center' }}
          onPress={() => router.push('/auth')}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
      }
    >
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
            <View style={styles.iconWrapper}><Mail color="#64748b" size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.iconWrapper}><Calendar color="#64748b" size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{joinDate}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Security & Biometrics Card */}
      {biometricsAvailable && (
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <View style={styles.securityIconBox}>
              <Fingerprint color="#2563eb" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>Biometric Sign-In</Text>
              <Text style={styles.securitySubtitle}>
                Unlock and authenticate using Face ID or Fingerprint
              </Text>
            </View>
            <Switch
              value={biometricsActive}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={biometricsActive ? '#2563eb' : '#f1f5f9'}
            />
          </View>
        </View>
      )}

      {/* Orders Section */}
      <View style={styles.sectionHeader}>
        <Package color="#2563eb" size={22} />
        <Text style={styles.sectionTitle}>Order Tracking & History</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Package color="#cbd5e1" size={48} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your live order tracking will appear here.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderMeta}>
                <Text style={styles.orderAmount}>₦{order.total_amount.toLocaleString()}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: `${getStatusColor(order.order_status)}15`,
                      borderColor: `${getStatusColor(order.order_status)}30`,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(order.order_status) }]}>
                    {order.order_status || 'PENDING'}
                  </Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
            </View>

            {/* Visual 4-Step Status Tracker */}
            <OrderTimeline status={order.order_status || 'PENDING'} />

            {order.shipping_address && (
              <View style={styles.addressRow}>
                <Truck size={14} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.addressText} numberOfLines={1}>
                  Delivering to: {order.shipping_address}
                </Text>
              </View>
            )}

            {order.order_status === 'SHIPPED' && (
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => handleConfirmReceipt(order.id)}
              >
                <CheckCircle2 color="#fff" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.confirmBtnText}>Confirm Delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Wishlist Section */}
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <Heart color="#ef4444" size={22} />
        <Text style={styles.sectionTitle}>Saved Items ({wishlist.length})</Text>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyCard}>
          <Heart color="#cbd5e1" size={48} />
          <Text style={styles.emptyTitle}>Wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>Items you save will appear here.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
        >
          {wishlist.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.wishlistCard}
              onPress={() => router.push(`/product/${item.slug}`)}
            >
              <Image
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
                style={styles.wishlistImage}
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
              />
              <Text style={styles.wishlistName} numberOfLines={2}>
                {item.title || item.name}
              </Text>
              <Text style={styles.wishlistPrice}>₦{item.price.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ width: 40 }} />
        </ScrollView>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <LogOut color="#ef4444" size={18} style={{ marginRight: 8 }} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  profileTitleBlock: { marginLeft: 14 },
  displayName: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#10b981' },

  infoGrid: { gap: 10 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },

  // Security Card
  securityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  securitySubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    paddingRight: 8,
  },

  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

  // Orders
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderAmount: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
  orderDate: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  // Order Timeline
  timelineContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineNode: {
    alignItems: 'center',
    width: 60,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timelineDotDone: {
    backgroundColor: '#10b981',
  },
  timelineDotCurrent: {
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  timelineInnerPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  timelineLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },
  timelineLabelDone: {
    color: '#0f172a',
  },
  timelineLabelCurrent: {
    color: '#2563eb',
    fontWeight: '800',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: -4,
    marginBottom: 14,
  },
  timelineLineDone: {
    backgroundColor: '#10b981',
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 6,
  },
  addressText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },

  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  confirmBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Wishlist
  wishlistCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wishlistImage: { width: '100%', height: 110, borderRadius: 10, marginBottom: 8 },
  wishlistName: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 4, height: 32 },
  wishlistPrice: { fontSize: 13, fontWeight: '900', color: '#2563eb' },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 16,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  signOutText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
});
