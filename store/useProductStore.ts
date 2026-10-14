import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import { supabase } from '../lib/supabase';

interface ProductState {
  products: Product[];
  categories: string[];
  isLoading: boolean;
  lastFetched: number | null;
  fetchProducts: (force?: boolean) => Promise<void>;
  setProducts: (products: Product[]) => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: ['All'],
      isLoading: false,
      lastFetched: null,

      setProducts: (products: Product[]) => {
        const rawCategories = products
          .map((p) => p.category)
          .filter((c): c is string => Boolean(c));
        const uniqueCategories = ['All', ...Array.from(new Set(rawCategories))];
        set({ products, categories: uniqueCategories });
      },

      fetchProducts: async (force = false) => {
        const { products, lastFetched } = get();
        const now = Date.now();

        // If we already have cached products and fetched within the last 5 minutes, avoid blocking
        const isFresh = lastFetched && now - lastFetched < 5 * 60 * 1000;
        if (!force && isFresh && products.length > 0) {
          return;
        }

        // Only show full loading state if we have no cached products at all
        if (products.length === 0) {
          set({ isLoading: true });
        }

        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const rawCategories = data
              .map((p) => p.category)
              .filter((c): c is string => Boolean(c));
            const uniqueCategories = ['All', ...Array.from(new Set(rawCategories))];

            set({
              products: data,
              categories: uniqueCategories,
              isLoading: false,
              lastFetched: now,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (err) {
          console.warn('Silent fallback: Could not fetch fresh products (offline):', err);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'eagletech-products-cache',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
