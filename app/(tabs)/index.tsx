import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ShoppingCart,
  Search,
  X,
  ArrowDown,
  ArrowUp,
  Sparkles,
  PackageOpen,
  Truck,
  ShieldCheck,
  Lock,
  RotateCcw,
  MessageCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';
import { useProductStore } from '../../store/useProductStore';
import { ProductSkeleton } from '../../components/ProductSkeleton';
import { Toast } from '../../components/Toast';

type SortOption = 'featured' | 'price-asc' | 'price-desc';

const HERO_BANNERS = [
  {
    id: 'starlink',
    badge: 'POPULAR HARDWARE',
    title: 'Starlink Standard Kit',
    subtitle: 'High-speed satellite internet in stock with nationwide dispatch',
    tag: 'From ₦599,000',
    category: 'Networking',
    icon: Sparkles,
    gradientColors: ['#0f172a', '#1e293b'],
    accentColor: '#38bdf8',
  },
  {
    id: 'laptops',
    badge: '1-YEAR WARRANTY',
    title: 'Pro Laptops & Workstations',
    subtitle: 'MacBooks, Dell XPS & ThinkPads verified with authentic warranty',
    tag: 'Top Performance',
    category: 'Laptops',
    icon: Sparkles,
    gradientColors: ['#1e1b4b', '#1e3a8a'],
    accentColor: '#60a5fa',
  },
  {
    id: 'freeship',
    badge: 'NATIONWIDE OFFER',
    title: 'Free Shipping on ₦1M+',
    subtitle: 'Safe, insured doorstep courier to all 36 states across Nigeria',
    tag: 'Auto-Applied',
    category: 'All',
    icon: Truck,
    gradientColors: ['#064e3b', '#0f172a'],
    accentColor: '#34d399',
  },
];

