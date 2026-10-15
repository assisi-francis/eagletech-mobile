import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOff, Wifi } from 'lucide-react-native';

export function OfflineBanner() {
  const netInfo = useNetInfo();
  const [bannerType, setBannerType] = useState<'offline' | 'restored' | null>(null);
  const wasOfflineRef = useRef(false);
  const translateY = useRef(new Animated.Value(-80)).current;
  const hideTimerRef = useRef<any>(null);

  // Ignore initial null state when NetInfo is still determining network status
  const isDetermined = netInfo.isConnected !== null;
  const isOffline = isDetermined && (netInfo.isConnected === false || netInfo.isInternetReachable === false);

  const slideDown = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const slideUp = (onComplete?: () => void) => {
    Animated.timing(translateY, {
      toValue: -80,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onComplete) onComplete();
    });
  };

  useEffect(() => {
    if (!isDetermined) return;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    if (isOffline) {
      // 1. Device went offline
      wasOfflineRef.current = true;
      setBannerType('offline');
      slideDown();

      // Auto-hide after 3.5 seconds
      hideTimerRef.current = setTimeout(() => {
        slideUp(() => {
          setBannerType(null);
        });
      }, 3500);
    } else if (wasOfflineRef.current) {
      // 2. Device came back online after being offline
      wasOfflineRef.current = false;
      setBannerType('restored');
      slideDown();

      // Auto-hide after 3 seconds
      hideTimerRef.current = setTimeout(() => {
        slideUp(() => {
          setBannerType(null);
        });
      }, 3000);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isOffline, isDetermined]);

  if (!bannerType) return null;

  const isRestored = bannerType === 'restored';

  return (
    <Animated.View
      style={[
        styles.container,
        isRestored ? styles.restoredBg : styles.offlineBg,
        { transform: [{ translateY }] },
      ]}
    >
      <View style={styles.content}>
        {isRestored ? (
          <Wifi size={14} color="#ffffff" style={styles.icon} />
        ) : (
          <WifiOff size={14} color="#ffffff" style={styles.icon} />
        )}
        <Text style={styles.text}>
          {isRestored
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
    paddingBottom: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
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
