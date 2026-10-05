import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useCartStore } from '../../store/useCartStore';
import { mockProducts } from '../../lib/data';
import { Plus } from 'lucide-react-native';

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
      <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.title || item.name}</Text>
        <Text style={styles.price}>₦{item.price?.toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => {
        addItem(item, 1);
        Alert.alert('Added', `${item.title || item.name} added to cart`);
      }}>
        <Plus color="#fff" size={20} />
      </TouchableOpacity>
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
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 10 },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 15, position: 'relative' },
  image: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f1f5f9', resizeMode: 'cover' },
  info: { marginTop: 10 },
  name: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  price: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold', marginTop: 4 },
  addButton: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#0f172a', borderRadius: 20, padding: 6 },
});
