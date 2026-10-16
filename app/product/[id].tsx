import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useProductStore } from '../../store/useProductStore';
import {
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  RotateCcw,
  Truck,
  Check,
  Star,
  Heart,
  Share2,
  Minus,
  Plus,
  Zap,
} from 'lucide-react-native';
import { Toast } from '../../components/Toast';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const allProducts = useProductStore((state) => state.products);

  const [activeTab, setActiveTab] = useState('specs');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { items: wishlistItems, toggleWishlist } = useWishlistStore();
  const slug = id as string;
  const isSaved = wishlistItems.includes(slug);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [product, setProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const screenWidth = Dimensions.get('window').width;

  const handleSaveForLater = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Sign In Required', 'Please sign in to save products to your wishlist.');
      router.push('/auth');
      return;
    }
    setSaving(true);
    const added = await toggleWishlist(slug, session.user.id);
    setToastMessage(added ? 'Saved to Wishlist' : 'Removed from Wishlist');
    setShowToast(true);
    setSaving(false);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_slug', slug)
        .order('created_at', { ascending: false });
      if (data) setReviews(data);
      setLoadingReviews(false);
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', id)
          .single();
        if (error) console.error('Supabase Error:', error);
        setProduct(data);
      } catch (e) {
        console.error('Crash in fetchProduct:', e);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loadingProduct) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

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

  const images: string[] =
    product.images && product.images.length > 0
      ? product.images
      : product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : ['https://via.placeholder.com/400'];

  const relatedProducts = allProducts
    .filter((p) => p.slug !== id && p.id !== product?.id)
    .slice(0, 4);

  const handleShare = async () => {
    if (!product) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Check out ${product.title || product.name} on EagleTech Store!\nPrice: ₦${product.price?.toLocaleString()}\nhttps://eagletech-store.vercel.app/product/${product.slug || product.id}`,
        title: product.title || product.name,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const handleAddToCart = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    addItem(product as any, quantity);
    setToastMessage(`${quantity}x ${product.title || product.name} added to cart`);
    setShowToast(true);
  };

  const handleBuyNow = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    addItem(product as any, quantity);
    router.push('/(tabs)/cart');
  };

  const maxStock = product.stock_quantity || 15;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft color="#0f172a" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Share2 color="#0f172a" size={19} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Multi-Image Horizontal Swipe Carousel */}
        <View style={styles.carouselWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setActiveImageIndex(newIndex);
            }}
          >
            {images.map((imgUri, index) => (
              <View key={index} style={{ width: screenWidth, aspectRatio: 1 }}>
                <Image
                  source={{ uri: imgUri }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>
            ))}
          </ScrollView>

          {/* Brand Badge */}
          {product.brand && (
            <View style={styles.brandBadgeAbsolute}>
              <Text style={styles.brandTextAbsolute}>{product.brand}</Text>
            </View>
          )}

          {/* Image Counter Badge */}
          {images.length > 1 && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {activeImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}

          {/* Wishlist Heart Button */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={handleSaveForLater}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Heart
              color={isSaved ? '#ef4444' : '#64748b'}
              fill={isSaved ? '#ef4444' : 'transparent'}
              size={22}
            />
          </TouchableOpacity>

          {/* Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{product.title || product.name}</Text>

          {/* Price & Shipping Row */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₦{Number(product.price || 0).toLocaleString()}</Text>
            {product.price > 1000000 && (
              <View style={styles.freeShippingBadge}>
                <Truck color="#10b981" size={13} style={{ marginRight: 4 }} />
                <Text style={styles.freeShippingText}>Free Delivery</Text>
              </View>
            )}
          </View>

          {/* Quantity Stepper Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                disabled={quantity <= 1}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setQuantity((q) => Math.max(1, q - 1));
                }}
              >
                <Minus size={15} color={quantity <= 1 ? '#cbd5e1' : '#0f172a'} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.stepperBtn, quantity >= maxStock && styles.stepperBtnDisabled]}
                disabled={quantity >= maxStock}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setQuantity((q) => Math.min(maxStock, q + 1));
                }}
              >
                <Plus size={15} color={quantity >= maxStock ? '#cbd5e1' : '#0f172a'} />
              </TouchableOpacity>
            </View>
            <Text style={styles.stockNote}>
              {maxStock > 5 ? `${maxStock} in stock` : `Only ${maxStock} left!`}
            </Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          {/* Guarantee Badges */}
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconContainer,
                  { backgroundColor: 'rgba(37, 99, 235, 0.1)' },
                ]}
              >
                <ShieldCheck color="#2563eb" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>1-Year Official Warranty</Text>
                <Text style={styles.featureDesc}>100% genuine tech with direct replacement</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconContainer,
                  { backgroundColor: 'rgba(249, 115, 22, 0.1)' },
                ]}
              >
                <RotateCcw color="#f97316" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>7-Day Free Returns</Text>
                <Text style={styles.featureDesc}>Hassle-free exchange policy</Text>
              </View>
            </View>
          </View>

          {/* Specs / Included / Reviews Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('specs')}
              style={[styles.tab, activeTab === 'specs' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'specs' && styles.activeTabText]}>
                TECH SPECS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('includes')}
              style={[styles.tab, activeTab === 'includes' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'includes' && styles.activeTabText]}>
                IN THE BOX
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('reviews')}
              style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                REVIEWS ({reviews.length})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'specs' ? (
              <View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Brand</Text>
                  <Text style={styles.specValue}>{product.brand || 'EagleTech'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Category</Text>
                  <Text style={styles.specValue}>{product.category || 'Electronics'}</Text>
                </View>
                <View style={styles.specRow}>
                  <Text style={styles.specLabel}>Condition</Text>
                  <Text style={styles.specValueSuccess}>Brand New • Factory Sealed</Text>
                </View>
              </View>
            ) : activeTab === 'includes' ? (
              <View>
                <View style={styles.includesRow}>
                  <Check color="#0f172a" size={17} style={{ marginRight: 8 }} />
                  <Text style={styles.includesText}>{product.title || product.name}</Text>
                </View>
                <View style={styles.includesRow}>
                  <Check color="#0f172a" size={17} style={{ marginRight: 8 }} />
                  <Text style={styles.includesText}>Official Documentation & Warranty Card</Text>
                </View>
                <View style={styles.includesRow}>
                  <Check color="#0f172a" size={17} style={{ marginRight: 8 }} />
                  <Text style={styles.includesText}>Original Factory Packaging</Text>
                </View>
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
                            <Star
                              key={idx}
                              color={idx < r.rating ? '#eab308' : '#e2e8f0'}
                              fill={idx < r.rating ? '#eab308' : 'transparent'}
                              size={14}
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{r.comment}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>

          {/* "You May Also Like" / Related Products Section */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedHeaderTitle}>YOU MAY ALSO LIKE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedList}
              >
                {relatedProducts.map((relItem) => {
                  const relAny = relItem as any;
                  const relImage =
                    relItem.images?.[0] ||
                    relAny.image_urls?.[0] ||
                    'https://via.placeholder.com/150';
                  return (
                    <TouchableOpacity
                      key={relItem.id}
                      style={styles.relatedCard}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/product/${relItem.slug || relItem.id}`)}
                    >
                      <Image
                        source={{ uri: relImage }}
                        style={styles.relatedImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                      <Text style={styles.relatedTitle} numberOfLines={2}>
                        {relItem.title || relAny.name}
                      </Text>
                      <Text style={styles.relatedPrice}>
                        ₦{Number(relItem.price || 0).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dual Action Footer: [ Add to Cart ] + [ ⚡ Buy Now ] */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartBtn}
          activeOpacity={0.85}
          onPress={handleAddToCart}
        >
          <ShoppingCart color="#0f172a" size={18} style={{ marginRight: 6 }} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowBtn}
          activeOpacity={0.85}
          onPress={handleBuyNow}
        >
          <Zap color="#ffffff" size={17} style={{ marginRight: 6 }} fill="#ffffff" />
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        showViewCart={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#0f172a', marginBottom: 20 },
  backBtn: { padding: 12, backgroundColor: '#0f172a', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },

  scroll: { paddingBottom: 110 },
  carouselWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  brandBadgeAbsolute: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandTextAbsolute: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  counterBadge: {
    position: 'absolute',
    top: 16,
    right: 66,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 38,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#2563eb',
  },

  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  price: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
  freeShippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeShippingText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },

  /* Quantity Stepper */
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    minWidth: 32,
    textAlign: 'center',
  },
  stockNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 'auto',
  },

  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 20,
  },

  featureGrid: {
    gap: 10,
    marginBottom: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 12,
    borderRadius: 14,
  },
  featureIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  featureDesc: { fontSize: 11, color: '#64748b' },

  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#2563eb' },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.8 },
  activeTabText: { color: '#2563eb' },
  tabContent: { minHeight: 100 },

  specRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  specLabel: { width: 100, fontSize: 13, color: '#64748b' },
  specValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0f172a' },
  specValueSuccess: { flex: 1, fontSize: 13, fontWeight: '600', color: '#10b981' },

  includesRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  includesText: { fontSize: 13, fontWeight: '500', color: '#0f172a' },

  emptyReviews: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 10 },
  reviewCard: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAuthor: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 6 },
  reviewDate: { fontSize: 11, color: '#94a3b8' },

  /* Related Products */
  relatedSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  relatedHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  relatedList: {
    gap: 12,
  },
  relatedCard: {
    width: 130,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  relatedImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  relatedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    height: 32,
    lineHeight: 16,
    marginBottom: 4,
  },
  relatedPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563eb',
  },

  /* Dual Action Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  buyNowBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buyNowText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
