import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, addons?: string[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, addons = []) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, cartQuantity: item.cartQuantity + quantity, selectedAddons: addons }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, cartQuantity: quantity, selectedAddons: addons }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, cartQuantity: quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.cartQuantity,
          0
        );
      },
      setItems: (items: CartItem[]) => set({ items }),
    }),
    {
      name: 'eagletech-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Subscribe to store changes and sync to Supabase if logged in
import { supabase } from '../lib/supabase';

useCartStore.subscribe(async (state) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { error } = await supabase.from('carts').upsert(
      { 
        user_id: session.user.id, 
        items: state.items 
      },
      { onConflict: 'user_id' }
    );
    if (error) {
      console.error('Supabase cart sync error:', error);
      // We don't want to spam toasts for every single quantity change if table is missing,
      // but alerting once is helpful.
    } else {
      console.log(`Cart saved to DB: ${state.items.length} items`);
    }
  }
});

import { Alert } from 'react-native';
const toast = { error: (msg: string) => Alert.alert('Error', msg), success: (msg: string) => Alert.alert('Success', msg) };

// Function to pull remote cart on login
export const syncCartFromSupabase = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data, error } = await supabase
      .from('carts')
      .select('items')
      .eq('user_id', session.user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
      console.error('Supabase cart fetch error:', error);
      toast.error('Could not sync cart: ' + error.message);
    }
      
    if (data && data.items && data.items.length > 0) {
      setTimeout(() => {
        useCartStore.getState().setItems(data.items);
      }, 100);
    } else if (useCartStore.getState().items.length > 0) {
      // If DB is empty but local has items, push local to DB (merge guest cart)
      const { error: upsertError } = await supabase.from('carts').upsert(
        { 
          user_id: session.user.id, 
          items: useCartStore.getState().items 
        },
        { onConflict: 'user_id' }
      );
      if (upsertError) {
        toast.error('Failed to save cart: ' + upsertError.message);
      }
    }
  }
};

