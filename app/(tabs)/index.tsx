import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useCartStore } from '../../store/useCartStore';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ShoppingCart } from 'lucide-react-native';

export default function ShopScreen() {
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${item.slug || item.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
        {item.brand && (
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>{item.brand}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.title || item.name}</Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.price}>₦{item.price?.toLocaleString()}</Text>
          
          <TouchableOpacity style={styles.addButton} onPress={(e) => {
            e.stopPropagation();
            addItem(item, 1);
            Alert.alert('Added', `${item.title || item.name} added to cart`);
          }}>
            <ShoppingCart color="#fff" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(i) => i.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f172a" colors={["#0f172a"]} />}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12 },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  imageContainer: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#f1f5f9', overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  brandBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  brandText: { fontSize: 9, fontWeight: 'bold', color: '#000' },
  info: { marginTop: 10, paddingHorizontal: 4, flex: 1, justifyContent: 'space-between' },
  name: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  addButton: { backgroundColor: '#0f172a', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
