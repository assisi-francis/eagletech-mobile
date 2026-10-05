import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mockProducts } from '../../lib/data';
import { useCartStore } from '../../store/useCartStore';
import { ArrowLeft, ShoppingCart } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  
  // Find product by slug or id
  const product = mockProducts.find(p => p.slug === id || p.id === id);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.images?.[0] || product.image_urls?.[0] || 'https://via.placeholder.com/400' }} 
            style={styles.image} 
          />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.brandRow}>
            {product.brand && (
              <View style={styles.brandBadge}>
                <Text style={styles.brandText}>{product.brand}</Text>
              </View>
            )}
            <Text style={styles.stockText}>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</Text>
          </View>

          <Text style={styles.title}>{product.title || product.name}</Text>
          <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.addToCartBtn}
          onPress={() => {
            addItem(product as any, 1);
            Alert.alert('Success', `${product.title || product.name} added to cart`);
          }}
        >
          <ShoppingCart color="#fff" size={20} style={{ marginRight: 10 }} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#0f172a', marginBottom: 20 },
  backBtn: { padding: 12, backgroundColor: '#0f172a', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  scroll: { paddingBottom: 100 },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  detailsContainer: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brandBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  brandText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
  stockText: { fontSize: 13, color: '#10b981', fontWeight: '600' },
  
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#3b82f6', marginBottom: 24 },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  description: { fontSize: 15, color: '#64748b', lineHeight: 24 },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  addToCartBtn: { backgroundColor: '#0f172a', flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
