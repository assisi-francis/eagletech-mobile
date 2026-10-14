import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
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
} from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';
import { useProductStore } from '../../store/useProductStore';
import { ProductSkeleton } from '../../components/ProductSkeleton';
import { Toast } from '../../components/Toast';

type SortOption = 'featured' | 'price-asc' | 'price-desc';

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

  useEffect(() => {
    fetchProducts();
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
      const matchesCategory = selectedCategory === 'All' || itemCat === targetCat;

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

  const handleAddToCart = (item: any) => {
    addItem(item, 1);
    setToastMessage(`${item.title || item.name || 'Item'} added to cart`);
    setShowToast(true);
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
        data={filteredProducts}
        extraData={`${selectedCategory}-${sortBy}-${filteredProducts.length}`}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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

            {/* Category Filter Pills (All, Laptops, Phones, etc.) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
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
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    marginBottom: 10,
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
});
