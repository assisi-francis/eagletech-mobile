import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mockProducts } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { ArrowLeft, ShoppingCart, ShieldCheck, RotateCcw, Truck, Check, Star } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  const [activeTab, setActiveTab] = React.useState('specs');
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = React.useState(true);

  React.useEffect(() => {
    const fetchReviews = async () => {
      const slug = id as string;
      const { data, error } = await supabase.from('reviews').select('*').eq('product_slug', slug).order('created_at', { ascending: false });
      if (data) setReviews(data);
      setLoadingReviews(false);
    };
    fetchReviews();
  }, [id]);

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
          {product.brand && (
            <View style={styles.brandBadgeAbsolute}>
              <Text style={styles.brandTextAbsolute}>{product.brand}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{product.title || product.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
            {product.price > 1000000 && (
              <View style={styles.freeShippingBadge}>
                <Truck color="#10b981" size={14} style={{ marginRight: 4 }} />
                <Text style={styles.freeShippingText}>Ships Free</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>{product.description}</Text>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <ShieldCheck color="#22c55e" size={20} />
              </View>
              <View>
                <Text style={styles.featureTitle}>1 Year Official Warranty</Text>
                <Text style={styles.featureDesc}>Backed by EagleTech Guarantee</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                <RotateCcw color="#f97316" size={20} />
              </View>
              <View>
                <Text style={styles.featureTitle}>7-Day Free Returns</Text>
                <Text style={styles.featureDesc}>No questions asked policy</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('specs')} style={[styles.tab, activeTab === 'specs' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'specs' && styles.activeTabText]}>TECH SPECS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('includes')} style={[styles.tab, activeTab === 'includes' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'includes' && styles.activeTabText]}>IN THE BOX</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('reviews')} style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>REVIEWS (${reviews.length})</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabContent}>
            {activeTab === 'specs' ? (
              <View>
                <View style={styles.specRow}><Text style={styles.specLabel}>Brand</Text><Text style={styles.specValue}>{product.brand || 'EagleTech'}</Text></View>
                <View style={styles.specRow}><Text style={styles.specLabel}>Category</Text><Text style={styles.specValue}>{product.category || 'Electronics'}</Text></View>
                <View style={styles.specRow}><Text style={styles.specLabel}>Stock</Text><Text style={styles.specValueSuccess}>In Stock ({product.stock_quantity || 10} available)</Text></View>
              </View>
            ) : (
              <View>
                <View style={styles.includesRow}><Check color="#0f172a" size={18} style={{marginRight: 8}}/><Text style={styles.includesText}>{product.title || product.name}</Text></View>
                <View style={styles.includesRow}><Check color="#0f172a" size={18} style={{marginRight: 8}}/><Text style={styles.includesText}>100W USB-C Power Adapter</Text></View>
                <View style={styles.includesRow}><Check color="#0f172a" size={18} style={{marginRight: 8}}/><Text style={styles.includesText}>Quick Start Guide</Text></View>
              </View>
            ) : activeTab === 'reviews' ? (
              <View>
                {loadingReviews ? (
                  <Text style={styles.emptyReviews}>Loading reviews...</Text>
                ) : reviews.length === 0 ? (
                  <Text style={styles.emptyReviews}>No reviews yet. Be the first to review!</Text>
                ) : (
                  reviews.map((r, i) => (
                    <View key={i} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewAuthor}>{r.user_name}</Text>
                        <View style={styles.starsRow}>
                          {[...Array(5)].map((_, idx) => (
                            <Star key={idx} color={idx < r.rating ? "#eab308" : "#e2e8f0"} fill={idx < r.rating ? "#eab308" : "transparent"} size={14} />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{r.comment}</Text>
                      <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
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
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#f1f5f9' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  scroll: { paddingBottom: 100 },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#f1f5f9', position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  brandBadgeAbsolute: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  brandTextAbsolute: { fontSize: 12, fontWeight: 'bold', color: '#000' },
  
  detailsContainer: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 12, lineHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  price: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  freeShippingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  freeShippingText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  
  description: { fontSize: 16, color: '#64748b', lineHeight: 26, marginBottom: 24 },
  
  featureGrid: { gap: 12, marginBottom: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', padding: 12, borderRadius: 16 },
  featureIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#64748b' },
  
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 16 },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#0f172a' },
  tabText: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
  activeTabText: { color: '#0f172a' },
  tabContent: { minHeight: 120 },
  
  specRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  specLabel: { width: 100, fontSize: 14, color: '#64748b' },
  specValue: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  specValueSuccess: { flex: 1, fontSize: 14, fontWeight: '600', color: '#10b981' },
  
  includesRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  includesText: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  
  emptyReviews: { fontSize: 14, color: '#64748b', fontStyle: 'italic', marginTop: 12 },
  reviewCard: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewAuthor: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 8 },
  reviewDate: { fontSize: 12, color: '#94a3b8' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  addToCartBtn: { backgroundColor: '#0f172a', flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
