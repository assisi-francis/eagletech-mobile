import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../lib/supabase';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Fingerprint } from 'lucide-react-native';
import {
  isBiometricSupported,
  getBiometricCredentials,
  saveBiometricCredentials,
  promptBiometricAuth,
  setBiometricEnabled,
} from '../lib/biometrics';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const supported = await isBiometricSupported();
    const creds = await getBiometricCredentials();
    if (supported && creds) {
      setHasBiometrics(true);
    }
  };

  const handleBiometricLogin = async () => {
    const creds = await getBiometricCredentials();
    if (!creds) return;

    const success = await promptBiometricAuth();
    if (!success) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const redirectTo = makeRedirectUri({ path: 'callback' });
      if (__DEV__) console.log('Google OAuth redirect URL:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success' || !result.url) {
          if (__DEV__) console.log('Google sign-in browser closed:', result.type);
          return;
        }
        if (__DEV__) console.log('Google OAuth returned URL:', result.url);

        // Supabase implicit flow
        const urlParams = new URL(result.url.replace('#', '?'));
        const accessToken = urlParams.searchParams.get('access_token');
        const refreshToken = urlParams.searchParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          return;
        }
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyError = (err: any) => {
    const msg = err?.message || String(err || '');
    if (
      msg.includes('UnknownHostException') ||
      msg.includes('fetch failed') ||
      msg.includes('Network request failed') ||
      msg.includes('Failed to fetch')
    ) {
      return 'Unable to connect to the server. Please check your phone\'s internet connection (or Private DNS settings) and try again.';
    }
    return msg;
  };

  const handleAuth = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');

    setLoading(true);

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        Alert.alert('Sign In Failed', getFriendlyError(error));
      } else {
        // Automatically save for biometrics on successful login
        const supported = await isBiometricSupported();
        if (supported) {
          await saveBiometricCredentials(email.trim(), password);
          await setBiometricEnabled(true);
        }
      }
    } else {
      if (!fullName) {
        setLoading(false);
        return Alert.alert('Error', 'Please enter your full name');
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        Alert.alert('Sign Up Failed', getFriendlyError(error));
      } else {
        const supported = await isBiometricSupported();
        if (supported) {
          await saveBiometricCredentials(email.trim(), password);
          await setBiometricEnabled(true);
        }
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Logo Header */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoImage}
              contentFit="cover"
            />
          </View>
          <Text style={styles.title}>
            EAGLE<Text style={styles.titleHighlight}>TECH</Text>
          </Text>
          <Text style={styles.subtitle}>HARDWARE & NETWORK</Text>
        </View>

        <View style={styles.inputContainer}>
          {view === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#94a3b8"
              onChangeText={setFullName}
              value={fullName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#94a3b8"
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
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

        {/* Biometric Quick Login Button */}
        {view === 'login' && hasBiometrics && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={loading}
          >
            <Fingerprint size={20} color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={styles.biometricButtonText}>Sign In with Biometrics</Text>
          </TouchableOpacity>
        )}

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
          <Svg width="20" height="20" viewBox="0 0 24 24" style={styles.googleLogo}>
            <Path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <Path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <Path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <Path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </Svg>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: { width: '100%', height: '100%' },
  title: { fontSize: 24, fontWeight: '900', color: '#2563eb', letterSpacing: -0.5 },
  titleHighlight: { color: '#0f172a' },
  subtitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, marginTop: 2 },
  inputContainer: { gap: 12, marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
    color: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  biometricButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 12, color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleLogo: { marginRight: 10 },
  googleButtonText: { color: '#334155', fontSize: 15, fontWeight: '600' },
  toggleButton: { marginTop: 24, alignItems: 'center' },
  toggleButtonText: { fontSize: 14 },
  toggleTextMuted: { color: '#64748b' },
  toggleTextHighlight: { color: '#2563eb', fontWeight: '700' },
});
