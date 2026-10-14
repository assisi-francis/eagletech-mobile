import { Tabs } from 'expo-router';
import { Home, ShoppingCart, User } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { useCartStore } from '../../store/useCartStore';

import { Image } from 'expo-image';

const HeaderLogo = () => (
  <View style={styles.headerLogoContainer}>
    <View style={styles.iconBox}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logoImage}
        contentFit="cover"
      />
    </View>
    <View style={styles.logoTextContainer}>
      <Text style={styles.logoTextEagle}>
        EAGLE<Text style={styles.logoTextTech}>TECH</Text>
      </Text>
      <Text style={styles.logoSubtext}>HARDWARE & NETWORK</Text>
    </View>
  </View>
);

export default function TabLayout() {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((total, item) => total + item.cartQuantity, 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: '',
          headerLeft: () => <HeaderLogo />,
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
          },
          title: 'Shop',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <ShoppingCart size={22} color={color} />,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogoContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoImage: { width: '100%', height: '100%' },
  logoTextContainer: { flexDirection: 'column' },
  logoTextEagle: { fontSize: 17, fontWeight: '900', color: '#2563eb', letterSpacing: -0.5 },
  logoTextTech: { color: '#0f172a' },
  logoSubtext: { fontSize: 8, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, marginTop: -2 },
});
