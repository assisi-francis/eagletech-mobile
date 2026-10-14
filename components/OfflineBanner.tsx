import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOff, Wifi } from 'lucide-react-native';

export function OfflineBanner() {
  const netInfo = useNetInfo();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;

  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowRestored(false);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (wasOffline) {
      // Show restored banner briefly
      setShowRestored(true);
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setWasOffline(false);
          setShowRestored(false);
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  if (!isOffline && !showRestored) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        showRestored ? styles.restoredBg : styles.offlineBg,
        { transform: [{ translateY }] },
      ]}
    >
      <View style={styles.content}>
        {showRestored ? (
          <Wifi size={14} color="#ffffff" style={styles.icon} />
        ) : (
          <WifiOff size={14} color="#ffffff" style={styles.icon} />
        )}
        <Text style={styles.text}>
          {showRestored
            ? 'Back online — syncing latest updates'
            : "You're offline — cart is saved locally"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingTop: 45,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBg: {
    backgroundColor: '#b91c1c',
  },
  restoredBg: {
    backgroundColor: '#059669',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
