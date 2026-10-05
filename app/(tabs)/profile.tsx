import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | undefined>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email));
  }, []);

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.email}>{email}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  email: { fontSize: 16, color: '#64748b', marginBottom: 30 },
  button: { backgroundColor: '#ef4444', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
