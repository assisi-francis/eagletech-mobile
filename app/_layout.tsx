import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { PaystackProvider } from 'react-native-paystack-webview';
import { useWishlistStore } from '../store/useWishlistStore';
import { syncCartFromSupabase } from '../store/useCartStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  // --- REALTIME SYNC LISTENER ---
  useEffect(() => {
    let cartSub;
    let wishlistSub;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        cartSub = supabase
          .channel('mobile-carts-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'carts', filter: `user_id=eq.${session.user.id}` }, 
            () => { syncCartFromSupabase(); }
          )
          .subscribe();
          
        wishlistSub = supabase
          .channel('mobile-wishlist-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist', filter: `user_id=eq.${session.user.id}` }, 
            () => { useWishlistStore.getState().fetchWishlist(session.user.id); }
          )
          .subscribe();
      }
    });

    return () => {
      if (cartSub) supabase.removeChannel(cartSub);
      if (wishlistSub) supabase.removeChannel(wishlistSub);
    };
  }, []);
  // ------------------------------

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useWishlistStore.getState().fetchWishlist(session.user.id);
        syncCartFromSupabase();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        useWishlistStore.getState().fetchWishlist(session.user.id);
        syncCartFromSupabase();
      } else if (event === 'SIGNED_OUT') {
        useWishlistStore.getState().clearWishlist();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthScreen = segments[0] === 'auth';

    if (!session && !inAuthScreen) {
      // Strict Auth Wall: Users must sign in to browse or do anything
      router.replace('/auth');
    } else if (session && inAuthScreen) {
      // If logged in and trying to access the auth screen, send to tabs
      router.replace('/(tabs)');
    }
    
    // Give the splash screen a guaranteed 2 second minimum display time so the user can see the logo
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 2000);
  }, [session, loading, segments]);

  if (loading) return null;

  return (
    <PaystackProvider publicKey="pk_test_945f807df0628c05449526c4c62bd7e882318499" defaultChannels={['bank', 'card', 'qr', 'ussd', 'mobile_money', 'bank_transfer']}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </PaystackProvider>
  );
}
