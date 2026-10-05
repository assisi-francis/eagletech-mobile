import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{view === 'login' ? 'Sign In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => setView(view === 'login' ? 'signup' : 'login')} 
          disabled={loading}
        >
          <Text style={styles.toggleButtonText}>
            {view === 'login' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
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
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  toggleButton: { padding: 16, alignItems: 'center' },
  toggleButtonText: { color: '#3b82f6', fontWeight: '600', fontSize: 15 },
});
