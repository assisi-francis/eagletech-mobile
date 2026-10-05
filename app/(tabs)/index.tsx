import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useCartStore } from '../../store/useCartStore';
import { mockProducts } from '../../lib/data';
import { ShoppingCart } from 'lucide-react-native';

export default function ShopScreen() {
  const addItem = useCartStore(state => state.addItem);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    // Simulate network delay to match web app loading experience
    setTimeout(() => {
      setProducts(mockProducts);
      setLoading(false);
    }, 500);
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
        {item.brand && (
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>{item.brand}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.title || item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>PRICE</Text>
            <Text style={styles.price}>₦{item.price?.toLocaleString()}</Text>
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={() => {
            addItem(item, 1);
            Alert.alert('Added', `${item.title || item.name} added to cart`);
          }}>
            <ShoppingCart color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(i) => i.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        numColumns={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  imageContainer: { width: '100%', aspectRatio: 4/3, borderRadius: 16, backgroundColor: '#f1f5f9', overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  brandBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  brandText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  info: { marginTop: 16, paddingHorizontal: 8 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  description: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  priceLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 2 },
  price: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  addButton: { backgroundColor: '#0f172a', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
