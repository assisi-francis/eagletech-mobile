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
          syncCartToDB(get().items);
        } else {
          set({ items: [...items, { ...product, cartQuantity: quantity, selectedAddons: addons }] });
          syncCartToDB(get().items);
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
        syncCartToDB(get().items);
      },
      updateQuantity: (productId, quantity) => {
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, cartQuantity: quantity } : item
          ),
        });
        syncCartToDB(get().items);
      },
      clearCart: () => { set({ items: [] }); syncCartToDB([]); },
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


const syncCartToDB = async (items: CartItem[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase.from('carts').upsert(
        { user_id: session.user.id, items },
        { onConflict: 'user_id' }
      );
      if (!error) console.log('Cart saved to DB:', items.length);
    }
  } catch (e) {
    console.warn('Could not sync cart to DB (offline):', e);
  }
};


// Function to pull remote cart on login
export const syncCartFromSupabase = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('carts')
        .select('items')
        .eq('user_id', session.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
        console.warn('Supabase cart fetch failed (offline or network error):', error.message || error);
        return;
      }
        
      if (data) {
        setTimeout(() => {
          useCartStore.getState().setItems(data.items || []);
        }, 100);
      } else if (error && error.code === 'PGRST116') {
        if (useCartStore.getState().items.length > 0) {
          const { error: upsertError } = await supabase.from('carts').upsert(
            { user_id: session.user.id, items: useCartStore.getState().items },
            { onConflict: 'user_id' }
          );
          if (upsertError) console.warn('Error migrating guest cart:', upsertError.message || upsertError);
        }
      }
    }
  } catch (err) {
    console.warn('Network/offline error during cart sync:', err);
  }
};

