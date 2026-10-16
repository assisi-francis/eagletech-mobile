import { Tabs } from 'expo-router';
import { Store, ShoppingCart, User } from 'lucide-react-native';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useCartStore } from '../../store/useCartStore';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

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

function TabBarItem({
  focused,
  label,
  icon: Icon,
  badgeCount,
}: {
  focused: boolean;
  label: string;
  icon: any;
  badgeCount?: number;
}) {
  return (
    <View style={styles.tabItemRoot}>
      {/* Active Top Accent Line */}
      <View
        style={[
          styles.accentIndicator,
          focused && styles.accentIndicatorActive,
        ]}
      />

      {/* Icon Capsule */}
      <View
        style={[
          styles.iconCapsule,
          focused && styles.iconCapsuleActive,
        ]}
      >
        <Icon
          size={20}
          color={focused ? '#2563eb' : '#64748b'}
          strokeWidth={focused ? 2.4 : 1.9}
        />

        {!!badgeCount && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>

      {/* Tab Label */}
      <Text
        style={[
          styles.tabLabel,
          focused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((total, item) => total + item.cartQuantity, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingTop: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          elevation: 10,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: '',
          headerLeft: () => <HeaderLogo />,
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
          },
          title: 'Shop',
          tabBarIcon: ({ focused }) => (
            <TabBarItem focused={focused} label="Shop" icon={Store} />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (e) {}
          },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          headerTitle: 'My Cart',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '800',
            color: '#0f172a',
          },
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
          },
          tabBarIcon: ({ focused }) => (
            <TabBarItem
              focused={focused}
              label="Cart"
              icon={ShoppingCart}
              badgeCount={itemCount}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (e) {}
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Account',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '800',
            color: '#0f172a',
          },
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9',
          },
          tabBarIcon: ({ focused }) => (
            <TabBarItem focused={focused} label="Profile" icon={User} />
          ),
        }}
        listeners={{
          tabPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (e) {}
          },
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

  /* Custom Tab Item Styles */
  tabItemRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: '100%',
  },
  accentIndicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  accentIndicatorActive: {
    backgroundColor: '#2563eb',
  },
  iconCapsule: {
    width: 44,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconCapsuleActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
});
