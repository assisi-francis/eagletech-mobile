import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface WishlistState {
  items: string[]; // array of product slugs
  isLoading: boolean;
  setItems: (items: string[]) => void;
  toggleWishlist: (slug: string, userId: string) => Promise<boolean>; // Returns true if added, false if removed
  fetchWishlist: (userId: string) => Promise<void>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,
  
  setItems: (items) => set({ items }),
  
  fetchWishlist: async (userId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('wishlist')
      .select('product_slug')
      .eq('user_id', userId);
      
    if (!error && data) {
      set({ items: data.map((d) => d.product_slug) });
    }
    set({ isLoading: false });
  },

  toggleWishlist: async (slug, userId) => {
    const { items } = get();
    const isWished = items.includes(slug);
    
    if (isWished) {
      // Optimistic update
      set({ items: items.filter((i) => i !== slug) });
      
      // Remove from DB
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_slug', slug);
        
      return false; // Removed
    } else {
      // Optimistic update
      set({ items: [...items, slug] });
      
      // Add to DB
      await supabase
        .from('wishlist')
        .insert([{ user_id: userId, product_slug: slug }]);
        
      return true; // Added
    }
  },
  
  clearWishlist: () => set({ items: [] }),
}));