export default function ShopScreen() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { products, categories, isLoading, fetchProducts } = useProductStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-slide hero banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => {
        const next = (prev + 1) % HERO_BANNERS.length;
        heroScrollRef.current?.scrollTo({
          x: next * (Dimensions.get('window').width - 16),
          animated: true,
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    setRefreshing(true);
    await fetchProducts(true);

    try {
      const { syncCartFromSupabase } = require('../../store/useCartStore');
      const { useWishlistStore } = require('../../store/useWishlistStore');
      const { supabase } = require('../../lib/supabase');

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await syncCartFromSupabase();
        await useWishlistStore.getState().fetchWishlist(session.user.id);
      }
    } catch (e) {
      console.warn('Silent refresh error:', e);
    }

    setRefreshing(false);
  };

  const handleCategorySelect = (category: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setSelectedCategory(category);
  };

  const handleSortChange = (newSort: SortOption) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setSortBy(newSort);
  };

  const filteredProducts = useMemo(() => {
    // 1. Filter by Category & Search Query
    const list = products.filter((item) => {
      const itemCat = (item.category || '').toLowerCase();
      const targetCat = selectedCategory.toLowerCase();
      let matchesCategory = selectedCategory === 'All' || itemCat === targetCat;
      if (!matchesCategory && targetCat === 'accessories' && itemCat === 'storage') {
        matchesCategory = true;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const titleMatch = (item.title || (item as any).name || '').toLowerCase().includes(query);
      const brandMatch = (item.brand || '').toLowerCase().includes(query);
      const descMatch = (item.description || '').toLowerCase().includes(query);
      const catMatch = (item.category || '').toLowerCase().includes(query);

      return matchesCategory && (titleMatch || brandMatch || descMatch || catMatch);
    });

    // 2. Sort by Selected Order
    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }
    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const listRef = useRef<any>(null);

  const handleWhatsAppSupport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const message = encodeURIComponent(
      'Hello EagleTech! I am browsing the mobile app and would like to inquire about gadget recommendations and availability.'
    );
    const whatsappUrl = `https://wa.me/2347067774818?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(`https://wa.me/2347067774818?text=${message}`);
      }
    } catch (e) {
      Linking.openURL(`https://wa.me/2347067774818?text=${message}`).catch(() => {});
    }
  };

  const handleBackToTop = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleAddToCart = (item: any) => {
    addItem(item, 1);
    setToastMessage(`${item.title || item.name || 'Item'} added to cart`);
    setShowToast(true);
  };

  const renderListFooter = () => {
    if (filteredProducts.length === 0) return null;

    return (
      <View style={styles.footerWrapper}>
        {/* 1. Value & Trust Guarantee Strip */}
        <View style={styles.trustCard}>
          <Text style={styles.trustHeaderTitle}>WHY SHOP WITH EAGLETECH</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <View style={styles.trustIconContainer}>
                <Truck size={17} color="#2563eb" />
              </View>
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>Nationwide Delivery</Text>
                <Text style={styles.trustSubtitle}>Fast, insured dispatch across Nigeria</Text>
              </View>
            </View>

            <View style={styles.trustItem}>
              <View style={styles.trustIconContainer}>
                <ShieldCheck size={17} color="#2563eb" />
              </View>
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>1-Year Warranty</Text>
                <Text style={styles.trustSubtitle}>100% verified authentic tech</Text>
              </View>
            </View>

            <View style={styles.trustItem}>
              <View style={styles.trustIconContainer}>
                <Lock size={17} color="#2563eb" />
              </View>
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>Secure Checkout</Text>
                <Text style={styles.trustSubtitle}>Paystack 256-bit SSL encrypted</Text>
              </View>
            </View>

            <View style={styles.trustItem}>
              <View style={styles.trustIconContainer}>
                <RotateCcw size={17} color="#2563eb" />
              </View>
              <View style={styles.trustTextCol}>
                <Text style={styles.trustTitle}>7-Day Returns</Text>
                <Text style={styles.trustSubtitle}>Hassle-free replacement policy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. WhatsApp Tech Concierge / "Need Help Choosing?" CTA Card */}
        <View style={styles.conciergeCard}>
          <View style={styles.conciergeBadge}>
            <Sparkles size={11} color="#38bdf8" />
            <Text style={styles.conciergeBadgeText}>EXPERT TECH SUPPORT</Text>
          </View>
          <Text style={styles.conciergeTitle}>Need help picking the right gadget?</Text>
          <Text style={styles.conciergeSubtitle}>
            Chat directly with an EagleTech specialist on WhatsApp for custom specs, device recommendations, and instant quotes.
          </Text>
          <TouchableOpacity
            style={styles.whatsAppBtn}
            activeOpacity={0.85}
            onPress={handleWhatsAppSupport}
          >
            <MessageCircle size={18} color="#ffffff" />
            <Text style={styles.whatsAppBtnText}>Chat on WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Catalog Completion Milestone + Back to Top */}
        <View style={styles.milestoneSection}>
          <View style={styles.dividerLine} />
          <View style={styles.milestonePill}>
            <Text style={styles.milestoneText}>
              ✦ You've viewed all {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backToTopBtn}
            activeOpacity={0.8}
            onPress={handleBackToTop}
          >
            <ArrowUp size={14} color="#0f172a" />
            <Text style={styles.backToTopText}>Back to Top</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Brand Footer & Version */}
        <View style={styles.brandFooter}>
          <View style={styles.footerLogoContainer}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.footerLogoImage}
              contentFit="cover"
            />
          </View>
          <Text style={styles.footerBrandName}>
            EAGLE<Text style={styles.footerBrandHighlight}>TECH</Text>
          </Text>
          <Text style={styles.footerTagline}>Hardware • Networking • Enterprise IT</Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} EagleTech Store • v1.0.0
          </Text>
          <Text style={styles.footerLocation}>Lagos, Nigeria • All Rights Reserved</Text>
        </View>
      </View>
    );
  };

  const renderProduct = ({ item }: { item: any }) => {
    const imageUrl =
      item.images?.[0] || item.image_urls?.[0] || 'https://via.placeholder.com/300';

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push(`/product/${item.slug || item.id}`)}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            {item.brand && (
              <View style={styles.brandBadge}>
                <Text style={styles.brandText}>{item.brand}</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>
              {item.title || item.name}
            </Text>

            <View style={styles.footerRow}>
              <Text style={styles.price}>₦{Number(item.price || 0).toLocaleString()}</Text>

              <TouchableOpacity
                style={styles.addButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart(item);
                }}
              >
                <ShoppingCart color="#fff" size={15} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Zero-wait: Only show skeleton if we have no cached products at all
  if (products.length === 0 && isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <View style={styles.searchBarPlaceholder} />
        </View>
        <ProductSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={filteredProducts}
        extraData={`${selectedCategory}-${sortBy}-${filteredProducts.length}`}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0f172a"
            colors={['#0f172a']}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search laptops, phones, accessories..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* Hero Promo Banner Carousel */}
            <View style={styles.heroCarouselContainer}>
              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={(e) => {
                  const slideWidth = Dimensions.get('window').width - 16;
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
                  setActiveHeroIndex(newIndex);
                }}
              >
                {HERO_BANNERS.map((banner) => {
                  const IconComp = banner.icon;
                  return (
                    <TouchableOpacity
                      key={banner.id}
                      style={[
                        styles.heroBannerCard,
                        { backgroundColor: banner.gradientColors[0] },
                      ]}
                      activeOpacity={0.9}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch (e) {}
                        if (banner.category !== 'All') {
                          setSelectedCategory(banner.category);
                        }
                      }}
                    >
                      <View style={styles.heroCardContent}>
                        <View
                          style={[
                            styles.heroBadge,
                            { borderColor: banner.accentColor },
                          ]}
                        >
                          <IconComp size={10} color={banner.accentColor} style={{ marginRight: 4 }} />
                          <Text style={[styles.heroBadgeText, { color: banner.accentColor }]}>
                            {banner.badge}
                          </Text>
                        </View>
                        <Text style={styles.heroTitle} numberOfLines={1}>
                          {banner.title}
                        </Text>
                        <Text style={styles.heroSubtitle} numberOfLines={2}>
                          {banner.subtitle}
                        </Text>
                        <View style={styles.heroTagRow}>
                          <View style={styles.heroTagPill}>
                            <Text style={styles.heroTagText}>{banner.tag}</Text>
                          </View>
                          <View style={styles.heroExploreRow}>
                            <Text style={[styles.heroExploreText, { color: banner.accentColor }]}>
                              Explore
                            </Text>
                            <ChevronRight size={13} color={banner.accentColor} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Indicator Dots */}
              <View style={styles.heroDotsContainer}>
                {HERO_BANNERS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heroDot,
                      i === activeHeroIndex && styles.heroDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Category Filter Pills (All, Laptops, Phones, Accessories, Networking, Storage) */}
            <ScrollView
              horizontal
              nestedScrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              directionalLockEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.categoriesScrollView}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sort & Results Bar (Featured, Price: Low, Price: High) */}
            <View style={styles.sortBar}>
              <View style={styles.sortPills}>
                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'featured' && styles.sortPillActive]}
                  onPress={() => handleSortChange('featured')}
                  activeOpacity={0.7}
                >
                  <Sparkles
                    size={11}
                    color={sortBy === 'featured' ? '#ffffff' : '#64748b'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.sortPillText,
                      sortBy === 'featured' && styles.sortPillTextActive,
                    ]}
                  >
                    Featured
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'price-asc' && styles.sortPillActive]}
                  onPress={() => handleSortChange('price-asc')}
                  activeOpacity={0.7}
                >
                  <ArrowDown
                    size={11}
                    color={sortBy === 'price-asc' ? '#ffffff' : '#64748b'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.sortPillText,
                      sortBy === 'price-asc' && styles.sortPillTextActive,
                    ]}
                  >
                    Price: Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'price-desc' && styles.sortPillActive]}
                  onPress={() => handleSortChange('price-desc')}
                  activeOpacity={0.7}
                >
                  <ArrowUp
                    size={11}
                    color={sortBy === 'price-desc' ? '#ffffff' : '#64748b'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.sortPillText,
                      sortBy === 'price-desc' && styles.sortPillTextActive,
                    ]}
                  >
                    Price: High
                  </Text>
                </TouchableOpacity>
              </View>

              {(searchQuery.length > 0 || selectedCategory !== 'All' || sortBy !== 'featured') && (
                <TouchableOpacity
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch (e) {}
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSortBy('featured');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.resetText}>Reset All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Results Count */}
            <Text style={styles.metaText}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}{' '}
              {selectedCategory !== 'All' ? `in ${selectedCategory}` : ''}
              {sortBy === 'price-asc'
                ? ' • Lowest Price First'
                : sortBy === 'price-desc'
                ? ' • Highest Price First'
                : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <PackageOpen size={36} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find anything matching "{searchQuery || selectedCategory}".
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                setSearchQuery('');
                setSelectedCategory('All');
                setSortBy('featured');
              }}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modern Floating Toast */}
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerArea: {
    padding: 12,
  },
  searchBarPlaceholder: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 4,
    paddingBottom: 10,
    paddingTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  categoriesScrollView: {
    marginHorizontal: -8,
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingRight: 24,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sortPills: {
    flexDirection: 'row',
    gap: 6,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  sortPillTextActive: {
    color: '#ffffff',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  resetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  cardWrapper: {
    flex: 1,
    padding: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  brandBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  brandText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  info: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 18,
    height: 36,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#0f172a',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  clearFiltersBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Professional Footer Styles */
  footerWrapper: {
    marginTop: 24,
    paddingHorizontal: 4,
    paddingBottom: 40,
  },
  trustCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  trustHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'center',
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trustItem: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  trustIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  trustSubtitle: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },

  /* WhatsApp Concierge Card */
  conciergeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  conciergeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  conciergeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
    marginLeft: 5,
  },
  conciergeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 22,
  },
  conciergeSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  whatsAppBtn: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsAppBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  /* Milestone Section */
  milestoneSection: {
    alignItems: 'center',
    marginBottom: 26,
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  milestonePill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  backToTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  backToTopText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 6,
  },

  /* Brand Footer & Version */
  brandFooter: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  footerLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  footerLogoImage: {
    width: '100%',
    height: '100%',
  },
  footerBrandName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  footerBrandHighlight: {
    color: '#2563eb',
  },
  footerTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  footerLocation: {
    fontSize: 10,
    color: '#cbd5e1',
  },

  /* Hero Promo Banner Carousel */
  heroCarouselContainer: {
    marginBottom: 14,
  },
  heroBannerCard: {
    width: Dimensions.get('window').width - 24,
    borderRadius: 16,
    padding: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardContent: {
    flex: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 15,
    marginBottom: 10,
  },
  heroTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  heroTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroExploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroExploreText: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 2,
  },
  heroDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  heroDotActive: {
    width: 18,
    backgroundColor: '#2563eb',
  },
});
