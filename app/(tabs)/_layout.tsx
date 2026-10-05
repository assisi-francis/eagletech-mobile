import { Tabs } from 'expo-router';
import { Home, ShoppingCart, User } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { useCartStore } from '../../store/useCartStore';

const HeaderLogo = () => (
  <View style={styles.headerLogoContainer}>
    <View style={styles.iconBox}>
      {/* Fallback simple text-based logo since SVG requires extra setup in React Native */}
      <Text style={styles.eagleEmoji}>🦅</Text>
    </View>
    <View style={styles.logoTextContainer}>
      <Text style={styles.logoTextEagle}>EAGLE<Text style={styles.logoTextTech}>TECH</Text></Text>
    </View>
  </View>
);

export default function TabLayout() {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((total, item) => total + item.cartQuantity, 0);

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#3b82f6', headerShown: true }}>
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: '',
          headerLeft: () => <HeaderLogo />,
          headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
          title: 'Shop',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', color: '#fff' }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogoContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  iconBox: { width: 40, height: 40, backgroundColor: '#0f172a', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  eagleEmoji: { fontSize: 20, transform: [{ scaleX: -1 }] },
  logoTextContainer: { flexDirection: 'column' },
  logoTextEagle: { fontSize: 18, fontWeight: '900', color: '#3b82f6', letterSpacing: -0.5 },
  logoTextTech: { color: '#0f172a' },
});
