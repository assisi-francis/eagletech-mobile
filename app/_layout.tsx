import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { PaystackProvider } from 'react-native-paystack-webview';
import { useWishlistStore } from '../store/useWishlistStore';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        useWishlistStore.getState().fetchWishlist(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        useWishlistStore.getState().fetchWishlist(session.user.id);
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

    if (session && inAuthScreen) {
      // If logged in and trying to access the auth screen, send to tabs
      router.replace('/(tabs)');
    }
    // We no longer globally force users out if they aren't signed in!
    // They can browse the store anonymously just like the web app.
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <PaystackProvider publicKey="pk_test_945f807df0628c05449526c4c62bd7e882318499" defaultChannels={['bank', 'card', 'qr', 'ussd', 'mobile_money', 'bank_transfer']}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </PaystackProvider>
  );
}
