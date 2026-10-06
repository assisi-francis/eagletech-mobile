import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);


  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const redirectUrl = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          // Parse the URL and pass it to Supabase to establish the session
          const urlParams = new URL(result.url.replace('#', '?'));
          const accessToken = urlParams.searchParams.get('access_token');
          const refreshToken = urlParams.searchParams.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          } else {
             // In v2 sometimes creating a session from URL is needed if hash is not parsed properly
             await supabase.auth.getSessionFromUrl(result.url);
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Google Sign-In Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    
    setLoading(true);
    
    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
    } else {
      if (!fullName) {
        setLoading(false);
        return Alert.alert('Error', 'Please enter your full name');
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.emoji}>🦅</Text>
          <Text style={styles.title}>EAGLETECH</Text>
          <Text style={styles.subtitle}>HARDWARE & NETWORK</Text>
        </View>

        <View style={styles.inputContainer}>
          {view === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              onChangeText={setFullName}
              value={fullName}
              autoCapitalize="words"
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Email address"
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#f8fafc" />
          ) : (
            <Text style={styles.buttonText}>{view === 'login' ? 'Sign In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleSignIn} 
          disabled={loading}
        >
          <Text style={styles.googleEmoji}>G</Text>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => setView(view === 'login' ? 'signup' : 'login')} 
          disabled={loading}
        >
          <Text style={styles.toggleButtonText}>
            {view === 'login' ? (
              <>
                <Text style={styles.toggleTextMuted}>Don't have an account? </Text>
                <Text style={styles.toggleTextHighlight}>Sign up</Text>
              </>
            ) : (
              <>
                <Text style={styles.toggleTextMuted}>Already have an account? </Text>
                <Text style={styles.toggleTextHighlight}>Sign in</Text>
              </>
            )}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 40, transform: [{ scaleX: -1 }] },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
  subtitle: { fontSize: 10, fontWeight: 'bold', color: '#64748b', letterSpacing: 2, marginTop: 2 },
  inputContainer: { gap: 12, marginBottom: 24 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  button: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  toggleButton: { padding: 16, alignItems: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 10, color: '#64748b', fontSize: 13, fontWeight: '500' },
  googleButton: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  googleEmoji: { fontSize: 18, marginRight: 8, fontWeight: 'bold', color: '#ea4335' },
  googleButtonText: { color: '#0f172a', fontWeight: '600', fontSize: 15 },

  toggleButtonText: { fontSize: 15 },
  toggleTextMuted: { color: '#64748b', fontWeight: '500' },
  toggleTextHighlight: { color: '#0f172a', fontWeight: '700' },
});
