import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingType, setLoadingType] = useState<'signin' | 'signup' | null>(null);

  const signInWithEmail = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both email and password');
    setLoadingType('signin');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    setLoadingType(null);
  };

  const signUpWithEmail = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both email and password');
    setLoadingType('signup');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Error', error.message);
    // Removed annoying alert since auto-confirm is on
    setLoadingType(null);
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
          <TextInput
            style={styles.input}
            placeholder="Email"
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

        <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loadingType !== null}>
          {loadingType === 'signin' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={signUpWithEmail} disabled={loadingType !== null}>
          {loadingType === 'signup' ? <ActivityIndicator color="#3b82f6" /> : <Text style={styles.buttonOutlineText}>Sign Up</Text>}
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
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3b82f6' },
  toggleButton: { padding: 16, alignItems: 'center' },
  toggleButtonText: { color: '#3b82f6', fontWeight: '600', fontSize: 15 },
});

